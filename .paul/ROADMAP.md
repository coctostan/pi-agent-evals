# Roadmap: pi-agent-evals

## Overview
A pi extension + runner that measures specific agent behaviors — tool routing, discipline, preconditions — not end-to-end task completion.

## Current Milestone
**v0.2 Model & Thinking Matrix** (v0.2.0)
Status: 🚧 In Progress
Phases: 1 of 3 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| F | Model & Thinking Discovery + Flags | F-01 | Complete | 2026-04-13 |
| G | Matrix Execution + Results Format | G-01 | Planning | - |
| H | Project Directory Support | TBD | Not started | - |

## Phase Details

### Phase F: Model & Thinking Discovery + Flags
**Focus:** `--models` and `--thinking` flag parsing for `/eval-run`, `pi --list-models` integration for dynamic model enumeration, available thinking level enumeration, runner plumbing to pass model/thinking to pi sessions.

### Phase G: Matrix Execution + Results Format
**Focus:** Loop over selected model/thinking combinations, new results schema with per-model/thinking sections, summary table output after runs, `--baseline` behavior with matrix combinations.

### Phase H: Project Directory Support
**Focus:** `--project-dir` flag, launch pi with `-e <path>` in foreign project directories, validate extension loads correctly, end-to-end validation.

## Completed Milestones

<details>
<summary>v0.1 Initial Release — 2026-04-13 (5 phases)</summary>

| Phase | Name | Plans | Completed |
|-------|------|-------|-----------|
| A | Tracer + Types | A-01 | 2026-04-13 |
| B | Assertions + /eval-check | B-01 | 2026-04-13 |
| C | Eval Definitions (4 initial) | C-01 | 2026-04-13 |
| D | CMUX Runner | D-01 | 2026-04-13 |
| E | Baseline Run + Report | E-01 | 2026-04-13 |

Archive: `.paul/milestones/v0.1.0-ROADMAP.md`

</details>

---
*Roadmap updated: 2026-04-13 — v0.2 milestone created*
