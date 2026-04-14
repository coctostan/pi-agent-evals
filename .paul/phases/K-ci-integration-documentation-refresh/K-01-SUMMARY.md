# Phase K-01 Summary: Documentation Refresh & New Baseline

**Phase:** K-ci-integration-documentation-refresh
**Plan:** 01
**Status:** COMPLETE (Task 1 applied; Task 2 deferred to user)
**PR:** https://github.com/coctostan/pi-agent-evals/pull/11

## What Was Delivered

### Task 1: README Refresh ✅
- **Commands table**: Added `/eval-compare` with description
- **Comparing results section**: New section with usage examples and output description
- **YAML example**: Updated to current v1.1 `read-over-cat.yaml` (4 prompts, no `pass_threshold`/`completed`)
- **Shipped evals table**: Expanded from 4 to 11 evals across 3 categories
- **Assertion Types table**: Expanded from 6 to 9 types (added `tool_used_any`, `tool_no_errors`, `tool_preference`)
- **Results Format**: Added `thinking` field, updated totals to 26 prompts
- **Roadmap**: Replaced stale items with current v0.3 status + future items
- **Adding New Evals**: Added `timeout` to optional fields

### Task 2: New Baseline — DEFERRED
Requires manual execution: `/eval-run all --baseline` in a cmux pi session.
Old baseline (4 evals, 8 prompts) remains functional until replaced.

## Stats

| Metric | Value |
|--------|-------|
| Files modified | 1 (README.md) |
| Lines added | ~295 |
| Lines removed | ~36 |
| Source files changed | 0 |
| Dependencies added | 0 |
| Tests affected | 0 (67 still pass) |

## Acceptance Criteria

- [x] AC-1: README documents all 11 evals (table with 11 rows, 3 categories)
- [x] AC-2: README documents all 9 assertion types
- [x] AC-3: README documents /eval-compare (Commands table + usage section)
- [x] AC-4: README roadmap updated (shipped items checked, future items listed)
- [ ] AC-5: New baseline with 11 evals (deferred — manual step)
- [x] AC-6: No source code changes

## Decisions Made
- CI workflow dropped from Phase K scope (low value for single-developer project)
- Baseline run deferred as manual post-merge step (requires live cmux + pi session)
- Phase can unify with Task 1 alone — baseline is additive, not blocking
