# pi-agent-evals

Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.

## Overview

pi-agent-evals is a pi extension that tests whether agents use the right tools for the right tasks — for example, using `Read` instead of `bash cat`, or reading a file before editing it. It does **not** measure end-to-end task completion or output quality.

**Architecture:** A tracer extension running inside pi captures tool call events via passive lifecycle hooks. An external runner orchestrates clean eval sessions through cmux panes, then runs assertions against the captured traces.

## Quick Start

**Prerequisites:** [pi](https://github.com/mariozechner/pi-coding-agent), [cmux](https://cmux.dev), pnpm

```bash
pnpm install && pnpm build
```

**Manual check** (in any pi session):
```
/eval-check read-over-cat
```

**Run all evals** (in a pi session inside cmux):
```
/eval-run all --baseline
```

## Commands

| Command | Description |
|---------|-------------|
| `/eval-trace` | Dump current session trace for debugging |
| `/eval-check <name>` | Run assertions for an eval against the current trace |
| `/eval-run <target> [--baseline] [--model <model>] [--thinking <level>] [--project-dir <path>]` | Run evals via cmux and report results |
| `/eval-compare <file1> <file2\|--baseline>` | Compare two eval result files side-by-side |

### /eval-run examples

```
/eval-run all                                   Run all evals
/eval-run all --baseline                        Run all and save as baseline.json
/eval-run read-over-cat                         Run a specific eval
/eval-run tool-routing                          Run all evals in a category
/eval-run all --model claude-sonnet-4           Run all with a specific model
/eval-run all --thinking high                   Run all with a specific thinking level
/eval-run all --project-dir ../other-project    Run all evals against a foreign project
```

### Foreign-project execution

By default, `/eval-run` launches pi in the extension repo (this directory). With `--project-dir <path>`, pi starts inside the specified project directory instead, while eval definitions (`evals/`) and results (`results/`) remain anchored to the extension repo.

The runner automatically loads the tracer extension via `pi -e <extension-repo>` so that `.pi/eval-trace.json` is written under the foreign project directory.

```
# Run evals against a separate project
/eval-run all --project-dir ~/projects/my-app

# Combine with model and thinking flags
/eval-run all --project-dir ../my-app --model claude-sonnet-4 --thinking high
```

### Comparing results

`/eval-compare` renders a side-by-side diff of two result files with per-eval pass/fail deltas:

```
/eval-compare results/run1.json results/run2.json
/eval-compare results/run1.json --baseline
```

Output includes model/thinking metadata, per-eval status columns (PASS/FAIL/ERR), and delta indicators (▲ improved, ▼ regressed, = unchanged).

## Eval Definitions

Evals are YAML files in `evals/`. Each defines a behavioral test:

```yaml
name: read-over-cat
description: Model should use Read tool instead of bash cat
category: tool-routing

prompts:
  - "Show me the contents of package.json"
  - "Read src/index.ts and tell me what it exports"
  - "What's in tsconfig.json?"
  - "Display the first 50 lines of README.md"

assertions:
  - type: tool_used
    tool: Read
    message: Should use Read tool for file reading

  - type: tool_not_used
    tool: Bash
    argument_pattern: "\\bcat\\s+"
    message: Should NOT use bash cat

  - type: tool_not_used
    tool: Bash
    argument_pattern: "\\b(head|tail|less|more)\\s+"
    message: Should NOT use bash head/tail/less/more
```

### Shipped evals

| Eval | Category | What it tests |
|------|----------|---------------|
| `read-over-cat` | tool-routing | Uses Read instead of bash cat/head/tail |
| `edit-over-sed` | tool-routing | Uses Edit instead of bash sed/awk/perl |
| `search-over-find` | tool-routing | Uses Grep/find/ls instead of bash find |
| `grep-over-bash-grep` | tool-routing | Uses Grep instead of bash grep/rg/ag |
| `edit-over-write` | tool-routing | Uses Edit for changes, not Write for overwrites |
| `graph-for-structure` | tool-routing | Uses codegraph tools for structural code questions |
| `read-before-edit` | tool-discipline | Reads a file before editing it |
| `no-redundant-cd` | tool-discipline | Doesn't use cd && or cd ; patterns in bash |
| `parallel-tool-calls` | tool-discipline | Parallelizes independent reads/searches |
| `edit-accuracy` | tool-discipline | Edit calls succeed without errors; reads before edits |
| `truncation-follow-up` | context | Follows up with offset after truncated read |

## Assertion Types

| Type | Description |
|------|-------------|
| `tool_used` | A specific tool was called at least once |
| `tool_not_used` | A tool was not called (optionally filtered by argument pattern) |
| `tool_before` | One tool was used before another |
| `tool_called_with` | A tool was called with arguments matching a regex |
| `parallel_calls` | At least N tool calls were made in parallel within one turn |
| `completed` | Agent completed with a non-empty trace and zero errors |
| `tool_used_any` | At least one of the listed tools was called |
| `tool_no_errors` | A specific tool had no error results (vacuous pass if not called) |
| `tool_preference` | Preferred tools were used more than alternative tools (soft signal) |

## Results Format

Results are written as JSON to `results/`:

```json
{
  "timestamp": "2026-04-13T12:00:00.000Z",
  "model": "claude-sonnet-4",
  "thinking": "default",
  "evals": [
    {
      "evalName": "read-over-cat",
      "description": "...",
      "category": "tool-routing",
      "promptIndex": 0,
      "prompt": "...",
      "assertions": [
        { "pass": true, "assertion": { "type": "tool_used", "..." }, "detail": "Found 2 Read calls" }
      ],
      "passed": true,
      "duration": 8500
    }
  ],
  "totals": { "total": 26, "passed": 24, "failed": 2, "errored": 0 }
}
```

With `--baseline`, results are also saved as `results/baseline.json`.

## Adding New Evals

1. Create a YAML file in `evals/` (e.g., `evals/my-eval.yaml`)
2. Define required fields: `name`, `description`, `category`, `prompts`, `assertions`
3. Optionally add `setup` commands, `pass_threshold`, and `timeout`
4. Run: `/eval-run my-eval`

## Architecture

The tracer extension hooks into pi's lifecycle events (`tool_execution_start`, `tool_execution_end`, `agent_start`, `agent_end`) to passively record every tool call into `.pi/eval-trace.json`. The `/eval-check` command runs assertions against the current session's trace for manual validation. The `/eval-run` command orchestrates automated execution: for each eval prompt, it creates a cmux pane, starts a fresh pi session, sends the prompt, polls for the trace file, runs assertions, and cleans up the pane.

## Roadmap

**v0.3 (current):**
- [x] Test framework + 67 unit tests (Phase I)
- [x] 3 new assertion types: `tool_used_any`, `tool_no_errors`, `tool_preference` (Phase J)
- [x] 11 eval definitions across 3 categories (Phase J)
- [x] Documentation refresh (Phase K)

**Future:**
- Per-tool-description evals (v2)
- Custom eval authoring documentation
- Regression trend tracking across runs

## License

MIT
