---
phase: C-eval-definitions
plan: 01
completed: 2026-04-13T12:00:00Z
duration: ~10 minutes
---

## Objective
Create the 4 initial YAML eval definitions that test specific agent behavioral patterns for tool routing and discipline.

## What Was Built

| File | Category | Assertions | Prompts |
|------|----------|------------|---------|
| evals/read-over-cat.yaml | tool-routing | 3 (tool_used, tool_not_used, completed) | 2 |
| evals/read-before-edit.yaml | tool-discipline | 4 (tool_used ×2, tool_before, completed) | 2 |
| evals/no-redundant-cd.yaml | tool-discipline | 2 (tool_not_used, completed) | 2 |
| evals/edit-over-sed.yaml | tool-routing | 3 (tool_used, tool_not_used, completed) | 2 |

**Total:** 4 eval files, 12 assertions, 8 prompts. Zero source code changes.

## Acceptance Criteria Results

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | read-over-cat validates tool routing | ✓ PASS |
| AC-2 | read-before-edit validates precondition discipline | ✓ PASS |
| AC-3 | no-redundant-cd validates bash discipline | ✓ PASS |
| AC-4 | edit-over-sed validates tool routing | ✓ PASS |
| AC-5 | All 4 evals load via loader | ✓ PASS |
| AC-6 | Correct assertion type discriminants and messages | ✓ PASS |

## Verification Results

```
$ ls evals/*.yaml | wc -l
4 ✓

$ node validation script
  read-over-cat: OK (3 assertions)
  read-before-edit: OK (4 assertions)
  no-redundant-cd: OK (2 assertions)
  edit-over-sed: OK (3 assertions)
All parse with valid types and messages ✓

$ pnpm run build
✓ Build successful ✓

$ git diff --name-only -- src/ index.ts package.json
(no changes — boundaries respected) ✓
```

## Module Execution Reports

**Pre-plan dispatch:**
- TODD(100): No test files. Skip.
- IRIS(150): No anti-patterns. Skip.
- DAVE(200): No CI. Skip.
- DOCS(200): No docs. Skip.
- RUBY(250): No debt. Skip.
- DEAN(50): 0 vulnerabilities. PASS.
- SETH(80): No secrets. PASS.
- ARCH(75): New evals/ directory, clean. PASS.

**Post-apply:** All PASS — no source code changes, no new concerns.

**Post-unify:**
- WALT(100): Build clean, 0 tests, trend stable.
- SKIP(200): No new decisions this phase.
- RUBY(300): No source files changed.

## Deviations

None. All tasks completed exactly as planned.

## Key Patterns/Decisions

| Decision | Rationale |
|----------|-----------|
| `printf` instead of `echo -e` for multiline setup | More portable across shells |
| `/tmp/` for test fixtures | Clean, disposable, no repo pollution |
| `pass_threshold: 1.0` on all evals | All prompts must pass — strict behavioral enforcement |
| `argument_pattern` with escaped regex in YAML | Double-quoted strings for proper backslash handling |

## Next Phase

**Phase D: CMUX Runner** — Build the automated runner that orchestrates clean pi sessions per eval, sends prompts, waits for completion, and collects results. CLI entry: `npx pi-eval run [eval-name|category|all]`.
