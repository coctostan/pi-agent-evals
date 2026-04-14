# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Milestone v0.3 — Testing, Eval Expansion & CI
## Current Position
Milestone: v0.3 Testing, Eval Expansion & CI — IN PROGRESS
Phase: I of 3 (Test Foundation & Validation Hardening) — APPLIED
Plan: I-01 complete
Status: All 4 tasks executed. 46 tests passing, build clean. PR #9 open.
Last activity: 2026-04-14 — Phase I-01 applied
Progress:
- Milestone: [▓▓▓░░░░░░░] 30%
- Phase I: [▓▓▓▓▓▓▓▓▓░] 90% (awaiting UNIFY)

## Loop Position
Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ◁     [Phase I: APPLY complete, awaiting UNIFY]
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
- `extensionDir` separates extension repo path from target project directory in RunnerOptions (Phase H)
- `--project-dir` resolves relative to ctx.cwd with existence+directory validation before cmux starts (Phase H)
- `-e` flag only added to pi command when extensionDir !== projectDir — backward-compatible (Phase H)

### Fixes
- Fix 02 (standard): removed unsafe `RunSummary` cast in `/eval-compare` header rendering to restore clean TypeScript builds | Phase G | index.ts

### Git State
- Last phase-transition commit: b70b2ef
- Branch: feature/I-test-foundation-validation
- Feature branch active: feature/I-test-foundation-validation
- PR: https://github.com/coctostan/pi-agent-evals/pull/9 (state: OPEN)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity
Last session: 2026-04-14
Stopped at: Phase I-01 APPLY complete — ready for UNIFY
Next action: /paul:unify for Phase I (Test Foundation & Validation Hardening)
Resume context:
- 46 tests passing (28 assertion + 18 loader)
- Loader hardened with assertion shape validation
- pass_threshold enforced, per-eval timeout wired
- PR: https://github.com/coctostan/pi-agent-evals/pull/9
Branch: feature/I-test-foundation-validation
PR: https://github.com/coctostan/pi-agent-evals/pull/9 (state: OPEN)

---
*STATE.md — Updated after every significant action*
