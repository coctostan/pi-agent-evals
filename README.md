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

### /eval-run examples

```
/eval-run all                                   Run all evals
/eval-run all --baseline                        Run all and save as baseline.json
/eval-run read-over-cat                         Run a specific eval
/eval-run tool-routing                          Run all evals in a category
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

## Eval Definitions

Evals are YAML files in `evals/`. Each defines a behavioral test:

```yaml
name: read-over-cat
description: Agent should use the Read tool instead of bash cat/head/tail
category: tool-routing

setup:
  - "echo 'Hello World' > /tmp/eval-test-file.txt"

prompts:
  - "Read the contents of /tmp/eval-test-file.txt and tell me what it says"

assertions:
  - type: tool_used
    tool: Read
    message: "Should use Read tool for file contents"

  - type: tool_not_used
    tool: Bash
    argument_pattern: "cat\\s|head\\s|tail\\s"
    message: "Should not use bash cat/head/tail for file reading"

  - type: completed
    message: "Agent should complete without errors"

pass_threshold: 1.0
```

### Shipped evals

| Eval | Category | What it tests |
|------|----------|---------------|
| `read-over-cat` | tool-routing | Uses Read instead of bash cat/head/tail |
| `read-before-edit` | tool-discipline | Reads a file before editing it |
| `edit-over-sed` | tool-routing | Uses Edit instead of bash sed/awk |
| `no-redundant-cd` | tool-discipline | Doesn't use cd in bash before tool calls |

## Assertion Types

| Type | Description |
|------|-------------|
| `tool_used` | A specific tool was called at least once |
| `tool_not_used` | A tool was not called (optionally filtered by argument pattern) |
| `tool_before` | One tool was used before another |
| `tool_called_with` | A tool was called with arguments matching a regex |
| `parallel_calls` | At least N tool calls were made in parallel within one turn |
| `completed` | Agent completed with a non-empty trace and zero errors |

## Results Format

Results are written as JSON to `results/`:

```json
{
  "timestamp": "2026-04-13T12:00:00.000Z",
  "model": "claude-sonnet-4",
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
  "totals": { "total": 8, "passed": 7, "failed": 1, "errored": 0 }
}
```

With `--baseline`, results are also saved as `results/baseline.json`.

## Adding New Evals

1. Create a YAML file in `evals/` (e.g., `evals/my-eval.yaml`)
2. Define required fields: `name`, `description`, `category`, `prompts`, `assertions`
3. Optionally add `setup` commands and `pass_threshold`
4. Run: `/eval-run my-eval`

## Architecture

The tracer extension hooks into pi's lifecycle events (`tool_execution_start`, `tool_execution_end`, `agent_start`, `agent_end`) to passively record every tool call into `.pi/eval-trace.json`. The `/eval-check` command runs assertions against the current session's trace for manual validation. The `/eval-run` command orchestrates automated execution: for each eval prompt, it creates a cmux pane, starts a fresh pi session, sends the prompt, polls for the trace file, runs assertions, and cleans up the pane.

## Roadmap

- Model matrix (`--models` flag for testing across models)
- Thinking-level matrix (`--thinking` flag)
- Historical comparison (`/eval-compare`)
- CI integration (GitHub Action gating merge on regression)

## License

MIT
