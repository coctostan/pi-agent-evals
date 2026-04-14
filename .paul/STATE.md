# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-04-13)

**Core value:** Measure and validate that AI agents follow correct tool routing and behavioral discipline in pi sessions.
**Current focus:** Milestone v0.3 — Testing, Eval Expansion & CI
## Current Position
Milestone: v0.3 Testing, Eval Expansion & CI — IN PROGRESS
Phase: I of 3 (Test Foundation & Validation Hardening) — PLANNED
Plan: I-01 ready for APPLY
Status: Phase I plan written with 4 tasks, 6 acceptance criteria.
Last activity: 2026-04-14 — Phase I plan created
Progress:
- Milestone: [░░░░░░░░░░] 0%
- Phase I: [▓░░░░░░░░░] 10% (planned)

## Loop Position
Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ◁                    [Phase I: PLAN complete, awaiting APPLY]
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
- Last phase-transition commit: 077760a
- Branch: main
- Feature branch merged: feature/H-project-directory-support
- PR: https://github.com/coctostan/pi-agent-evals/pull/8 (state: MERGED)

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity
Last session: 2026-04-14
Stopped at: Phase I plan written — ready for APPLY
Next action: /paul:apply for Phase I-01 (Test Foundation & Validation Hardening)
Resume context:
- Plan: `.paul/phases/I-test-foundation-validation/I-01-PLAN.md`
- 4 tasks: vitest setup, assertion tests, loader tests + hardening, pass_threshold + timeout wiring
- Files to create: src/assertions.test.ts, src/loader.test.ts
- Files to modify: package.json, src/loader.ts, index.ts
- Protected: src/types.ts, src/tracer.ts, src/runner/*
Branch: main
PR: none (will create feature branch on APPLY)

---
*STATE.md — Updated after every significant action*
