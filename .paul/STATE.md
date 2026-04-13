# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Phase D — CMUX Runner APPLY complete, ready for UNIFY
## Current Position
Milestone: v0.1 Initial Release
Phase: D of 5 (CMUX Runner) — Apply complete
Plan: D-01 executed
Status: APPLY complete, ready for UNIFY
Last activity: 2026-04-13 — Phase D APPLY complete (3 tasks, 0 failures)
Progress:
- Milestone: [▓▓▓▓▓▓▓▓░░] 80%
- Phase D: [▓▓▓▓▓▓▓▓░░] 80%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [Apply complete, ready for UNIFY]
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

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-13
Stopped at: Phase D APPLY complete
Next action: /paul:unify .paul/phases/D-cmux-runner/D-01-PLAN.md
Resume file: .paul/phases/D-cmux-runner/D-01-PLAN.md
Branch: feature/D-cmux-runner
Last commit: 1052441
PR: https://github.com/coctostan/pi-agent-evals/pull/4 (state: OPEN)

---
*STATE.md — Updated after every significant action*
