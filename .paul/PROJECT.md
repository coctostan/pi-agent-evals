# Project: pi-agent-evals

## Description
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion. Architecture: a tracer extension inside pi captures tool call events, while an external CMUX runner orchestrates eval execution and assertion checking.

## Core Value
Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.

## Current State
| Attribute | Value |
|-----------|-------|
| Version | 0.1.0 |
| Status | Building |
| Last Updated | 2026-04-13 |

**Current system summary:**
- Tracer extension captures tool calls via lifecycle hooks (Phase A — shipped)
- Assertion engine evaluates traces against 6 assertion types (Phase B — shipped)
- `/eval-check` command for manual validation in live sessions (Phase B — shipped)
- YAML eval loader with field validation (Phase B — shipped)
- CMUX runner + CLI for automated eval execution (Phase D — shipped)

## Scope Snapshot
### Active
- ✓ Tracer extension (lifecycle hooks → trace.json) — Phase A
- ✓ Assertion engine + `/eval-check` command — Phase B
- ✓ 4 initial eval definitions (YAML) — Phase C
- ✓ CMUX runner + CLI (`npx pi-eval run`) — Phase D
- Baseline run + results

### Planned
- Model matrix (`--models` flag)
- Thinking-level matrix (`--thinking` flag)
- Historical comparison (`npx pi-eval compare`)
- CI integration (GitHub Action)

### Out of Scope
- End-to-end task completion benchmarks — this measures specific behaviors only
- Per-tool-description evals (v2)

## Target Users
**Primary:** Pi developers and users who want to validate agent behavior against defined expectations
- Quantitative measurement of tool routing compliance
- Before/after comparison when changing prompts, models, or extensions

## Constraints
- Must use pi extension API (`@mariozechner/pi-coding-agent`)
- `@sinclair/typebox` for parameter schemas (peer dep)
- CMUX required for automated runner (Phase D)
- Minimal runtime dependencies (`yaml` for eval parsing)

## Success Metrics
- `/eval-check read-over-cat` produces correct pass/fail in a live session
- `npx pi-eval run all` completes 4 evals unattended
- `results/baseline.json` exists with current pi's scores

## Key Decisions
| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Runner outside, tracer inside architecture | Clean session isolation; runner can loop over models/configs | 2026-04-13 | Active |
| YAML eval definitions | Human-readable, easy to add new evals | 2026-04-13 | Active |
| Layered artifact model (`PROJECT.md` + `PRD.md`) adopted at init | Keep hot-path context concise while preserving deeper product definition | 2026-04-13 | Active |
| `completed` assertion = non-empty trace + zero errors | User-confirmed: both conditions required, not just "agent ran" | 2026-04-13 | Active |

## Links
- `PRD.md` — deeper product-definition context
- `.paul/ROADMAP.md` — milestone and phase structure
- `~/pi/workspace/thinkingSpace/plans/pi-agent-evals-build-plan.md` — original build plan

---
*Created: 2026-04-13*
