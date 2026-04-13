/**
 * Runner types — result and configuration types for eval execution.
 */

import type { AssertionResult } from "../types.js";

/** Result of running a single eval prompt through the CMUX runner. */
export interface EvalRunResult {
  /** Eval definition name (e.g., "read-over-cat"). */
  evalName: string;

  /** Human-readable description from the eval definition. */
  description: string;

  /** Eval category (e.g., "tool-routing"). */
  category: string;

  /** Which prompt in the eval was run (0-indexed). */
  promptIndex: number;

  /** The prompt text that was sent to the agent. */
  prompt: string;

  /** Per-assertion results from the assertion engine. */
  assertions: AssertionResult[];

  /** Whether all assertions passed. */
  passed: boolean;

  /** Duration in milliseconds from eval start to trace collection. */
  duration: number;

  /** Error message if the eval failed to execute (cmux error, timeout, etc.). */
  error?: string;
}

/** Aggregated results from a full eval run. */
export interface RunSummary {
  /** ISO timestamp when the run started. */
  timestamp: string;

  /** Model name used (from --model flag or "unknown"). */
  model: string;

  /** Individual eval prompt results. */
  evals: EvalRunResult[];

  /** Aggregate counts. */
  totals: {
    total: number;
    passed: number;
    failed: number;
    errored: number;
  };
}

/** Configuration options for the eval runner. */
export interface RunnerOptions {
  /** Timeout per eval prompt in milliseconds. */
  timeout: number;

  /** Directory to write results JSON. */
  outputDir: string;

  /** Directory containing eval YAML files. */
  evalsDir: string;

  /** Project root directory (where package.json declares the extension). */
  projectDir: string;

  /** Model name for metadata (not used for model switching in v0.1). */
  model?: string;

  /** Milliseconds to wait for pi to start before sending the prompt. */
  piStartupDelay: number;

  /** Milliseconds between trace file poll checks. */
  pollInterval: number;
}

/** Result of checking the cmux environment. */
export interface CmuxEnvironment {
  /** Whether cmux is available and usable. */
  available: boolean;

  /** Whether the runner is executing inside a cmux terminal. */
  inCmux: boolean;

  /** Resolved cmux CLI binary path, or null if not found. */
  bin: string | null;

  /** Human-readable status message. */
  message: string;
}
