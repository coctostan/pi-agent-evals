/**
 * Assertion engine — evaluates traces against eval definitions.
 *
 * Takes an EvalTrace and an array of Assertions, returns one
 * AssertionResult per assertion with pass/fail, the original
 * assertion, and a human-readable detail string.
 */

import type {
  Assertion,
  AssertionResult,
  EvalTrace,
  ToolTraceEntry,
} from "./types.js";

/** Case-insensitive tool name comparison (pi reports lowercase, evals may use capitalized). */
function toolNameMatch(traceName: string, assertionName: string): boolean {
  return traceName.toLowerCase() === assertionName.toLowerCase();
}

/**
 * Evaluate all assertions against a trace.
 * Returns one AssertionResult per assertion, in the same order.
 */
export function checkAssertions(
  trace: EvalTrace,
  assertions: Assertion[],
): AssertionResult[] {
  return assertions.map((assertion) => checkOne(trace, assertion));
}

// ── Per-type checkers ────────────────────────────────────────

function checkOne(trace: EvalTrace, assertion: Assertion): AssertionResult {
  switch (assertion.type) {
    case "tool_used":
      return checkToolUsed(trace, assertion);
    case "tool_not_used":
      return checkToolNotUsed(trace, assertion);
    case "tool_before":
      return checkToolBefore(trace, assertion);
    case "tool_called_with":
      return checkToolCalledWith(trace, assertion);
    case "parallel_calls":
      return checkParallelCalls(trace, assertion);
    case "completed":
      return checkCompleted(trace, assertion);
    case "tool_used_any":
      return checkToolUsedAny(trace, assertion);
    case "tool_no_errors":
      return checkToolNoErrors(trace, assertion);
    case "tool_preference":
      return checkToolPreference(trace, assertion);
    default: {
      // Exhaustive check — TypeScript will error if a case is missing
      const _exhaustive: never = assertion;
      return {
        pass: false,
        assertion: _exhaustive,
        detail: `Unknown assertion type`,
      };
    }
  }
}

/** Assert that a specific tool was used at least once. */
function checkToolUsed(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_used" }>,
): AssertionResult {
  const matches = trace.entries.filter((e) => toolNameMatch(e.toolName, assertion.tool));
  if (matches.length > 0) {
    return {
      pass: true,
      assertion,
      detail: `Found ${matches.length} ${assertion.tool} call${matches.length === 1 ? "" : "s"}`,
    };
  }
  return {
    pass: false,
    assertion,
    detail: `No ${assertion.tool} calls found`,
  };
}

/**
 * Assert that a specific tool was NOT used.
 * If argument_pattern is provided, only blocks calls where the
 * stringified arguments match the regex.
 */
function checkToolNotUsed(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_not_used" }>,
): AssertionResult {
  const toolEntries = trace.entries.filter(
    (e) => toolNameMatch(e.toolName, assertion.tool),
  );

  if (toolEntries.length === 0) {
    return {
      pass: true,
      assertion,
      detail: `No ${assertion.tool} calls found`,
    };
  }

  // If no argument_pattern, any usage of the tool is a failure
  if (!assertion.argument_pattern) {
    return {
      pass: false,
      assertion,
      detail: `Found ${toolEntries.length} ${assertion.tool} call${toolEntries.length === 1 ? "" : "s"}`,
    };
  }

  // Check if any call matches the argument pattern
  let regex: RegExp;
  try {
    regex = new RegExp(assertion.argument_pattern);
  } catch {
    return {
      pass: false,
      assertion,
      detail: `Invalid regex pattern: ${assertion.argument_pattern}`,
    };
  }

  const matching = toolEntries.filter((e) =>
    regex.test(JSON.stringify(e.arguments)),
  );

  if (matching.length === 0) {
    return {
      pass: true,
      assertion,
      detail: `Found ${toolEntries.length} ${assertion.tool} call${toolEntries.length === 1 ? "" : "s"} but none matched pattern`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `Found ${assertion.tool} call matching pattern at turn ${matching[0].turnIndex}`,
  };
}

/** Assert that one tool was used before another. */
function checkToolBefore(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_before" }>,
): AssertionResult {
  const firstIdx = trace.entries.findIndex(
    (e) => toolNameMatch(e.toolName, assertion.first),
  );
  const thenIdx = trace.entries.findIndex(
    (e) => toolNameMatch(e.toolName, assertion.then),
  );

  if (firstIdx === -1) {
    return {
      pass: false,
      assertion,
      detail: `Missing ${assertion.first} in trace`,
    };
  }
  if (thenIdx === -1) {
    return {
      pass: false,
      assertion,
      detail: `Missing ${assertion.then} in trace`,
    };
  }

  if (firstIdx < thenIdx) {
    return {
      pass: true,
      assertion,
      detail: `${assertion.first} at index ${firstIdx}, ${assertion.then} at index ${thenIdx}`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `${assertion.then} at index ${thenIdx} appeared before ${assertion.first} at index ${firstIdx}`,
  };
}

/** Assert that a tool was called with arguments matching a pattern. */
function checkToolCalledWith(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_called_with" }>,
): AssertionResult {
  const toolEntries = trace.entries.filter(
    (e) => toolNameMatch(e.toolName, assertion.tool),
  );

  if (toolEntries.length === 0) {
    return {
      pass: false,
      assertion,
      detail: `No ${assertion.tool} calls found`,
    };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(assertion.argument_pattern);
  } catch {
    return {
      pass: false,
      assertion,
      detail: `Invalid regex pattern: ${assertion.argument_pattern}`,
    };
  }

  const matching = toolEntries.filter((e) =>
    regex.test(JSON.stringify(e.arguments)),
  );

  if (matching.length > 0) {
    return {
      pass: true,
      assertion,
      detail: `Found matching ${assertion.tool} call`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `No ${assertion.tool} call matched pattern`,
  };
}

/**
 * Assert that at least N tool calls were made in parallel
 * within a single turn.
 */
function checkParallelCalls(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "parallel_calls" }>,
): AssertionResult {
  // Group entries by parallelGroup, skipping entries without one
  const groups = new Map<string, ToolTraceEntry[]>();
  for (const entry of trace.entries) {
    if (entry.parallelGroup) {
      const group = groups.get(entry.parallelGroup) ?? [];
      group.push(entry);
      groups.set(entry.parallelGroup, group);
    }
  }

  let maxGroupSize = 0;
  for (const group of groups.values()) {
    if (group.length > maxGroupSize) {
      maxGroupSize = group.length;
    }
  }

  if (maxGroupSize >= assertion.min_parallel) {
    return {
      pass: true,
      assertion,
      detail: `Found group of ${maxGroupSize} parallel calls`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `Max parallel group size: ${maxGroupSize} (needed ${assertion.min_parallel})`,
  };
}

/**
 * Assert that the agent completed without errors.
 * Passes if the trace has entries AND no entries have isError: true.
 */
function checkCompleted(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "completed" }>,
): AssertionResult {
  if (trace.entries.length === 0) {
    return {
      pass: false,
      assertion,
      detail: "Trace is empty",
    };
  }

  const errorCount = trace.entries.filter((e) => e.isError).length;

  if (errorCount > 0) {
    return {
      pass: false,
      assertion,
      detail: `Trace has ${trace.entries.length} entries but ${errorCount} had errors`,
    };
  }

  return {
    pass: true,
    assertion,
    detail: `Trace has ${trace.entries.length} entries, 0 errors`,
  };
}

/** Assert that at least one of the listed tools was used. */
function checkToolUsedAny(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_used_any" }>,
): AssertionResult {
  const found = assertion.tools.filter((tool) =>
    trace.entries.some((e) => toolNameMatch(e.toolName, tool)),
  );

  if (found.length > 0) {
    return {
      pass: true,
      assertion,
      detail: `Found tool(s): ${found.join(", ")}`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `None of [${assertion.tools.join(", ")}] found in trace`,
  };
}

/** Assert that a specific tool had no error results. */
function checkToolNoErrors(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_no_errors" }>,
): AssertionResult {
  const toolEntries = trace.entries.filter(
    (e) => toolNameMatch(e.toolName, assertion.tool),
  );

  if (toolEntries.length === 0) {
    // Vacuous pass — tool was never called, so no errors
    return {
      pass: true,
      assertion,
      detail: `No ${assertion.tool} calls in trace (vacuous pass)`,
    };
  }

  const errorCount = toolEntries.filter((e) => e.isError).length;

  if (errorCount === 0) {
    return {
      pass: true,
      assertion,
      detail: `${toolEntries.length} ${assertion.tool} call(s), 0 errors`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `${errorCount} of ${toolEntries.length} ${assertion.tool} call(s) had errors`,
  };
}

/** Assert that preferred tools were used more than alternative tools. Soft signal. */
function checkToolPreference(
  trace: EvalTrace,
  assertion: Extract<Assertion, { type: "tool_preference" }>,
): AssertionResult {
  const preferredCount = trace.entries.filter((e) =>
    assertion.preferred.some((p) => toolNameMatch(e.toolName, p)),
  ).length;

  const overCount = trace.entries.filter((e) =>
    assertion.over.some((o) => toolNameMatch(e.toolName, o)),
  ).length;

  if (preferredCount === 0 && overCount === 0) {
    // Vacuous pass — neither preferred nor over tools were used
    return {
      pass: true,
      assertion,
      detail: "Neither preferred nor over tools used (vacuous pass)",
    };
  }

  if (preferredCount > overCount) {
    return {
      pass: true,
      assertion,
      detail: `Preferred tools: ${preferredCount} calls, over tools: ${overCount} calls`,
    };
  }

  return {
    pass: false,
    assertion,
    detail: `Preferred tools: ${preferredCount} calls, over tools: ${overCount} calls (wanted preferred > over)`,
  };
}
