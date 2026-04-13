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
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Tracer } from "./src/tracer.js";

// Re-export for external consumers (Phase B will import these)
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
};

export default extension;
