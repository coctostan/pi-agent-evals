# Roadmap: pi-agent-evals

## Overview
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion.

## Current Milestone
**v0.1 Initial Release** (v0.1.0)
Status: ✅ Complete
Phases: 5 of 5 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| A | Tracer + Types | A-01 | Complete | 2026-04-13 |
| B | Assertions + /eval-check | B-01 | Complete | 2026-04-13 |
| C | Eval Definitions (4 initial) | C-01 | Complete | 2026-04-13 |
| D | CMUX Runner | D-01 | Complete | 2026-04-13 |
| E | Baseline Run + Report | E-01 | Complete | 2026-04-13 |

## Phase Details
### Phase E: Baseline Run + Report
**Scope:** Add `/eval-run` pi command (sole eval interface), remove CLI, create README, execute first baseline.
**Plan:** `.paul/phases/05-baseline-run-report/05-01-PLAN.md`
**Tasks:** 3 auto + 1 checkpoint (human runs `/eval-run all --baseline` in pi)
**Files:** `index.ts`, `src/runner/cli.ts` (deleted), `package.json`, `README.md`, `results/baseline.json`

---
*Roadmap created: 2026-04-13*
