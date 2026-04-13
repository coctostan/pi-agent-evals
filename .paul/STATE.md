# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Phase E planning complete — ready for APPLY
## Current Position
Milestone: v0.1 Initial Release
Phase: E of 5 (Baseline Run + Report) — Planning
Plan: 05-01 created, awaiting approval
Status: PLAN created, ready for APPLY
Last activity: 2026-04-13 — Created .paul/phases/05-baseline-run-report/05-01-PLAN.md
Progress:
- Milestone: [▓▓▓▓▓▓▓▓░░] 80%
- Phase E: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Plan created, awaiting approval]
```

## Accumulated Context

### Decisions
- Runner outside, tracer inside architecture (clean session isolation)
- YAML eval definitions (human-readable, easy to extend)
- 5-phase build order: A(tracer) → B(assertions) → C(evals) → D(runner) → E(baseline)
- Use tool_execution_start/end (passive) instead of tool_call/tool_result (interceptive) for tracing
- Drop argumentsHash — stringified args suffice for assertion matching
- Clear trace on agent_start for clean per-loop measurement
- `completed` assertion checks both non-empty trace AND zero isError entries (not just "agent ran")
- Use cmux panes (not workspaces) for lighter eval lifecycle
- Run pi from project dir (not temp dir) for automatic extension loading
- Configurable timing: --startup-delay, --poll-interval for flexible pi readiness detection
- /eval-run pi command as sole eval interface; CLI removed as redundant (Phase E)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-13
Stopped at: Plan 05-01 created
Next action: Review and approve plan, then run /paul:apply .paul/phases/05-baseline-run-report/05-01-PLAN.md
Resume file: .paul/phases/05-baseline-run-report/05-01-PLAN.md
Branch: main
Last commit: 7e924f8 (squash merge of PR #4)

---
*STATE.md — Updated after every significant action*
