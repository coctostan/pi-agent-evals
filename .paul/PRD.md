# Product Requirements: pi-agent-evals

## Problem / Opportunity
There is no way to quantitatively measure whether AI agents follow tool routing guidelines in pi sessions. When prompts, models, or extensions change, there's no systematic way to detect regressions in agent behavior (e.g., using `bash cat` instead of `Read`, skipping file reads before edits, using `sed` instead of `Edit`).

## Why Now
Part of Phase 4 of ForgeCode-inspired improvements. The prompt-assembler guidelines cleanup is in progress and needs a measurement system to validate before/after impact. Without evals, behavioral changes are invisible.

## Current State / Existing System Context
New project. ForgeCode's `benchmarks/evals/` system provides the model — this project adapts that approach to pi's extension architecture.

## Desired Outcome
A working eval system where:
1. Any developer can define new behavioral evals as simple YAML files
2. Manual validation is possible in a live session via `/eval-check`
3. Automated execution runs all evals unattended via CMUX
4. Results are recorded as JSON for historical comparison

## Target Users and Needs
### Primary Users
- Pi extension and prompt developers
- Need to measure tool routing compliance quantitatively
- Need before/after comparison when changing prompts, models, or extensions

## Requirements
### Must Have
- Tracer extension capturing tool calls via lifecycle hooks (tool_call, tool_result, agent_end)
- Type definitions: ToolTraceEntry, EvalTrace, EvalDefinition, Assertion
- Assertion engine supporting: tool_used, tool_not_used, tool_before, tool_called_with, parallel_calls, completed
- `/eval-check` command for manual validation in live sessions
- `/eval-trace` command for debugging trace output
- 4 initial eval definitions: read-over-cat, read-before-edit, no-redundant-cd, edit-over-sed
- CMUX runner orchestrating clean pi sessions per eval
- CLI entry: `npx pi-eval run [eval-name|category|all]`
- Baseline results file (`results/baseline.json`)

### Should Have / Nice to Have
- `--model` flag for runner CLI
- `--timeout` and `--output-json` flags
- `--output-dir` for custom results location

### Explicitly Deferred
- Model matrix (`--models` looping over multiple models) — v2
- Thinking-level matrix (`--thinking off,low,medium,high`) — v2
- Per-tool-description evals — v2
- Historical comparison (`npx pi-eval compare`) — v2
- CI integration (GitHub Action gating merge on regression) — v2

### Out of Scope
- End-to-end task completion benchmarks
- Measuring output quality or correctness of generated code
- Performance/latency benchmarking

## Constraints & Dependencies
### Constraints
- Must conform to pi extension API
- Each eval must run in a clean pi session (no cross-contamination)
- Minimal runtime dependencies

### Dependencies / Integrations
- `@mariozechner/pi-coding-agent` — peer dependency for extension API
- `@sinclair/typebox` — peer dependency for parameter schemas
- `yaml` — runtime dependency for parsing eval definitions
- CMUX — required for automated runner (Phase D)

## Assumptions
- Pi lifecycle hooks expose tool_call and tool_result events with sufficient detail
- CMUX panes can be programmatically started, sent input, and monitored
- Trace file at `.pi/eval-trace.json` can be reliably detected after agent_end

## Open Questions
- Exact CMUX API for pane management and output monitoring
- Whether `agent_end` fires reliably in all session types
- Optimal polling strategy for trace file detection

## Recommended Direction
Build in 5 phases (A→E): types + tracer first, then assertion engine + manual command, then eval definitions, then CMUX automation, then baseline run. Phases A-C are the minimum useful deliverable for manual eval validation.

## Supporting References
- `.paul/PROJECT.md` — compact landing brief
- `~/pi/workspace/thinkingSpace/plans/pi-agent-evals-build-plan.md` — original build plan
- `~/pi/workspace/thinkingSpace/plans/pi-agent-evals-spec.md` — design spec
- ForgeCode `benchmarks/evals/` — inspiration system

---
*Created: 2026-04-13*
