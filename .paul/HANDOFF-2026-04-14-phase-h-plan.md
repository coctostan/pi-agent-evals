# PAUL Handoff

**Date:** 2026-04-14T12:57:35Z
**Status:** paused

---

## READ THIS FIRST

You have no prior context. This document tells you everything.

**Project:** pi-agent-evals
**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.

---

## Current State

**Version:** v0.2.0
**Phase:** H of 3 — Project Directory Support
**Plan:** H-01 — created, awaiting approval

**Loop Position:**
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○
```

## Git State

| Field | Value |
|-------|-------|
| Branch | main |
| Base | main |
| PR | https://github.com/coctostan/pi-agent-evals/pull/7 (MERGED) |
| CI | N/A |
| Behind base | Up to date |

---

## What Was Done

- Read the PALS planning workflow, plan template, module registry, and current project artifacts.
- Verified planning preconditions for Phase H and confirmed `pals.json` schema is current (`2.0.0`).
- Created Phase H plan at `.paul/phases/H-project-directory-support/H-01-PLAN.md`.
- Updated `.paul/ROADMAP.md` so Phase H now shows `H-01 | Planning`.
- Updated `.paul/STATE.md` to reflect `PLAN created, ready for APPLY`.
- Collected pre-plan module findings for the planned files and recorded them in the plan.

---

## What's In Progress

- No source implementation has started.
- The project is waiting for review/approval of `H-01-PLAN.md` before APPLY.
- Working tree changes are only planning artifacts:
  - modified: `.paul/ROADMAP.md`
  - modified: `.paul/STATE.md`
  - untracked: `.paul/phases/H-project-directory-support/H-01-PLAN.md`

---

## What's Next

**Immediate:** Review `H-01-PLAN.md` and either approve it or adjust the plan if scope/details need to change.

**After that:** Run `/paul:apply .paul/phases/H-project-directory-support/H-01-PLAN.md` to implement Phase H.

---

## Key Files

| File | Purpose |
|------|---------|
| `.paul/STATE.md` | Live project state and current loop position |
| `.paul/ROADMAP.md` | Milestone/phase overview with Phase H now in planning |
| `.paul/phases/H-project-directory-support/H-01-PLAN.md` | Executable Phase H plan for `--project-dir` support |
| `index.ts` | `/eval-run` command parsing that will gain `--project-dir` handling |
| `src/runner/types.ts` | Runner option types that need extension-path vs target-project separation |
| `src/runner/cmux-runner.ts` | cmux launcher that must start pi in a foreign project and load the extension via `-e` |
| `README.md` | User-facing command docs that must be updated for the new flag |

---

## Key Planning Decisions / Constraints

- Keep eval definitions and results rooted in the current repo (`ctx.cwd`), even when pi runs in a foreign project.
- Introduce explicit separation between extension repo path and target project directory in runner options.
- Preserve existing behavior when `--project-dir` is omitted.
- Do not add dependencies, change result schema, or alter eval definitions in this phase.
- Smoke verification should prove `.pi/eval-trace.json` is created under the foreign target project.

---

## Resume Instructions

1. Read `.paul/STATE.md` for the latest position.
2. Read `.paul/phases/H-project-directory-support/H-01-PLAN.md`.
3. If the plan is acceptable, run `/paul:apply .paul/phases/H-project-directory-support/H-01-PLAN.md`.
4. If the plan needs adjustment, edit the plan first, then proceed to APPLY.

---

*Handoff created: 2026-04-14T12:57:35Z*
