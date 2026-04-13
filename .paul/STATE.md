# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Phase E UNIFY complete — v0.1 milestone feature-complete
## Current Position
Milestone: v0.1 Initial Release
Phase: E of 5 (Baseline Run + Report) — Complete
Plan: 05-01 complete
Status: UNIFY complete, loop closed
Last activity: 2026-04-13 — Phase E UNIFY complete, baseline 8/8
Progress:
- Milestone: [▓▓▓▓▓▓▓▓▓▓] 100%
- Phase E: [▓▓▓▓▓▓▓▓▓▓] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — v0.1 milestone complete]
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
Stopped at: v0.1 milestone complete, merged to main
Next action: v0.1 milestone complete — plan v0.2 or celebrate 🎉
Resume file: .paul/ROADMAP.md
Branch: main
Last commit: caf5de6 (squash merge of PR #5)
PR: https://github.com/coctostan/pi-agent-evals/pull/5 (state: MERGED)

---
*STATE.md — Updated after every significant action*
