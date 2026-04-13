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
 */

import { join } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { checkAssertions } from "./src/assertions.js";
import { loadEvalDefinition } from "./src/loader.js";
import { Tracer } from "./src/tracer.js";

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
};

export default extension;
