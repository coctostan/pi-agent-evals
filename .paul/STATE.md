# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** v0.2 — Model & thinking matrix, project directory support

## Current Position
Milestone: v0.2 Model & Thinking Matrix
Phase: G of 3 (Matrix Execution + Results Format) — Complete
Plan: complete
Status: Ready for next PLAN
Last activity: 2026-04-14 — Phase G UNIFY complete
Progress:
- Milestone: [▓▓▓▓▓▓░░░░] 66%
- Phase G: [▓▓▓▓▓▓▓▓▓▓] 100%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete - ready for next PLAN]
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

### Fixes
- Fix 02 (standard): removed unsafe `RunSummary` cast in `/eval-compare` header rendering to restore clean TypeScript builds | Phase G | index.ts

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-14
Stopped at: Phase G UNIFY complete
Next action: Transition Phase G → H
Resume file: .paul/phases/G-matrix-execution-results/G-01-SUMMARY.md
Branch: feature/G-matrix-execution-results
PR: https://github.com/coctostan/pi-agent-evals/pull/7 (state: OPEN)

---
*STATE.md — Updated after every significant action*
