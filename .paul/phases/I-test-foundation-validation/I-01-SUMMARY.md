# Phase I-01 Summary: Test Foundation & Validation Hardening

**Phase:** I-test-foundation-validation
**Plan:** 01
**Status:** COMPLETE
**Merged:** 2026-04-14
**PR:** https://github.com/coctostan/pi-agent-evals/pull/9

## What Was Delivered

### Task 1: vitest + test infrastructure
- Added vitest 4.1.4 as devDependency
- `pnpm test` (vitest run) and `pnpm test:watch` (vitest) scripts
- Excluded `*.test.ts` from tsc build output via tsconfig.json

### Task 2: Assertion engine tests (28 tests)
- All 6 assertion types covered with pass, fail, and edge cases
- `tool_used`: 4 tests (pass, fail, case-insensitive, empty trace)
- `tool_not_used`: 6 tests (absent, present w/o pattern, pattern no-match, pattern match, invalid regex, case-insensitive)
- `tool_before`: 5 tests (correct order, reversed, missing first, missing then, same tool)
- `tool_called_with`: 4 tests (matching, non-matching, absent tool, invalid regex)
- `parallel_calls`: 4 tests (meets threshold, too small, no parallelGroup, empty trace)
- `completed`: 3 tests (clean, empty, errors)
- General: 2 tests (ordering, independent evaluation)

### Task 3: Loader hardening + tests (18 tests)
- Deep assertion shape validation via `validateAssertionShape()` in `src/loader.ts`
- Validates type-specific required fields per assertion type
- Descriptive error format: `Eval definition ${path}: assertion[${index}] (type: "${type}"): missing required field "${field}"`
- Forward-compatible comment for Phase J's new assertion types
- Tests: valid loading (2), file errors (2), field validation (4), shape validation (8), listEvalDefinitions (2)

### Task 4: pass_threshold + per-eval timeout
- Per-eval timeout from YAML `timeout` field (default: 120_000ms)
- `pass_threshold` enforcement: evaluates prompt pass rate against threshold per eval
- Display summary shows threshold info when threshold < 1.0 or not all prompts pass
- Backward-compatible: individual prompt results and RunSummary schema unchanged

## Stats

| Metric | Value |
|--------|-------|
| Tests added | 46 (28 assertion + 18 loader) |
| Files created | 2 (src/assertions.test.ts, src/loader.test.ts) |
| Files modified | 4 (package.json, src/loader.ts, index.ts, tsconfig.json) |
| Lines added | ~1,550 |
| Dependencies added | 1 (vitest, devDependency) |
| Protected files changed | 0 |

## Acceptance Criteria

- [x] AC-1: vitest installed, `pnpm test` runs
- [x] AC-2: All 6 assertion types have pass/fail/edge test cases
- [x] AC-3: Loader tests cover valid/invalid/edge cases
- [x] AC-4: Loader validates assertion shapes with descriptive errors
- [x] AC-5: pass_threshold enforced per-eval (default 1.0)
- [x] AC-6: Per-eval timeout from YAML wired to runner (default 120s)

## Decisions Made
- vitest chosen over jest (ESM-native, zero config, fast)
- Assertion shape validation hard-fails on unknown types (Phase J will update to accommodate new types)
- pass_threshold is display-layer only — RunSummary totals still count individual prompts for backward compatibility
- Test files live as siblings (`src/*.test.ts`) not in a separate test/ directory
