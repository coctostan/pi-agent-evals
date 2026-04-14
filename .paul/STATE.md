# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Milestone v0.3 — Testing, Eval Expansion & CI
## Current Position
Milestone: v0.3 Testing, Eval Expansion & CI — IN PROGRESS
Phase: K of 3 (CI Integration & Documentation Refresh) — PLANNED
Plan: K-01 ready for APPLY
Status: Phase K plan written. Ready for implementation.
Last activity: 2026-04-14 — Phase K planned
Progress:
- Milestone: [▓▓▓▓▓▓░░░░] 67%
- Phase K: [░░░░░░░░░░] 0%
## Loop Position
Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓                        [Phase K planned, APPLY pending]
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
- vitest chosen for test framework (ESM-native, zero config, fast) (Phase I)
- Assertion shape validation hard-fails on unknown types; Phase J updated with 3 new types (Phase I/J)
- pass_threshold is display-layer only — RunSummary totals count individual prompts for backward compat (Phase I)
- Test files as siblings (`src/*.test.ts`) not in separate test/ directory (Phase I)
- `tool_no_errors` vacuous pass when tool absent (no calls = no errors) (Phase J)
- `tool_preference` vacuous pass when neither group used; soft signal, no special display (Phase J)
- graph-for-structure.yaml uses `cwd` field as informational metadata for runner (Phase J)

### Fixes
- Fix 02 (standard): removed unsafe `RunSummary` cast in `/eval-compare` header rendering to restore clean TypeScript builds | Phase G | index.ts

### Git State
- Last phase-transition commit: d0967f1
- Branch: main
- Feature branch merged: feature/J-eval-expansion-assertion-types
- PR: https://github.com/coctostan/pi-agent-evals/pull/10 (state: MERGED)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity
Last session: 2026-04-14
Stopped at: Phase K plan written — APPLY pending
Next action: /paul:apply for Phase K-01
Resume context:
- Phase K plan: `.paul/phases/K-ci-integration-documentation-refresh/K-01-PLAN.md`
- 2 tasks: README refresh (auto) + baseline run (manual, skippable)
- No source code changes — docs + baseline only
- CI dropped from scope (low value for single-developer project)
Branch: main