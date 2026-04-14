# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** v0.2 — Project directory support, milestone closeout

## Current Position
Milestone: v0.2 Model & Thinking Matrix
Phase: H of 3 (Project Directory Support)
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-14 — Phase G complete, transitioned to Phase H
Progress:
- Milestone: [▓▓▓▓▓▓░░░░] 66%
- Phase H: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Ready to start next loop — Phase H PLAN]
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
- `RunSummary` stores `thinking` metadata for cross-run comparison (Phase G)
- `/eval-compare` uses padded plain-text output and treats missing evals as display gaps, not errors (Phase G)

### Fixes
- Fix 02 (standard): removed unsafe `RunSummary` cast in `/eval-compare` header rendering to restore clean TypeScript builds | Phase G | index.ts

### Git State
- Last commit: 000ce5f
- Branch: main
- Feature branch merged: feature/G-matrix-execution-results
- PR: https://github.com/coctostan/pi-agent-evals/pull/7 (state: MERGED)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-14
Stopped at: Phase G complete, ready to plan Phase H
Next action: /paul:plan for Phase H
Resume file: .paul/ROADMAP.md
Branch: main
PR: https://github.com/coctostan/pi-agent-evals/pull/7 (state: MERGED)

---
*STATE.md — Updated after every significant action*
