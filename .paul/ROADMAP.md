# Roadmap: pi-agent-evals

## Overview
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion.

## Current Milestone
v0.3 Testing, Matrix & CI

| Phase | Name | Plans | Status |
|-------|------|-------|---------|
| I | Test Foundation & Validation Hardening | TBD | Pending |
| J | Matrix Execution | TBD | Pending |
| K | CI Integration & Documentation Refresh | TBD | Pending |

### Phase I: Test Foundation & Validation Hardening
**Focus:** Add vitest test framework, unit tests for assertion engine (all 6 types), unit tests for eval loader (valid/invalid YAML, deep assertion shape validation), enforce `pass_threshold` in runner, wire per-eval `timeout` from YAML to runner, harden YAML validation.

### Phase J: Matrix Execution
**Focus:** `--models` comma-separated multi-model flag, `--thinking-levels` comma-separated multi-thinking flag, cartesian product execution (model × thinking), aggregated `RunSummary` with per-combination breakdown, `/eval-compare` matrix-aware comparison.

### Phase K: CI Integration & Documentation Refresh
**Focus:** GitHub Action workflow (run evals on PR, gate on regression), README refresh (document `/eval-compare`, remove stale roadmap entries, add matrix execution docs), expand eval definitions.

## Completed Milestones

<details>
<summary>v0.2 Model & Thinking Matrix — 2026-04-14 (3 phases)</summary>

| Phase | Name | Plans | Completed |
|-------|------|-------|-----------|
| F | Model & Thinking Discovery + Flags | F-01 | 2026-04-13 |
| G | Matrix Execution + Results Format | G-01 | 2026-04-14 |
| H | Project Directory Support | H-01 | 2026-04-14 |

Archive: `.paul/milestones/v0.2.0-ROADMAP.md`

</details>
<summary>v0.1 Initial Release — 2026-04-13 (5 phases)</summary>
|-------|------|-------|-----------|
| A | Tracer + Types | A-01 | 2026-04-13 |
| B | Assertions + /eval-check | B-01 | 2026-04-13 |
| C | Eval Definitions (4 initial) | C-01 | 2026-04-13 |
| D | CMUX Runner | D-01 | 2026-04-13 |
| E | Baseline Run + Report | E-01 | 2026-04-13 |

Archive: `.paul/milestones/v0.1.0-ROADMAP.md`
</details>

---
*Roadmap updated: 2026-04-14 — Milestone v0.3 planned*
