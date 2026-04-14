/**
 * Core type definitions for the pi-agent-evals system.
 *
 * Types cover three concerns:
 * 1. Trace capture (ToolTraceEntry, EvalTrace)
 * 2. Eval definitions (EvalDefinition, Assertion)
 * 3. Assertion results (AssertionResult)
 */

// ── Trace Types ──────────────────────────────────────────────

/** A single tool call captured during an agent session. */
export interface ToolTraceEntry {
  /** Name of the tool that was called (e.g., "Read", "Bash", "Edit"). */
  toolName: string;

  /** Arguments passed to the tool (raw LLM args from tool_execution_start). */
  arguments: Record<string, unknown>;

  /** Which agent turn this call belongs to (0-indexed). */
  turnIndex: number;

  /** Position within the turn (0-indexed). */
  callIndex: number;

  /** Unix timestamp (ms) when the call was recorded. */
  timestamp: number;

  /** Whether the tool execution resulted in an error. */
  isError: boolean;

  /**
   * Shared ID grouping parallel calls within the same turn.
   * Present when multiple tool calls occur in a single turn.
   * Format: "turn-{turnIndex}"
   */
  parallelGroup?: string;
}

/** Full trace of an agent session's tool calls. */
export interface EvalTrace {
  /** Session identifier (derived from cwd basename). */
  sessionId: string;

  /** Model name used for the session. */
  model: string;

  /** Active extensions during the session. */
  extensions: string[];

  /** Working directory of the session. */
  cwd: string;

  /** ISO timestamp when the agent loop started. */
  startedAt: string;

  /** All tool calls captured during the session. */
  entries: ToolTraceEntry[];
}

// ── Eval Definition Types ────────────────────────────────────

/** Definition of a behavioral eval loaded from YAML. */
export interface EvalDefinition {
  /** Unique name for this eval (e.g., "read-over-cat"). */
  name: string;

  /** Human-readable description of what this eval tests. */
  description: string;

  /** Category grouping (e.g., "tool-routing", "tool-discipline"). */
  category: string;

  /** Shell commands to run before sending the prompt. */
  setup?: string[];

  /** Prompts to send to the agent. Each is run and traced independently. */
  prompts: string[];

  /** Assertions to validate against the trace. */
  assertions: Assertion[];

  /** Timeout in ms for the eval (default: no timeout). */
  timeout?: number;

  /** Fraction of prompts that must pass all assertions (default: 1.0). */
  pass_threshold?: number;

  /** Working directory override for this eval (e.g., a project with .codegraph/). Resolved at runtime. */
  cwd?: string;
}

// ── Assertion Types ──────────────────────────────────────────

/**
 * Assertion definitions for validating agent behavior against a trace.
 *
 * Discriminated union on `type`. Each variant defines what to check
 * and a human-readable `message` for reporting.
 */
export type Assertion =
  | ToolUsedAssertion
  | ToolNotUsedAssertion
  | ToolBeforeAssertion
  | ToolCalledWithAssertion
  | ParallelCallsAssertion
  | CompletedAssertion
  | ToolUsedAnyAssertion
  | ToolNoErrorsAssertion
  | ToolPreferenceAssertion;

/** Assert that a specific tool was used at least once. */
export interface ToolUsedAssertion {
  type: "tool_used";
  /** Tool name to check for (e.g., "Read"). */
  tool: string;
  /** Human-readable failure message. */
  message: string;
}

/**
 * Assert that a specific tool was NOT used.
 * If `argument_pattern` is provided, only blocks calls where
 * the stringified arguments match the regex pattern.
 */
export interface ToolNotUsedAssertion {
  type: "tool_not_used";
  /** Tool name to check against (e.g., "Bash"). */
  tool: string;
  /** Optional regex pattern to match against stringified arguments. */
  argument_pattern?: string;
  /** Human-readable failure message. */
  message: string;
}

/** Assert that one tool was used before another. */
export interface ToolBeforeAssertion {
  type: "tool_before";
  /** Tool that should appear first. */
  first: string;
  /** Tool that should appear after. */
  then: string;
  /** Human-readable failure message. */
  message: string;
}

/** Assert that a tool was called with arguments matching a pattern. */
export interface ToolCalledWithAssertion {
  type: "tool_called_with";
  /** Tool name to check. */
  tool: string;
  /** Regex pattern to match against stringified arguments. */
  argument_pattern: string;
  /** Human-readable failure message. */
  message: string;
}

/** Assert that at least N tool calls were made in parallel within a single turn. */
export interface ParallelCallsAssertion {
  type: "parallel_calls";
  /** Minimum number of parallel calls required. */
  min_parallel: number;
  /** Human-readable failure message. */
  message: string;
}

/** Assert that the agent completed without errors. */
export interface CompletedAssertion {
  type: "completed";
  /** Human-readable failure message. */
  message: string;
}

/** Assert that at least one of the listed tools was used. */
export interface ToolUsedAnyAssertion {
  type: "tool_used_any";
  /** Tool names — at least one must appear in the trace. */
  tools: string[];
  /** Human-readable failure message. */
  message: string;
}

/** Assert that a specific tool had no error results. */
export interface ToolNoErrorsAssertion {
  type: "tool_no_errors";
  /** Tool name to check for errors. */
  tool: string;
  /** Human-readable failure message. */
  message: string;
}

/** Assert that preferred tools were used more than alternative tools. Soft signal. */
export interface ToolPreferenceAssertion {
  type: "tool_preference";
  /** Tools that should be preferred. */
  preferred: string[];
  /** Tools that should be avoided in favor of preferred. */
  over: string[];
  /** Human-readable failure message. */
  message: string;
}

// ── Result Types ─────────────────────────────────────────────

/** Result of evaluating a single assertion against a trace. */
export interface AssertionResult {
  /** Whether the assertion passed. */
  pass: boolean;

  /** The assertion that was evaluated. */
  assertion: Assertion;

  /** Human-readable detail about the result (e.g., "Found 3 Read calls"). */
  detail: string;
}
