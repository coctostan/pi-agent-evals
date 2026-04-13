# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** v0.1 milestone complete — ready for next milestone

## Current Position
Milestone: Awaiting next milestone
Phase: None active
Plan: None
Status: Milestone v0.1 Initial Release complete — ready for next
Last activity: 2026-04-13 — Milestone completed
Progress:
- v0.1 Initial Release: [▓▓▓▓▓▓▓▓▓▓] 100% ✓

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Milestone complete - ready for next]
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
- Case-insensitive tool name matching in assertions (Phase E bugfix — pi reports lowercase)
- cmux surface ref parser handles 'OK surface:N pane:N workspace:N' format (Phase E bugfix)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-13
Stopped at: Milestone v0.1 Initial Release complete
Next action: /paul:discuss or /paul:milestone to define next milestone
Resume file: .paul/MILESTONES.md
Branch: main
Last commit: 107d3eb (milestone v0.1 complete)
PR: https://github.com/coctostan/pi-agent-evals/pull/5 (state: MERGED)

---
*STATE.md — Updated after every significant action*
