/**
 * Tracer — captures tool execution events during a pi agent session.
 *
 * Uses passive tool_execution_start/tool_execution_end events (not the
 * interceptive tool_call/tool_result hooks) to avoid interfering with
 * tool execution.
 *
 * Trace is cleared on each agent_start and written to disk on agent_end.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { EvalTrace, ToolTraceEntry } from "./types.js";

export class Tracer {
  private entries: ToolTraceEntry[] = [];
  private currentTurnIndex = 0;
  private callCountInTurn = 0;
  private pendingCalls = new Map<string, number>();
  private startedAt = "";

  /**
   * Called on agent_start. Clears the trace so each agent loop
   * produces a clean trace (important for /eval-check in live sessions).
   */
  onAgentStart(): void {
    this.entries = [];
    this.pendingCalls.clear();
    this.currentTurnIndex = 0;
    this.callCountInTurn = 0;
    this.startedAt = new Date().toISOString();
  }

  /** Called on turn_start. Resets per-turn counters. */
  onTurnStart(turnIndex: number): void {
    this.currentTurnIndex = turnIndex;
    this.callCountInTurn = 0;
  }

  /**
   * Called on tool_execution_start. Records the tool call.
   * Detects parallel calls within the same turn and assigns
   * a shared parallelGroup ID.
   */
  onToolExecutionStart(
    toolCallId: string,
    toolName: string,
    args: Record<string, unknown>,
  ): void {
    const entry: ToolTraceEntry = {
      toolName,
      arguments: args,
      turnIndex: this.currentTurnIndex,
      callIndex: this.callCountInTurn,
      timestamp: Date.now(),
      isError: false,
    };

    // Detect parallel calls: if this is the 2nd+ call in the same turn,
    // tag both this call and retroactively the first call in this turn.
    if (this.callCountInTurn > 0) {
      const parallelGroup = `turn-${this.currentTurnIndex}`;
      entry.parallelGroup = parallelGroup;

      // Retroactively tag the first call in this turn if not already tagged
      const firstCallInTurn = this.entries.find(
        (e) =>
          e.turnIndex === this.currentTurnIndex && e.callIndex === 0 && !e.parallelGroup,
      );
      if (firstCallInTurn) {
        firstCallInTurn.parallelGroup = parallelGroup;
      }
    }

    this.callCountInTurn++;
    const entryIndex = this.entries.length;
    this.entries.push(entry);
    this.pendingCalls.set(toolCallId, entryIndex);
  }

  /** Called on tool_execution_end. Updates the isError status. */
  onToolExecutionEnd(toolCallId: string, isError: boolean): void {
    const entryIndex = this.pendingCalls.get(toolCallId);
    if (entryIndex !== undefined) {
      this.entries[entryIndex].isError = isError;
      this.pendingCalls.delete(toolCallId);
    }
  }

  /** Build the full trace object for the current session. */
  getTrace(ctx: ExtensionContext): EvalTrace {
    return {
      sessionId: basename(ctx.cwd),
      model: ctx.model?.name ?? "unknown",
      extensions: [],
      cwd: ctx.cwd,
      startedAt: this.startedAt || new Date().toISOString(),
      entries: [...this.entries],
    };
  }

  /** Reset all trace state. */
  clearTrace(): void {
    this.entries = [];
    this.pendingCalls.clear();
    this.currentTurnIndex = 0;
    this.callCountInTurn = 0;
    this.startedAt = "";
  }

  /**
   * Write the trace to disk as JSON.
   * Uses async fs operations to avoid blocking the event loop.
   * Ensures the output directory exists before writing.
   */
  async writeTrace(ctx: ExtensionContext, outputPath?: string): Promise<void> {
    const tracePath = outputPath ?? join(ctx.cwd, ".pi", "eval-trace.json");
    const trace = this.getTrace(ctx);

    await mkdir(dirname(tracePath), { recursive: true });
    await writeFile(tracePath, JSON.stringify(trace, null, 2), "utf-8");
  }
}
