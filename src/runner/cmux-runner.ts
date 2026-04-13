/**
 * CMUX Runner — orchestrates eval execution via cmux panes.
 *
 * For each eval prompt:
 *   1. Run setup commands (create /tmp fixtures)
 *   2. Delete stale trace file
 *   3. Create a cmux pane (split terminal in current workspace)
 *   4. Start pi in the project dir (so the tracer extension loads)
 *   5. Send the eval prompt
 *   6. Poll for the trace file
 *   7. Run assertions against the trace
 *   8. Close the pane
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";

import { checkAssertions } from "../assertions.js";
import type { EvalDefinition, EvalTrace } from "../types.js";
import type { CmuxEnvironment, EvalRunResult, RunnerOptions } from "./types.js";

// ── cmux binary resolution ──────────────────────────────────

const MACOS_CMUX_PATH = "/Applications/cmux.app/Contents/Resources/bin/cmux";

/**
 * Resolve the cmux CLI binary path.
 * Search order:
 *   1. CMUX_CLI_PATH env var (explicit override)
 *   2. `cmux` in PATH
 *   3. macOS default app bundle location
 */
export function resolveCmuxBin(): string {
  // 1. Explicit override
  const envPath = process.env.CMUX_CLI_PATH;
  if (envPath) {
    try {
      execSync(`"${envPath}" version`, { encoding: "utf-8", stdio: "pipe" });
      return envPath;
    } catch {
      throw new Error(
        `CMUX_CLI_PATH is set to "${envPath}" but the binary is not executable.`,
      );
    }
  }

  // 2. In PATH
  try {
    const which = execSync("which cmux", { encoding: "utf-8", stdio: "pipe" }).trim();
    if (which) return which;
  } catch {
    // not in PATH
  }

  // 3. macOS default
  if (existsSync(MACOS_CMUX_PATH)) {
    return MACOS_CMUX_PATH;
  }

  throw new Error(
    "cmux CLI not found. Searched:\n" +
      "  1. CMUX_CLI_PATH env var (not set)\n" +
      "  2. cmux in PATH (not found)\n" +
      `  3. ${MACOS_CMUX_PATH} (not found)\n\n` +
      "Install cmux from https://cmux.dev or set CMUX_CLI_PATH.",
  );
}

/**
 * Check the cmux environment: binary availability and whether
 * we're running inside a cmux terminal (required for socket access).
 */
export function checkCmuxEnvironment(): CmuxEnvironment {
  let bin: string | null = null;
  try {
    bin = resolveCmuxBin();
  } catch {
    return {
      available: false,
      inCmux: false,
      bin: null,
      message: "cmux CLI not found. Install from https://cmux.dev or set CMUX_CLI_PATH.",
    };
  }

  const inCmux = Boolean(process.env.CMUX_WORKSPACE_ID);

  if (!inCmux) {
    return {
      available: false,
      inCmux: false,
      bin,
      message:
        "cmux CLI found but you are not running inside cmux. " +
        "The socket restricts access to cmux-spawned processes. " +
        "Either run this command from a cmux terminal, or set " +
        "CMUX_SOCKET_MODE=allowAll in cmux settings.",
    };
  }

  return {
    available: true,
    inCmux: true,
    bin,
    message: "cmux available and running inside cmux terminal.",
  };
}

// ── cmux pane helpers ───────────────────────────────────────

/**
 * Create a new cmux pane and return the surface ref for targeting.
 * Falls back to parsing list-pane-surfaces if new-pane --json
 * doesn't return a surface ref directly.
 */
function createPane(cmuxBin: string): string {
  // Capture panes before creating a new one (for diff-based fallback)
  let panesBefore: string[] = [];
  try {
    const listOutput = execSync(`"${cmuxBin}" list-panes --json`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const parsed = JSON.parse(listOutput);
    if (Array.isArray(parsed)) {
      panesBefore = parsed.map((p: { id?: string; ref?: string }) => p.id ?? p.ref ?? "");
    }
  } catch {
    // Can't list panes — will rely on new-pane output
  }

  // Create the pane
  const output = execSync(`"${cmuxBin}" new-pane --json`, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  // Try to parse the surface ref from JSON output
  try {
    const parsed = JSON.parse(output);
    // Look for surface_id, surfaceId, surface, ref — cmux output format may vary
    const surfaceRef =
      parsed.surface_id ??
      parsed.surfaceId ??
      parsed.surface ??
      parsed.surface_ref ??
      parsed.ref ??
      null;
    if (surfaceRef) return String(surfaceRef);

    // If the response has a pane ref, get its surfaces
    const paneRef = parsed.pane_id ?? parsed.paneId ?? parsed.pane ?? parsed.id ?? null;
    if (paneRef) {
      return getSurfaceForPane(cmuxBin, String(paneRef));
    }
  } catch {
    // JSON parse failed — try line-based parsing
    const trimmed = output.trim();
    // Handle "OK surface:N pane:N workspace:N" format
    const surfaceMatch = trimmed.match(/surface:(\d+)/);
    if (surfaceMatch) {
      return `surface:${surfaceMatch[1]}`;
    }
      if (trimmed.startsWith("pane:")) {
      return getSurfaceForPane(cmuxBin, trimmed);
    }
  }

  // Fallback: diff pane lists to find the new pane, then get its surface
  try {
    const listOutput = execSync(`"${cmuxBin}" list-panes --json`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const parsed = JSON.parse(listOutput);
    if (Array.isArray(parsed)) {
      const panesAfter = parsed.map((p: { id?: string; ref?: string }) => p.id ?? p.ref ?? "");
      const newPanes = panesAfter.filter((p: string) => !panesBefore.includes(p));
      if (newPanes.length > 0) {
        return getSurfaceForPane(cmuxBin, newPanes[0]);
      }
    }
  } catch {
    // Last resort — no surface ref available
  }

  throw new Error(
    "Failed to determine surface ref from cmux new-pane. " +
      `Raw output: ${output.trim().slice(0, 200)}`,
  );
}

/** Get the first surface ref for a given pane. */
function getSurfaceForPane(cmuxBin: string, paneRef: string): string {
  const output = execSync(`"${cmuxBin}" list-pane-surfaces --pane ${paneRef} --json`, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  try {
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const surface = parsed[0];
      return String(surface.id ?? surface.ref ?? surface.surface_id ?? surface);
    }
  } catch {
    // Try line-based
    const firstLine = output.trim().split("\n")[0];
    if (firstLine?.startsWith("surface:")) return firstLine;
  }

  throw new Error(`No surfaces found for pane ${paneRef}`);
}

/** Send text to a specific cmux surface. */
function sendToSurface(cmuxBin: string, surfaceRef: string, text: string): void {
  // Escape text for shell — use stdin to avoid shell escaping issues
  execSync(`"${cmuxBin}" send --surface ${surfaceRef} -- ${JSON.stringify(text)}`, {
    encoding: "utf-8",
    stdio: "pipe",
  });
}

/** Close a cmux surface. */
function closeSurface(cmuxBin: string, surfaceRef: string): void {
  try {
    execSync(`"${cmuxBin}" close-surface --surface ${surfaceRef}`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    // Best-effort cleanup — don't throw on close failure
  }
}

// ── Trace polling ───────────────────────────────────────────

/**
 * Poll for the trace file to appear with valid content.
 * Validates: exists, parses as JSON, has non-empty entries, startedAt is recent.
 */
async function pollForTrace(
  tracePath: string,
  runStartTime: number,
  options: RunnerOptions,
): Promise<EvalTrace> {
  const deadline = Date.now() + options.timeout;

  while (Date.now() < deadline) {
    if (existsSync(tracePath)) {
      try {
        const content = readFileSync(tracePath, "utf-8");
        const trace = JSON.parse(content) as EvalTrace;

        // Validate: non-empty entries and startedAt is from this run
        if (trace.entries && trace.entries.length > 0 && trace.startedAt) {
          const traceStart = new Date(trace.startedAt).getTime();
          if (traceStart >= runStartTime - 5000) {
            // Within 5s tolerance
            return trace;
          }
        }
      } catch {
        // File exists but isn't valid JSON yet — keep polling
      }
    }

    await setTimeout(options.pollInterval);
  }

  throw new Error(`Trace file not detected within ${options.timeout}ms timeout`);
}

// ── Main runner ─────────────────────────────────────────────

/**
 * Run a single eval prompt: create pane, start pi, send prompt,
 * poll for trace, run assertions, clean up.
 */
export async function runSingleEval(
  evalDef: EvalDefinition,
  promptIndex: number,
  prompt: string,
  options: RunnerOptions,
): Promise<EvalRunResult> {
  const startTime = Date.now();
  const cmuxBin = resolveCmuxBin();
  const tracePath = join(options.projectDir, ".pi", "eval-trace.json");
  let surfaceRef: string | null = null;

  try {
    // 1. Run setup commands
    if (evalDef.setup) {
      for (const cmd of evalDef.setup) {
        execSync(cmd, { cwd: "/tmp", encoding: "utf-8", stdio: "pipe" });
      }
    }

    // 2. Delete stale trace file
    if (existsSync(tracePath)) {
      unlinkSync(tracePath);
    }

    // 3. Create cmux pane
    console.log(`  Creating cmux pane...`);
    surfaceRef = createPane(cmuxBin);
    console.log(`  Pane created: ${surfaceRef}`);

    // 4. Start pi in the project dir
    sendToSurface(cmuxBin, surfaceRef, `cd ${options.projectDir}\n`);
    await setTimeout(500); // Brief pause for cd
    // Build pi command with optional --model and --thinking flags
    let piCmd = "pi";
    if (options.modelFlag) {
      piCmd += ` --model ${options.modelFlag}`;
    }
    if (options.thinkingFlag) {
      piCmd += ` --thinking ${options.thinkingFlag}`;
    }
    sendToSurface(cmuxBin, surfaceRef, `${piCmd}\n`);

    // 5. Wait for pi to start
    console.log(`  Waiting ${options.piStartupDelay}ms for pi to start...`);
    await setTimeout(options.piStartupDelay);

    // 6. Send the eval prompt
    console.log(`  Sending prompt: "${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}"`);
    const runStartTime = Date.now();
    sendToSurface(cmuxBin, surfaceRef, `${prompt}\n`);

    // 7. Poll for trace file
    console.log(`  Polling for trace (timeout: ${options.timeout}ms)...`);
    const trace = await pollForTrace(tracePath, runStartTime, options);

    // 8. Run assertions
    const results = checkAssertions(trace, evalDef.assertions);
    const allPassed = results.every((r) => r.pass);
    const duration = Date.now() - startTime;

    console.log(`  ${allPassed ? "✓" : "✗"} ${evalDef.name}[${promptIndex}] (${duration}ms)`);

    return {
      evalName: evalDef.name,
      description: evalDef.description,
      category: evalDef.category,
      promptIndex,
      prompt,
      assertions: results,
      passed: allPassed,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.log(`  ✗ ${evalDef.name}[${promptIndex}] ERROR: ${errorMessage}`);

    return {
      evalName: evalDef.name,
      description: evalDef.description,
      category: evalDef.category,
      promptIndex,
      prompt,
      assertions: [],
      passed: false,
      duration,
      error: errorMessage,
    };
  } finally {
    // 9. Always clean up the pane
    if (surfaceRef) {
      closeSurface(cmuxBin, surfaceRef);
    }
  }
}
