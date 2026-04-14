# Milestones

Completed milestone log for this project.

| Milestone | Completed | Duration | Stats |
|-----------|-----------|----------|-------|
| v0.1 Initial Release | 2026-04-13 | ~6 hours | 5 phases, 5 plans |
| v0.2 Model & Thinking Matrix | 2026-04-14 | ~2 days | 3 phases, 3 plans |

---

## ✅ v0.1 Initial Release

**Completed:** 2026-04-13
**Duration:** ~6 hours (single day)

### Stats

| Metric | Value |
|--------|-------|
| Phases | 5 |
| Plans | 5 |
| Files changed | 17 |
| Lines of TypeScript | ~1,700 |
| Eval definitions | 4 (12 assertions, 8 prompts) |
| Baseline result | 8/8 passed (Claude Opus 4.6) |

### Key Accomplishments

- **Tracer extension** — Lifecycle hooks capture every tool call to `.pi/eval-trace.json` with timestamps, arguments, and error status
- **Assertion engine** — 6 assertion types (`tool_used`, `tool_not_used`, `tool_before`, `tool_called_with`, `parallel_calls`, `completed`) with exhaustive type-safe checking
- **YAML eval loader** — Human-readable eval definitions with field validation
- **`/eval-check` command** — Manual in-session validation against live traces
- **4 initial eval definitions** — `read-over-cat`, `read-before-edit`, `no-redundant-cd`, `edit-over-sed` covering tool-routing and tool-discipline categories
- **CMUX runner** — Automated pane-based orchestration: create → start pi → send prompt → poll trace → assert → cleanup
- **`/eval-run` pi command** — Sole eval execution interface (CLI removed as redundant)
- **First baseline** — 8/8 passed on Claude Opus 4.6, `results/baseline.json` committed

### Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Runner outside, tracer inside architecture | Clean session isolation; runner can loop over models/configs | 2026-04-13 |
| YAML eval definitions | Human-readable, easy to add new evals | 2026-04-13 |
| `tool_execution_start/end` (passive) hooks | Zero risk of interfering with tool execution | 2026-04-13 |
| `completed` = non-empty trace + zero errors | Both conditions required, not just "agent ran" | 2026-04-13 |
| CLI removed → `/eval-run` only | Single pi-native interface; CLI was redundant (required cmux anyway) | 2026-04-13 |
| Case-insensitive tool name matching | pi reports lowercase; evals should be case-agnostic | 2026-04-13 |

---

## ✅ v0.2 Model & Thinking Matrix

**Completed:** 2026-04-14
**Duration:** ~2 days

### Stats

| Metric | Value |
|--------|-------|
| Phases | 3 (F, G, H) |
| Plans | 3 |
| Files changed | 4 core (index.ts, src/runner/types.ts, src/runner/cmux-runner.ts, README.md) |
| New features | `--model`, `--thinking`, `--project-dir` flags, `/eval-compare` command |

### Key Accomplishments

- **Model flag** (`--model`) — Pass model selection to pi sessions, validated against `pi --list-models`
- **Thinking flag** (`--thinking`) — Pass thinking level (off/minimal/low/medium/high/xhigh) to pi sessions
- **Matrix execution** — `RunSummary` stores model and thinking metadata for cross-run comparison
- **`/eval-compare` command** — Side-by-side comparison of two result files with delta indicators
- **Foreign-project execution** (`--project-dir`) — Run evals against any project directory while keeping eval definitions and results in the extension repo
- **Extension loading** — Runner automatically uses `pi -e` to load the tracer when targeting a foreign project

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| `--model` singular (not `--models`) | Matches pi CLI convention | F |
| Model validation via `pi --list-models` with fallback | Graceful when offline or model list unavailable | F |
| `RunSummary` stores thinking metadata | Enables cross-run comparison by thinking level | G |
| Padded plain-text `/eval-compare` output | Readable in terminal without requiring rich formatting | G |
| `extensionDir` separate from `projectDir` | Clean separation; `-e` flag only when needed | H |
| `--project-dir` resolves relative to `ctx.cwd` | Consistent with how other pi paths resolve | H |

---
*MILESTONES.md — Updated after each milestone completion*
