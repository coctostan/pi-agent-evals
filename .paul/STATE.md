# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** v0.2 — Model & thinking matrix, project directory support

## Current Position
Milestone: v0.2 Model & Thinking Matrix
Phase: F of 3 (Model & Thinking Discovery + Flags)
Plan: F-01 complete
Status: UNIFY complete, loop closed
Last activity: 2026-04-13 — Phase F UNIFY complete
Progress:
- Milestone: [▓▓▓░░░░░░░] 33%
- Phase F: [▓▓▓▓▓▓▓▓▓▓] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — Phase F done, ready for Phase G]
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
- Flag renamed from --models to --model (singular, matches pi CLI convention) (Phase F)
- Model validation via pi --list-models with graceful fallback (Phase F)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-13
Stopped at: Phase F complete, merged to main
Next action: /paul:plan for Phase G
Resume file: .paul/ROADMAP.md
Branch: main
Last commit: 1929018 (squash merge of PR #6)
PR: https://github.com/coctostan/pi-agent-evals/pull/6 (state: MERGED)

---
*STATE.md — Updated after every significant action*
