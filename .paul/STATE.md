# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Phase D complete — ready for merge gate then Phase E planning
## Current Position
Milestone: v0.1 Initial Release
Phase: D of 5 (CMUX Runner) — Complete
Plan: D-01 complete
Status: UNIFY complete, loop closed
Last activity: 2026-04-13 — Phase D UNIFY complete
Progress:
- Milestone: [▓▓▓▓▓▓▓▓░░] 80%
- Phase D: [▓▓▓▓▓▓▓▓▓▓] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — ready for next PLAN]
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
Stopped at: Phase D complete, merged to main
Next action: /paul:plan for Phase E (Baseline Run + Report)
Resume file: .paul/ROADMAP.md
Branch: main
Last commit: 7e924f8 (squash merge of PR #4)
PR: https://github.com/coctostan/pi-agent-evals/pull/4 (state: MERGED)

---
*STATE.md — Updated after every significant action*
