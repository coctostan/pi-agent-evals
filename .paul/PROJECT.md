# Project: pi-agent-evals

## Description
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion. Architecture: a tracer extension inside pi captures tool call events, while an external CMUX runner orchestrates eval execution and assertion checking.

## Core Value
Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.

## Current State
| Attribute | Value |
|-----------|-------|
| Version | 0.3.0 |
| Status | v0.3 In Progress — Phase I pending |
| Last Updated | 2026-04-14 (after v0.3 milestone scoping) |
**Current system summary:**
- Tracer extension captures tool calls via lifecycle hooks (Phase A — shipped)
- Assertion engine evaluates traces against 6 assertion types (Phase B — shipped)
- `/eval-check` command supports manual validation in live sessions (Phase B — shipped)
- YAML eval loader with field validation is stable (Phase B — shipped)
- CMUX runner + `/eval-run` command support automated eval execution with model/thinking flags (Phase D+F — shipped)
- `RunSummary` records `thinking` metadata and `/eval-compare` supports side-by-side historical comparisons (Phase G — shipped)
- Foreign-project execution via `--project-dir` with automatic `-e` extension loading (Phase H — shipped)
## Scope Snapshot
### Validated
- [x] Tracer extension (lifecycle hooks → trace.json) — v0.1
- [x] Assertion engine + `/eval-check` command — v0.1
- [x] 4 initial eval definitions (YAML) — v0.1
- [x] CMUX runner + `/eval-run` command — v0.1
- [x] Baseline run + results — v0.1
- [x] `/eval-run` model and thinking flag support — Phase F
- [x] `RunSummary` captures `thinking` metadata — Phase G
- [x] `/eval-compare` command compares two result files or a run against `baseline.json` — Phase G
### Planned (v0.3)
- [ ] Test framework + unit test coverage for assertions and loader
- [ ] Validation hardening: enforce pass_threshold, wire YAML timeout, deep assertion validation
- [ ] Matrix execution: `--models` and `--thinking-levels` with cartesian product runs
- [ ] CI integration (GitHub Action gating merge on regression)
- [ ] Documentation refresh

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
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| `/eval-check read-over-cat` correct pass/fail | Works | ✅ Works | Validated |
| `/eval-run all` completes unattended | 4 evals | ✅ 4 evals (8 prompts) | Validated |
| `results/baseline.json` exists | Exists | ✅ 8/8 passed | Validated |
| `RunSummary` persists thinking metadata | Present in results schema | ✅ Present | Validated |
| `/eval-compare` renders readable run-to-run deltas | Works | ✅ Smoke-tested | Validated |

## Key Decisions
| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Runner outside, tracer inside architecture | Clean session isolation; runner can loop over models/configs | 2026-04-13 | Active |
| YAML eval definitions | Human-readable, easy to add new evals | 2026-04-13 | Active |
| Layered artifact model (`PROJECT.md` + `PRD.md`) adopted at init | Keep hot-path context concise while preserving deeper product definition | 2026-04-13 | Active |
| `completed` assertion = non-empty trace + zero errors | User-confirmed: both conditions required, not just "agent ran" | 2026-04-13 | Active |
| CLI removed in favor of `/eval-run` pi command | Single interface, no redundant code path; CLI required cmux anyway | 2026-04-13 | Active |
| `RunSummary` stores `thinking` metadata | Comparisons need model + thinking context to be meaningful across runs | 2026-04-14 | Active |
| `/eval-compare` uses padded plain-text output with tolerant missing-eval handling | Terminal notifications need deterministic formatting and old result files must remain comparable | 2026-04-14 | Active |

## Links
- `PRD.md` — deeper product-definition context
- `.paul/ROADMAP.md` — milestone and phase structure
- `~/pi/workspace/thinkingSpace/plans/pi-agent-evals-build-plan.md` — original build plan

---
*Last updated: 2026-04-14 after v0.3 milestone scoping*
