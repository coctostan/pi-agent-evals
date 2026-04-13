/**
 * pi-agent-evals — Extension entry point.
 *
 * Registers the tracer on passive lifecycle events:
 *   agent_start  → clear trace for new loop
 *   turn_start   → track turn index
 *   tool_execution_start → record tool call
 *   tool_execution_end   → record result (isError)
 *   agent_end    → write trace to .pi/eval-trace.json
 *
 * Commands:
 *   /eval-trace  → dump current in-memory trace (debugging)
 *   /eval-check  → run assertions for an eval against the current trace
 *   /eval-run    → run eval(s) via cmux and report results
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { checkAssertions } from "./src/assertions.js";
import { listEvalDefinitions, loadEvalDefinition } from "./src/loader.js";
import { checkCmuxEnvironment, runSingleEval } from "./src/runner/cmux-runner.js";
import type { EvalRunResult, RunSummary } from "./src/runner/types.js";
import { Tracer } from "./src/tracer.js";
import type { EvalDefinition } from "./src/types.js";

// Re-export for external consumers
export { checkAssertions } from "./src/assertions.js";
export { loadEvalDefinition, listEvalDefinitions } from "./src/loader.js";
export { Tracer } from "./src/tracer.js";
export type {
  Assertion,
  AssertionResult,
  EvalDefinition,
  EvalTrace,
  ToolTraceEntry,
} from "./src/types.js";

const extension = (pi: ExtensionAPI): void => {
  const tracer = new Tracer();

  // ── Lifecycle hooks (passive/observational) ──

  pi.on("agent_start", () => {
    tracer.onAgentStart();
  });

  pi.on("turn_start", (event) => {
    tracer.onTurnStart(event.turnIndex);
  });

  pi.on("tool_execution_start", (event) => {
    tracer.onToolExecutionStart(
      event.toolCallId,
      event.toolName,
      event.args as Record<string, unknown>,
    );
  });

  pi.on("tool_execution_end", (event) => {
    tracer.onToolExecutionEnd(event.toolCallId, event.isError);
  });

  pi.on("agent_end", async (_event, ctx) => {
    await tracer.writeTrace(ctx);
  });

  // ── Commands ──

  pi.registerCommand("eval-trace", {
    description: "Dump current session trace for debugging",
    handler: async (_args, ctx) => {
      const trace = tracer.getTrace(ctx);
      const json = JSON.stringify(trace, null, 2);
      ctx.ui.notify(json, "info");
    },
  });

  pi.registerCommand("eval-check", {
    description: "Run assertions for an eval against the current trace",
    handler: async (args, ctx) => {
      const evalName = (args as string)?.trim();
      if (!evalName) {
        ctx.ui.notify(
          "Usage: /eval-check <eval-name>\n\nExample: /eval-check read-over-cat",
          "warning",
        );
        return;
      }

      let evalDef;
      try {
        const evalsDir = join(ctx.cwd, "evals");
        evalDef = loadEvalDefinition(evalName, evalsDir);
      } catch (err) {
        ctx.ui.notify(
          `Failed to load eval: ${err instanceof Error ? err.message : err}`,
          "warning",
        );
        return;
      }

      const trace = tracer.getTrace(ctx);
      const results = checkAssertions(trace, evalDef.assertions);

      const passed = results.filter((r) => r.pass).length;
      const total = results.length;
      const allPassed = passed === total;

      const lines: string[] = [
        `eval: ${evalDef.name}`,
        `description: ${evalDef.description}`,
        "",
      ];

      for (const result of results) {
        const icon = result.pass ? "✓" : "✗";
        lines.push(`${icon} ${result.assertion.message} — ${result.detail}`);
      }

      lines.push("", `Result: ${passed}/${total} passed`);

      ctx.ui.notify(lines.join("\n"), allPassed ? "info" : "warning");
    },
  });

  pi.registerCommand("eval-run", {
    description: "Run eval(s) via cmux: /eval-run <name|category|all> [--baseline] [--model <model>] [--thinking <level>]",
    handler: async (args, ctx) => {
      // 1. Parse args
      const parts = (args as string)?.trim().split(/\s+/).filter(Boolean) ?? [];
      // Extract flag values
      let modelFlag: string | undefined;
      let thinkingFlag: string | undefined;
      const flagIndices = new Set<number>();
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "--model" && parts[i + 1]) {
          flagIndices.add(i);
          flagIndices.add(i + 1);
          modelFlag = parts[++i];
        } else if (parts[i] === "--thinking" && parts[i + 1]) {
          flagIndices.add(i);
          flagIndices.add(i + 1);
          thinkingFlag = parts[++i];
        } else if (parts[i] === "--baseline") {
          flagIndices.add(i);
        }
      }
      const target = parts.find((p, idx) => !p.startsWith("--") && !flagIndices.has(idx));
      const baseline = parts.includes("--baseline");

      if (!target) {
        ctx.ui.notify(
          "Usage: /eval-run <name|category|all> [--baseline] [--model <model>] [--thinking <level>]\n\n" +
            "Examples:\n" +
            "  /eval-run all                          Run all evals\n" +
            "  /eval-run all --baseline               Run all and save as baseline\n" +
            "  /eval-run all --model claude-sonnet-4   Run all with a specific model\n" +
            "  /eval-run all --thinking high           Run all with a specific thinking level\n" +
            "  /eval-run read-over-cat                Run a specific eval\n" +
            "  /eval-run tool-routing                 Run all evals in a category",
          "warning",
        );
        return;
      }

      // Validate thinking level
      const validThinkingLevels = ["off", "minimal", "low", "medium", "high", "xhigh"];
      if (thinkingFlag && !validThinkingLevels.includes(thinkingFlag)) {
        ctx.ui.notify(
          `Invalid thinking level: "${thinkingFlag}"\n\nValid levels: ${validThinkingLevels.join(", ")}`,
          "error",
        );
        return;
      }

      // Validate model name against pi --list-models
      if (modelFlag) {
        try {
          const listOutput = execSync("pi --list-models", {
            encoding: "utf-8",
            stdio: "pipe",
            timeout: 10_000,
          });
          const lowerOutput = listOutput.toLowerCase();
          const lowerModel = modelFlag.toLowerCase();
          if (!lowerOutput.includes(lowerModel)) {
            ctx.ui.notify(
              `Unknown model: "${modelFlag}"\n\nAvailable models:\n${listOutput.trim()}`,
              "error",
            );
            return;
          }
        } catch {
          // pi --list-models failed — warn but proceed
          ctx.ui.notify(
            `Warning: Could not validate model "${modelFlag}" (pi --list-models failed). Proceeding anyway.`,
            "warning",
          );
        }
      }

      // 2. Check cmux
      const cmuxEnv = checkCmuxEnvironment();
      if (!cmuxEnv.available) {
        ctx.ui.notify(`cmux not available: ${cmuxEnv.message}`, "error");
        return;
      }

      // 3. Resolve evals
      const evalsDir = join(ctx.cwd, "evals");
      const allNames = listEvalDefinitions(evalsDir);
      if (allNames.length === 0) {
        ctx.ui.notify(`No eval definitions found in ${evalsDir}/`, "error");
        return;
      }

      let evalDefs: EvalDefinition[];
      if (target === "all") {
        evalDefs = allNames.map((name) => loadEvalDefinition(name, evalsDir));
      } else if (allNames.includes(target)) {
        evalDefs = [loadEvalDefinition(target, evalsDir)];
      } else {
        const allDefs = allNames.map((name) => loadEvalDefinition(name, evalsDir));
        const categoryMatches = allDefs.filter((d) => d.category === target);
        if (categoryMatches.length > 0) {
          evalDefs = categoryMatches;
        } else {
          const categories = [...new Set(allDefs.map((d) => d.category))];
          ctx.ui.notify(
            `Unknown target: "${target}"\n\n` +
              `Available evals: ${allNames.join(", ")}\n` +
              `Available categories: ${categories.join(", ")}`,
            "warning",
          );
          return;
        }
      }

      // 4. Build runner options
      const outputDir = resolve(join(ctx.cwd, "results"));
      const options = {
        timeout: 120_000,
        outputDir,
        evalsDir,
        projectDir: ctx.cwd,
        model: modelFlag ?? ctx.model?.name ?? "unknown",
        modelFlag,
        thinkingFlag,
        piStartupDelay: 5_000,
        pollInterval: 1_000,
      };

      ctx.ui.notify(`Running ${evalDefs.length} eval(s)...`, "info");

      // 5. Run evals
      const allResults: EvalRunResult[] = [];
      for (const evalDef of evalDefs) {
        for (let promptIdx = 0; promptIdx < evalDef.prompts.length; promptIdx++) {
          const result = await runSingleEval(
            evalDef,
            promptIdx,
            evalDef.prompts[promptIdx],
            options,
          );
          allResults.push(result);
        }
      }

      // 6. Build summary
      const summary: RunSummary = {
        timestamp: new Date().toISOString(),
        model: options.model,
        evals: allResults,
        totals: {
          total: allResults.length,
          passed: allResults.filter((r) => r.passed).length,
          failed: allResults.filter((r) => !r.passed && !r.error).length,
          errored: allResults.filter((r) => !!r.error).length,
        },
      };

      // 7. Write results
      mkdirSync(outputDir, { recursive: true });
      const pad = (n: number) => String(n).padStart(2, "0");
      const now = new Date();
      const ts =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const resultsPath = join(outputDir, `${ts}.json`);
      writeFileSync(resultsPath, JSON.stringify(summary, null, 2), "utf-8");

      const writtenFiles = [resultsPath];
      if (baseline) {
        const baselinePath = join(outputDir, "baseline.json");
        writeFileSync(baselinePath, JSON.stringify(summary, null, 2), "utf-8");
        writtenFiles.push(baselinePath);
      }

      // 8. Format and display results
      const lines: string[] = ["═══ EVAL RESULTS ═══", ""];
      for (const r of allResults) {
        const icon = r.error ? "⚠" : r.passed ? "✓" : "✗";
        const status = r.error ? `ERROR: ${r.error}` : r.passed ? "PASS" : "FAIL";
        lines.push(
          `${icon} ${r.evalName}[${r.promptIndex}] — ${status} (${r.duration}ms)`,
        );
        if (!r.error) {
          for (const a of r.assertions) {
            lines.push(
              `  ${a.pass ? "✓" : "✗"} ${a.assertion.message} — ${a.detail}`,
            );
          }
        }
      }
      const { totals } = summary;
      lines.push(
        "",
        `Total: ${totals.total} | Passed: ${totals.passed} | Failed: ${totals.failed} | Errors: ${totals.errored}`,
      );
      lines.push("", ...writtenFiles.map((f) => `Written: ${f}`));

      ctx.ui.notify(
        lines.join("\n"),
        totals.passed === totals.total ? "info" : "warning",
      );
    },
  });
};

export default extension;
