import { describe, it, expect } from "vitest";
import { checkAssertions } from "./assertions.js";
import type {
  Assertion,
  EvalTrace,
  ToolTraceEntry,
} from "./types.js";

// ── Helper ───────────────────────────────────────────────────

/** Build an EvalTrace from partial ToolTraceEntry data. */
function makeTrace(
  partials: Partial<ToolTraceEntry>[] = [],
): EvalTrace {
  const entries: ToolTraceEntry[] = partials.map((p, i) => ({
    toolName: p.toolName ?? "unknown",
    arguments: p.arguments ?? {},
    turnIndex: p.turnIndex ?? i,
    callIndex: p.callIndex ?? 0,
    timestamp: p.timestamp ?? Date.now(),
    isError: p.isError ?? false,
    ...(p.parallelGroup !== undefined
      ? { parallelGroup: p.parallelGroup }
      : {}),
  }));
  return {
    sessionId: "test-session",
    model: "test-model",
    extensions: [],
    cwd: "/tmp/test",
    startedAt: new Date().toISOString(),
    entries,
  };
}

/** Shorthand: evaluate a single assertion and return the result. */
function check(
  trace: EvalTrace,
  assertion: Assertion,
) {
  return checkAssertions(trace, [assertion])[0];
}

// ── tool_used ────────────────────────────────────────────────

describe("tool_used", () => {
  const assertion: Assertion = {
    type: "tool_used",
    tool: "Read",
    message: "Should use Read",
  };

  it("passes when the trace contains a matching tool call", () => {
    const trace = makeTrace([{ toolName: "Read" }, { toolName: "Edit" }]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(true);
    expect(result.detail).toContain("1");
  });

  it("fails when the trace has no matching tool calls", () => {
    const trace = makeTrace([{ toolName: "Bash" }]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("No Read calls");
  });

  it("matches tool names case-insensitively", () => {
    const trace = makeTrace([{ toolName: "read" }]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(true);
  });

  it("fails on an empty trace", () => {
    const trace = makeTrace([]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
  });
});

// ── tool_not_used ────────────────────────────────────────────

describe("tool_not_used", () => {
  it("passes when the tool is absent from the trace", () => {
    const trace = makeTrace([{ toolName: "Read" }]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      message: "no bash",
    });
    expect(result.pass).toBe(true);
  });

  it("fails when the tool is present and no argument_pattern is set", () => {
    const trace = makeTrace([{ toolName: "Bash" }]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      message: "no bash",
    });
    expect(result.pass).toBe(false);
  });

  it("passes when tool is present but argument_pattern does not match args", () => {
    const trace = makeTrace([
      { toolName: "Bash", arguments: { command: "echo hello" } },
    ]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      argument_pattern: "rm -rf",
      message: "no dangerous bash",
    });
    expect(result.pass).toBe(true);
    expect(result.detail).toContain("none matched pattern");
  });

  it("fails when tool is present and argument_pattern matches args", () => {
    const trace = makeTrace([
      { toolName: "Bash", arguments: { command: "rm -rf /" } },
    ]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      argument_pattern: "rm -rf",
      message: "no dangerous bash",
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("matching pattern");
  });

  it("returns pass: false with 'Invalid regex' detail for a bad pattern", () => {
    const trace = makeTrace([{ toolName: "Bash" }]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      argument_pattern: "[invalid(",
      message: "bad regex",
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("Invalid regex");
  });

  it("matches tool names case-insensitively", () => {
    const trace = makeTrace([{ toolName: "bash" }]);
    const result = check(trace, {
      type: "tool_not_used",
      tool: "Bash",
      message: "no bash",
    });
    expect(result.pass).toBe(false);
  });
});

// ── tool_before ──────────────────────────────────────────────

describe("tool_before", () => {
  const assertion: Assertion = {
    type: "tool_before",
    first: "Read",
    then: "Edit",
    message: "Read before Edit",
  };

  it("passes when the first tool appears before the then tool", () => {
    const trace = makeTrace([
      { toolName: "Read" },
      { toolName: "Edit" },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(true);
    expect(result.detail).toContain("index 0");
    expect(result.detail).toContain("index 1");
  });

  it("fails when the then tool appears before the first tool", () => {
    const trace = makeTrace([
      { toolName: "Edit" },
      { toolName: "Read" },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
  });

  it("fails when the first tool is missing from the trace", () => {
    const trace = makeTrace([{ toolName: "Edit" }]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("Missing Read");
  });

  it("fails when the then tool is missing from the trace", () => {
    const trace = makeTrace([{ toolName: "Read" }]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("Missing Edit");
  });

  it("fails when the same tool is used as both first and then (same index)", () => {
    // findIndex returns the first occurrence for both, so firstIdx === thenIdx === 0.
    // The check is firstIdx < thenIdx, and 0 < 0 is false, so it fails.
    const trace = makeTrace([{ toolName: "Read" }]);
    const sameToolAssertion: Assertion = {
      type: "tool_before",
      first: "Read",
      then: "Read",
      message: "Read before Read",
    };
    const result = check(trace, sameToolAssertion);
    expect(result.pass).toBe(false);
  });
});

// ── tool_called_with ─────────────────────────────────────────

describe("tool_called_with", () => {
  it("passes when a tool call has matching arguments", () => {
    const trace = makeTrace([
      { toolName: "Read", arguments: { path: "/src/index.ts" } },
    ]);
    const result = check(trace, {
      type: "tool_called_with",
      tool: "Read",
      argument_pattern: "index\\.ts",
      message: "should read index.ts",
    });
    expect(result.pass).toBe(true);
  });

  it("fails when the tool call arguments do not match the pattern", () => {
    const trace = makeTrace([
      { toolName: "Read", arguments: { path: "/src/utils.ts" } },
    ]);
    const result = check(trace, {
      type: "tool_called_with",
      tool: "Read",
      argument_pattern: "index\\.ts",
      message: "should read index.ts",
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("No Read call matched pattern");
  });

  it("fails when the tool is not in the trace at all", () => {
    const trace = makeTrace([{ toolName: "Bash" }]);
    const result = check(trace, {
      type: "tool_called_with",
      tool: "Read",
      argument_pattern: ".*",
      message: "should use Read",
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("No Read calls found");
  });

  it("returns pass: false with 'Invalid regex' detail for a bad pattern", () => {
    const trace = makeTrace([{ toolName: "Read", arguments: { path: "x" } }]);
    const result = check(trace, {
      type: "tool_called_with",
      tool: "Read",
      argument_pattern: "[invalid(",
      message: "bad regex",
    });
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("Invalid regex");
  });
});

// ── parallel_calls ───────────────────────────────────────────

describe("parallel_calls", () => {
  const assertion: Assertion = {
    type: "parallel_calls",
    min_parallel: 3,
    message: "Should have 3 parallel calls",
  };

  it("passes when a parallelGroup has enough entries", () => {
    const trace = makeTrace([
      { toolName: "Read", parallelGroup: "turn-0" },
      { toolName: "Read", parallelGroup: "turn-0" },
      { toolName: "Read", parallelGroup: "turn-0" },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(true);
    expect(result.detail).toContain("3");
  });

  it("fails when no group meets min_parallel", () => {
    const trace = makeTrace([
      { toolName: "Read", parallelGroup: "turn-0" },
      { toolName: "Edit", parallelGroup: "turn-0" },
      { toolName: "Bash", parallelGroup: "turn-1" },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("needed 3");
  });

  it("skips entries without a parallelGroup", () => {
    const trace = makeTrace([
      { toolName: "Read" },
      { toolName: "Read" },
      { toolName: "Read" },
    ]);
    // No parallelGroup on any entry, so maxGroupSize stays 0.
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("Max parallel group size: 0");
  });

  it("fails on an empty trace", () => {
    const trace = makeTrace([]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
  });
});

// ── completed ────────────────────────────────────────────────

describe("completed", () => {
  const assertion: Assertion = {
    type: "completed",
    message: "Should complete without errors",
  };

  it("passes when the trace has entries and zero errors", () => {
    const trace = makeTrace([
      { toolName: "Read", isError: false },
      { toolName: "Edit", isError: false },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(true);
    expect(result.detail).toContain("0 errors");
  });

  it("fails on an empty trace", () => {
    const trace = makeTrace([]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("empty");
  });

  it("fails when entries are present but some have isError: true", () => {
    const trace = makeTrace([
      { toolName: "Read", isError: false },
      { toolName: "Bash", isError: true },
      { toolName: "Edit", isError: true },
    ]);
    const result = check(trace, assertion);
    expect(result.pass).toBe(false);
    expect(result.detail).toContain("2 had errors");
  });
});

// ── General / checkAssertions ────────────────────────────────

describe("checkAssertions", () => {
  it("returns results in the same order as the input assertions", () => {
    const trace = makeTrace([{ toolName: "Read" }]);
    const assertions: Assertion[] = [
      { type: "tool_used", tool: "Read", message: "a" },
      { type: "tool_used", tool: "Bash", message: "b" },
      { type: "completed", message: "c" },
    ];
    const results = checkAssertions(trace, assertions);
    expect(results).toHaveLength(3);
    expect(results[0].assertion).toBe(assertions[0]);
    expect(results[1].assertion).toBe(assertions[1]);
    expect(results[2].assertion).toBe(assertions[2]);
  });

  it("evaluates multiple assertions independently", () => {
    const trace = makeTrace([
      { toolName: "Read", isError: false },
      { toolName: "Bash", isError: false },
    ]);
    const assertions: Assertion[] = [
      { type: "tool_used", tool: "Read", message: "uses Read" },
      { type: "tool_not_used", tool: "Edit", message: "no Edit" },
      { type: "tool_used", tool: "Write", message: "uses Write" },
      { type: "completed", message: "completed" },
    ];
    const results = checkAssertions(trace, assertions);
    expect(results[0].pass).toBe(true);  // Read is present
    expect(results[1].pass).toBe(true);  // Edit is absent
    expect(results[2].pass).toBe(false); // Write is absent
    expect(results[3].pass).toBe(true);  // no errors
  });
});
