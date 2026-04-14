# Phase J-01 Summary: Eval Expansion & New Assertion Types

**Phase:** J-eval-expansion-assertion-types
**Plan:** 01
**Status:** COMPLETE
**PR:** https://github.com/coctostan/pi-agent-evals/pull/10

## What Was Delivered

### Task 1: 3 new assertion type interfaces in types.ts
- `ToolUsedAnyAssertion` — pass if ANY of listed tools was called
- `ToolNoErrorsAssertion` — pass if specified tool had zero isError results
- `ToolPreferenceAssertion` — soft signal: preferred tools used more than alternatives
- `Assertion` union expanded from 6 to 9 members

### Task 2: 3 new assertion checkers in assertions.ts
- `checkToolUsedAny` — filters trace for any matching tool from list, case-insensitive
- `checkToolNoErrors` — vacuous pass if tool absent; counts isError entries otherwise
- `checkToolPreference` — vacuous pass if neither group used; compares counts of preferred vs over
- All 9 cases wired into exhaustive `checkOne` switch (never check compiles)

### Task 3: Loader validation updated in loader.ts
- `KNOWN_ASSERTION_TYPES` expanded to 9 entries
- `validateAssertionShape` switch covers all 9 types with required field checks:
  - `tool_used_any`: requires `tools` (non-empty string array)
  - `tool_no_errors`: requires `tool` (string)
  - `tool_preference`: requires `preferred` and `over` (non-empty string arrays)
- Phase J placeholder comment removed

### Task 4: Tests for new assertion types (21 new tests)
- `assertions.test.ts`: 15 new tests
  - `tool_used_any`: 5 tests (single match, multiple match, no match, empty trace, case-insensitive)
  - `tool_no_errors`: 4 tests (no errors, vacuous pass, errors present, mixed with other tools)
  - `tool_preference`: 6 tests (preferred > over, over > preferred, vacuous, preferred only, over only, case-insensitive)
- `loader.test.ts`: 6 new tests
  - Shape validation: tool_used_any without/empty tools, tool_no_errors without tool, tool_preference without preferred, without over
  - Well-formed eval with all 9 assertion types loads successfully

### Task 5: 11 eval definitions (4 replaced + 7 new)
- **Replaced** (v1.1 versions with expanded prompts/assertions):
  - read-over-cat (2→4 prompts), read-before-edit, no-redundant-cd, edit-over-sed (3→4 assertions)
- **New evals:**
  - search-over-find (tool-routing, 4 prompts, uses `tool_used_any`)
  - grep-over-bash-grep (tool-routing, 3 prompts)
  - parallel-tool-calls (tool-discipline, 3 prompts)
  - edit-over-write (tool-routing, 2 prompts)
  - edit-accuracy (tool-discipline, 1 prompt, uses `tool_no_errors`)
  - graph-for-structure (tool-routing, 3 prompts, uses `tool_used_any` + `tool_preference`)
  - truncation-follow-up (context, 1 prompt — new category)

## Stats

| Metric | Value |
|--------|-------|
| Tests added | 21 (15 assertion + 6 loader) |
| Tests total | 67 |
| Files created | 8 (7 new eval YAMLs + J-01-PLAN.md) |
| Files modified | 9 (5 src + 4 existing eval YAMLs) |
| Lines added | ~1,245 |
| Lines removed | ~74 |
| Dependencies added | 0 |
| Protected files changed | 0 |
| Eval definitions | 11 (was 4) |
| Total prompts | 26 (was 8) |
| Categories | 3 (tool-routing, tool-discipline, context) |
| Assertion types | 9 (was 6) |

## Acceptance Criteria

- [x] AC-1: Three new assertion types defined in types.ts (9-member union)
- [x] AC-2: Three new checkers implemented in assertions.ts (exhaustive switch)
- [x] AC-3: Loader validates new assertion shapes (KNOWN_ASSERTION_TYPES + switch)
- [x] AC-4: New assertion types have comprehensive test coverage (15 tests)
- [x] AC-5: Loader tests cover new assertion shape validation (6 tests)
- [x] AC-6: All 11 eval definitions valid and loadable (26 prompts, 3 categories)
- [x] AC-7: Existing tests remain green (46 original + 21 new = 67 total)

## Decisions Made
- `tool_no_errors` vacuous pass when tool absent (no calls = no errors)
- `tool_preference` vacuous pass when neither group used (no data to compare)
- `tool_preference` is a soft signal — passes/fails like other assertions, no special display treatment
- graph-for-structure.yaml includes `cwd` field as informational metadata for runner
- Existing eval YAMLs replaced with v1.1 spec versions (more prompts, refined assertion patterns)
