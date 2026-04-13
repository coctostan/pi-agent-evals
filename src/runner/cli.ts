#!/usr/bin/env node
/**
 * pi-eval CLI — run behavioral evals against pi agents via cmux.
 *
 * Usage:
 *   npx pi-eval run <target>          Run eval(s) matching name, category, or "all"
 *
 * Options:
 *   --timeout <ms>                    Timeout per eval prompt (default: 120000)
 *   --output-dir <path>               Results output directory (default: "results")
 *   --model <name>                    Model name for metadata (default: "unknown")
 *   --startup-delay <ms>              Wait time for pi to start (default: 5000)
 *   --poll-interval <ms>              Trace file poll frequency (default: 1000)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { listEvalDefinitions, loadEvalDefinition } from "../loader.js";
import type { EvalDefinition } from "../types.js";
import { checkCmuxEnvironment, runSingleEval } from "./cmux-runner.js";
import type { EvalRunResult, RunSummary, RunnerOptions } from "./types.js";

// ── Arg parsing ─────────────────────────────────────────────

interface ParsedArgs {
  subcommand: string | undefined;
  target: string | undefined;
  timeout: number;
  outputDir: string;
  model: string;
  startupDelay: number;
  pollInterval: number;
}

function parseArgs(argv: string[]): ParsedArgs {
  // Skip node and script path
  const args = argv.slice(2);

  const result: ParsedArgs = {
    subcommand: undefined,
    target: undefined,
    timeout: 120_000,
    outputDir: "results",
    model: "unknown",
    startupDelay: 5_000,
    pollInterval: 1_000,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--timeout" && i + 1 < args.length) {
      result.timeout = parseInt(args[++i], 10);
    } else if (arg === "--output-dir" && i + 1 < args.length) {
      result.outputDir = args[++i];
    } else if (arg === "--model" && i + 1 < args.length) {
      result.model = args[++i];
    } else if (arg === "--startup-delay" && i + 1 < args.length) {
      result.startupDelay = parseInt(args[++i], 10);
    } else if (arg === "--poll-interval" && i + 1 < args.length) {
      result.pollInterval = parseInt(args[++i], 10);
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith("--")) {
      if (!result.subcommand) {
        result.subcommand = arg;
      } else if (!result.target) {
        result.target = arg;
      }
    }

    i++;
  }

  return result;
}

// ── Usage / help ────────────────────────────────────────────

function printUsage(): void {
  console.log(`
pi-eval — Run behavioral evals against pi agents via cmux

Usage:
  pi-eval run <target>       Run eval(s) matching name, category, or "all"
  pi-eval run all            Run all evals
  pi-eval run <eval-name>    Run a specific eval (e.g., read-over-cat)
  pi-eval run <category>     Run all evals in a category (e.g., tool-routing)

Options:
  --timeout <ms>             Timeout per eval prompt (default: 120000)
  --output-dir <path>        Results output directory (default: "results")
  --model <name>             Model name for metadata (default: "unknown")
  --startup-delay <ms>       Wait time for pi to start (default: 5000)
  --poll-interval <ms>       Trace file poll frequency (default: 1000)
  -h, --help                 Show this help message

Prerequisites:
  - Must be run from inside a cmux terminal (socket access restriction)
  - Must be run from the project root where the pi extension is declared
  - cmux binary must be available (auto-detected or set CMUX_CLI_PATH)
`);
}

// ── Eval filtering ──────────────────────────────────────────

function resolveEvals(target: string, evalsDir: string): EvalDefinition[] {
  const allNames = listEvalDefinitions(evalsDir);

  if (allNames.length === 0) {
    console.error(`No eval definitions found in ${evalsDir}/`);
    process.exit(1);
  }

  // "all" — run everything
  if (target === "all") {
    return allNames.map((name) => loadEvalDefinition(name, evalsDir));
  }

  // Try exact name match
  if (allNames.includes(target)) {
    return [loadEvalDefinition(target, evalsDir)];
  }

  // Try category match
  const allDefs = allNames.map((name) => loadEvalDefinition(name, evalsDir));
  const categoryMatches = allDefs.filter((def) => def.category === target);
  if (categoryMatches.length > 0) {
    return categoryMatches;
  }

  // No match — show available
  const categories = [...new Set(allDefs.map((d) => d.category))];
  console.error(`Unknown target: "${target}"\n`);
  console.error(`Available evals: ${allNames.join(", ")}`);
  console.error(`Available categories: ${categories.join(", ")}`);
  process.exit(1);
}

// ── Results formatting ──────────────────────────────────────

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

function printResults(results: EvalRunResult[]): void {
  console.log("\n════════════════════════════════════════");
  console.log("  EVAL RESULTS");
  console.log("════════════════════════════════════════\n");

  for (const r of results) {
    const icon = r.error ? "⚠" : r.passed ? "✓" : "✗";
    const status = r.error ? `ERROR: ${r.error}` : r.passed ? "PASS" : "FAIL";
    console.log(`  ${icon} ${r.evalName}[${r.promptIndex}] — ${status} (${r.duration}ms)`);

    if (!r.error) {
      for (const a of r.assertions) {
        const aIcon = a.pass ? "  ✓" : "  ✗";
        console.log(`    ${aIcon} ${a.assertion.message} — ${a.detail}`);
      }
    }
  }

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && !r.error).length;
  const errored = results.filter((r) => !!r.error).length;

  console.log("\n────────────────────────────────────────");
  console.log(`  Total: ${total} | Passed: ${passed} | Failed: ${failed} | Errors: ${errored}`);
  console.log("────────────────────────────────────────\n");
}

// ── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  // Validate subcommand
  if (!parsed.subcommand) {
    printUsage();
    process.exit(1);
  }

  if (parsed.subcommand !== "run") {
    console.error(`Unknown command: "${parsed.subcommand}". Only "run" is supported.\n`);
    printUsage();
    process.exit(1);
  }

  if (!parsed.target) {
    console.error('Missing target. Use "all", an eval name, or a category.\n');
    printUsage();
    process.exit(1);
  }

  // Check cmux environment
  const cmuxEnv = checkCmuxEnvironment();
  if (!cmuxEnv.available) {
    console.error(`cmux not available: ${cmuxEnv.message}`);
    process.exit(1);
  }

  // Resolve paths
  const projectDir = resolve(process.cwd());
  const evalsDir = join(projectDir, "evals");

  const options: RunnerOptions = {
    timeout: parsed.timeout,
    outputDir: resolve(parsed.outputDir),
    evalsDir,
    projectDir,
    model: parsed.model,
    piStartupDelay: parsed.startupDelay,
    pollInterval: parsed.pollInterval,
  };

  // Resolve evals
  const evalDefs = resolveEvals(parsed.target, evalsDir);

  console.log(`\npi-eval: Running ${evalDefs.length} eval(s)\n`);
  console.log(`  Project:   ${projectDir}`);
  console.log(`  Timeout:   ${options.timeout}ms`);
  console.log(`  Output:    ${options.outputDir}`);
  console.log(`  Model:     ${options.model}`);
  console.log(`  Startup:   ${options.piStartupDelay}ms`);
  console.log(`  Poll:      ${options.pollInterval}ms`);
  console.log("");

  // Run evals sequentially
  const allResults: EvalRunResult[] = [];

  for (const evalDef of evalDefs) {
    console.log(`─── ${evalDef.name} (${evalDef.category}) ───`);
    console.log(`  "${evalDef.description}"`);

    for (let pi = 0; pi < evalDef.prompts.length; pi++) {
      const prompt = evalDef.prompts[pi];
      console.log(`\n  Prompt ${pi + 1}/${evalDef.prompts.length}:`);

      const result = await runSingleEval(evalDef, pi, prompt, options);
      allResults.push(result);
    }

    console.log("");
  }

  // Build summary
  const summary: RunSummary = {
    timestamp: new Date().toISOString(),
    model: options.model ?? "unknown",
    evals: allResults,
    totals: {
      total: allResults.length,
      passed: allResults.filter((r) => r.passed).length,
      failed: allResults.filter((r) => !r.passed && !r.error).length,
      errored: allResults.filter((r) => !!r.error).length,
    },
  };

  // Print results
  printResults(allResults);

  // Write results JSON
  mkdirSync(options.outputDir, { recursive: true });
  const resultsPath = join(options.outputDir, `${formatTimestamp()}.json`);
  writeFileSync(resultsPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`Results written to: ${resultsPath}`);

  // Exit code
  const allPassed = summary.totals.passed === summary.totals.total;
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
