import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEvalDefinition, listEvalDefinitions } from "./loader.js";

function minimalYaml(overrides: Record<string, unknown> = {}): string {
  const base: Record<string, unknown> = {
    name: "test-eval",
    description: "A test eval",
    category: "testing",
    prompts: ["Do something"],
    assertions: [{ type: "completed", message: "Should complete" }],
    ...overrides,
  };
  return Object.entries(base)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        const items = v
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              const fields = Object.entries(item)
                .map(([fk, fv]) => `${fk}: ${JSON.stringify(fv)}`)
                .join("\n    ");
              return `  - ${fields}`;
            }
            return `  - ${JSON.stringify(item)}`;
          })
          .join("\n");
        return `${k}:\n${items}`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join("\n");
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "loader-test-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeEval(name: string, content: string): void {
  writeFileSync(join(tmpDir, `${name}.yaml`), content, "utf-8");
}

describe("Valid loading", () => {
  it("loads a minimal valid eval YAML", () => {
    writeEval("basic", minimalYaml());
    const def = loadEvalDefinition("basic", tmpDir);
    expect(def.name).toBe("test-eval");
    expect(def.description).toBe("A test eval");
    expect(def.category).toBe("testing");
    expect(def.prompts).toEqual(["Do something"]);
    expect(def.assertions).toHaveLength(1);
    expect(def.assertions[0].type).toBe("completed");
  });

  it("loads YAML with optional fields (setup, timeout, pass_threshold)", () => {
    writeEval(
      "full",
      minimalYaml({
        setup: ["echo hello"],
        timeout: 5000,
        pass_threshold: 0.8,
      }),
    );
    const def = loadEvalDefinition("full", tmpDir);
    expect(def.setup).toEqual(["echo hello"]);
    expect(def.timeout).toBe(5000);
    expect(def.pass_threshold).toBe(0.8);
  });
});

describe("File errors", () => {
  it("throws for a missing file", () => {
    expect(() => loadEvalDefinition("nonexistent", tmpDir)).toThrow(
      "not found",
    );
  });

  it("throws for invalid YAML syntax", () => {
    writeEval("bad", ":\n  - :\n  bad: [unclosed");
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow("parse");
  });
});

describe("Field validation", () => {
  it("throws when name is missing", () => {
    const yaml = minimalYaml();
    const withoutName = yaml
      .split("\n")
      .filter((line) => !line.startsWith("name:"))
      .join("\n");
    writeEval("no-name", withoutName);
    expect(() => loadEvalDefinition("no-name", tmpDir)).toThrow(
      "missing required fields: name",
    );
  });

  it("throws when prompts is missing", () => {
    const yaml = minimalYaml();
    const withoutPrompts = yaml
      .split("\n")
      .filter(
        (line) => !line.startsWith("prompts:") && !line.startsWith("  - \"Do"),
      )
      .join("\n");
    writeEval("no-prompts", withoutPrompts);
    expect(() => loadEvalDefinition("no-prompts", tmpDir)).toThrow(
      "missing required fields",
    );
  });

  it("throws when prompts is not an array", () => {
    writeEval(
      "bad-prompts",
      [
        "name: test",
        "description: test",
        "category: test",
        'prompts: "not an array"',
        "assertions:",
        "  - type: completed",
        '    message: "ok"',
      ].join("\n"),
    );
    expect(() => loadEvalDefinition("bad-prompts", tmpDir)).toThrow(
      "must be an array",
    );
  });

  it("throws when assertions is not an array", () => {
    writeEval(
      "bad-assertions",
      [
        "name: test",
        "description: test",
        "category: test",
        "prompts:",
        '  - "Do something"',
        'assertions: "not an array"',
      ].join("\n"),
    );
    expect(() => loadEvalDefinition("bad-assertions", tmpDir)).toThrow(
      "must be an array",
    );
  });
});

describe("Assertion shape validation", () => {
  it("throws for tool_used without tool", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "tool_used", message: "should use tool" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "tool"',
    );
  });

  it("throws for tool_not_used without tool", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "tool_not_used", message: "should not use" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "tool"',
    );
  });

  it("throws for tool_before without first", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [
          { type: "tool_before", then: "Edit", message: "order matters" },
        ],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "first"',
    );
  });

  it("throws for tool_called_with without argument_pattern", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [
          { type: "tool_called_with", tool: "Read", message: "needs pattern" },
        ],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "argument_pattern"',
    );
  });

  it("throws for parallel_calls without min_parallel", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "parallel_calls", message: "needs min" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "min_parallel"',
    );
  });

  it("throws for unknown assertion type with available types", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "foo", message: "unknown" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      /unknown type "foo".*Available types/,
    );
  });

  it("passes for tool_used with tool and message", () => {
    writeEval(
      "good",
      minimalYaml({
        assertions: [
          { type: "tool_used", tool: "Read", message: "should use Read" },
        ],
      }),
    );
    const def = loadEvalDefinition("good", tmpDir);
    expect(def.assertions[0].type).toBe("tool_used");
  });

  it("passes for well-formed eval with multiple assertion types", () => {
    writeEval(
      "multi",
      minimalYaml({
        assertions: [
          { type: "tool_used", tool: "Read", message: "use read" },
          {
            type: "tool_not_used",
            tool: "Bash",
            argument_pattern: "cat",
            message: "no cat",
          },
          {
            type: "tool_before",
            first: "Read",
            then: "Edit",
            message: "read first",
          },
          {
            type: "tool_called_with",
            tool: "Read",
            argument_pattern: "file\\.txt",
            message: "right file",
          },
          { type: "parallel_calls", min_parallel: 2, message: "parallel" },
          { type: "completed", message: "done" },
        ],
      }),
    );
    const def = loadEvalDefinition("multi", tmpDir);
    expect(def.assertions).toHaveLength(6);
  });

  it("throws for tool_used_any without tools", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "tool_used_any", message: "need tools" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "tools"',
    );
  });

  it("throws for tool_used_any with empty tools array", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "tool_used_any", tools: [], message: "need tools" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "tools"',
    );
  });

  it("throws for tool_no_errors without tool", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [{ type: "tool_no_errors", message: "no errors" }],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "tool"',
    );
  });

  it("throws for tool_preference without preferred", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [
          { type: "tool_preference", over: ["Grep"], message: "prefer" },
        ],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "preferred"',
    );
  });

  it("throws for tool_preference without over", () => {
    writeEval(
      "bad",
      minimalYaml({
        assertions: [
          {
            type: "tool_preference",
            preferred: ["Read"],
            message: "prefer",
          },
        ],
      }),
    );
    expect(() => loadEvalDefinition("bad", tmpDir)).toThrow(
      'missing required field "over"',
    );
  });

  it("passes for well-formed eval with all 9 assertion types", () => {
    writeEval(
      "all-nine",
      minimalYaml({
        assertions: [
          { type: "tool_used", tool: "Read", message: "use read" },
          {
            type: "tool_not_used",
            tool: "Bash",
            argument_pattern: "cat",
            message: "no cat",
          },
          {
            type: "tool_before",
            first: "Read",
            then: "Edit",
            message: "read first",
          },
          {
            type: "tool_called_with",
            tool: "Read",
            argument_pattern: "file\\.txt",
            message: "right file",
          },
          { type: "parallel_calls", min_parallel: 2, message: "parallel" },
          { type: "completed", message: "done" },
          {
            type: "tool_used_any",
            tools: ["Grep", "find"],
            message: "search",
          },
          { type: "tool_no_errors", tool: "Edit", message: "no errors" },
          {
            type: "tool_preference",
            preferred: ["symbol_graph"],
            over: ["Grep"],
            message: "prefer graph",
          },
        ],
      }),
    );
    const def = loadEvalDefinition("all-nine", tmpDir);
    expect(def.assertions).toHaveLength(9);
  });
});

describe("listEvalDefinitions", () => {
  it("returns sorted names for directory with .yaml files", () => {
    writeEval("zebra", minimalYaml({ name: "zebra" }));
    writeEval("alpha", minimalYaml({ name: "alpha" }));
    writeEval("mid", minimalYaml({ name: "mid" }));
    // Write a non-yaml file that should be ignored
    writeFileSync(join(tmpDir, "readme.txt"), "not an eval", "utf-8");

    const names = listEvalDefinitions(tmpDir);
    expect(names).toEqual(["alpha", "mid", "zebra"]);
  });

  it("returns empty array for non-existent directory", () => {
    const names = listEvalDefinitions("/tmp/does-not-exist-loader-test");
    expect(names).toEqual([]);
  });
});
