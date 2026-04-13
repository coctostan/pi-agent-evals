# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Phase B — Assertions + /eval-check

## Current Position

Milestone: v0.1 Initial Release
Phase: B of 5 (Assertions + /eval-check) — APPLY complete
Plan: B-01 — all tasks PASS
Status: APPLY complete, ready for UNIFY
Last activity: 2026-04-13 — Phase B APPLY complete
Progress:
- Milestone: [▓▓▓▓░░░░░░] 40%
- Phase B: [▓▓▓▓▓▓▓▓░░] 80%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [APPLY complete, ready for UNIFY]
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

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: 2026-04-13
Stopped at: Phase B APPLY complete
Next action: /paul:unify .paul/phases/B-assertions-eval-check/B-01-PLAN.md
Resume file: .paul/phases/B-assertions-eval-check/B-01-PLAN.md
Branch: feature/B-assertions-eval-check
Last commit: 9d15a89
PR: https://github.com/coctostan/pi-agent-evals/pull/2 (state: OPEN)

---
*STATE.md — Updated after every significant action*
