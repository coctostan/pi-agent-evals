# Roadmap: pi-agent-evals

## Overview
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion.

## Current Milestone
v0.3 Testing, Eval Expansion & CI

| Phase | Name | Plans | Status |
|-------|------|-------|---------|
| I | Test Foundation & Validation Hardening | TBD | Pending |
| J | Eval Expansion (4 → 11) & New Assertion Types | TBD | Pending |
| K | CI Integration & Documentation Refresh | TBD | Pending |

### Phase I: Test Foundation & Validation Hardening
**Focus:** Add vitest test framework, unit tests for assertion engine (all 6 types), unit tests for eval loader (valid/invalid YAML, deep assertion shape validation), enforce `pass_threshold` in runner, wire per-eval `timeout` from YAML to runner, harden YAML validation.

### Phase J: Eval Expansion (4 → 11) & New Assertion Types
**Focus:** 3 new assertion types (`tool_used_any`, `tool_no_errors`, `tool_preference`), 7 new eval definitions (search-over-find, grep-over-bash-grep, parallel-tool-calls, edit-over-write, edit-accuracy, graph-for-structure, truncation-follow-up), update existing 4 evals with additional prompts, new `context` category. Source: `thinkingSpace/plans/eval-definitions-v1.1.md`.

### Phase K: CI Integration & Documentation Refresh
**Focus:** GitHub Action workflow (run evals on PR, gate on regression), README refresh (document `/eval-compare`, remove stale roadmap entries, add eval expansion docs), update baseline with 11 evals.

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
