---
phase: K-ci-integration-documentation-refresh
plan: 01
type: execute
wave: 1
depends_on: [J-01]
files_modified: [README.md, results/baseline.json]
autonomous: partial
---

<objective>
## Goal
Refresh the README to document all 11 evals, all 9 assertion types, and the `/eval-compare` command, then run a new baseline with all 11 evals to validate the Phase J expansion end-to-end.

## Purpose
The README still documents only 4 evals and 6 assertion types — it's stale since Phase J tripled the eval catalog and added 3 assertion types. The existing baseline covers only the old 4 evals (8 prompts). A new baseline with all 11 evals (26 prompts) proves the expanded suite works and provides the comparison anchor for future runs. Together, these close the v0.3 milestone.

## Output
- `README.md` — refreshed with all 11 evals, 9 assertion types, `/eval-compare` docs, updated roadmap
- `results/baseline.json` — new baseline from `/eval-run all --baseline` with 11 evals, 26 prompts
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/J-eval-expansion-assertion-types/J-01-SUMMARY.md
.paul/phases/I-test-foundation-validation/I-01-SUMMARY.md

## Source Files
README.md
evals/*.yaml
results/baseline.json
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): No new dependencies. PASS
- SETH(80): No secrets in scope — documentation and eval execution only. PASS
- ARCH(75): README is documentation. Baseline is a results artifact. No architectural concerns.

[dispatch] pre-plan advisory:
- DOCS(200): README refresh is a core task. All 11 evals, 9 assertion types, `/eval-compare` command, and updated roadmap must be documented. Stale references (4 evals, 6 types, roadmap items already shipped) must be corrected.
- TODD(100): No new source code — existing 67 tests remain the regression gate. PASS
- IRIS(150): README has stale roadmap items listing features already shipped (`--models`, `--thinking`, `/eval-compare`). These must be updated. PASS
- SKIP(160): Eval YAML files are not modified — only documented in README. PASS
- All other modules: no scope overlap — skip.
</module_dispatch>

<acceptance_criteria>
## AC-1: README documents all 11 evals
```gherkin
Given the README "Shipped evals" table is updated
When a user reads the table
Then all 11 evals are listed with name, category, and description
And the 3 categories (tool-routing, tool-discipline, context) are represented
And the example YAML snippet reflects the current v1.1 format
```

## AC-2: README documents all 9 assertion types
```gherkin
Given the README "Assertion Types" table is updated
When a user reads the table
Then all 9 assertion types are listed with type and description
Including: tool_used_any, tool_no_errors, tool_preference (Phase J additions)
```

## AC-3: README documents the /eval-compare command
```gherkin
Given the README Commands table and a new section are added
When a user reads the README
Then /eval-compare is listed in the Commands table
And a "Comparing results" section documents usage and output format
```

## AC-4: README roadmap section is updated
```gherkin
Given the README Roadmap section is refreshed
When a user reads it
Then shipped features are marked as done (model matrix, thinking levels, /eval-compare, eval expansion)
And only genuine future work remains
```

## AC-5: New baseline exists with 11 evals
```gherkin
Given the user runs /eval-run all --baseline in a cmux pi session
Then results/baseline.json is overwritten with a new run
And the baseline contains results for all 11 evals (26 prompts)
And the baseline model and thinking fields are populated
```

## AC-6: No source code changes
```gherkin
Given Phase K is docs + baseline only
When the phase is complete
Then no files under src/, index.ts, evals/, or package.json are modified
And pnpm test still passes 67 tests
```
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task 1: Refresh README.md</name>
  <files>README.md</files>
  <action>
    Rewrite README.md with accurate, current documentation.

    **Sections to update:**

    1. **Commands table** — add `/eval-compare` row:
       ```
       | `/eval-compare <file1> <file2\|--baseline>` | Compare two eval result files side-by-side |
       ```

    2. **Add "Comparing results" section** — after the "Foreign-project execution" section:
       ```markdown
       ### Comparing results

       `/eval-compare` renders a side-by-side diff of two result files with per-eval pass/fail deltas:

       ```
       /eval-compare results/run1.json results/run2.json
       /eval-compare results/run1.json --baseline
       ```

       Output includes model/thinking metadata, per-eval status columns (PASS/FAIL/ERR), and delta indicators (▲ improved, ▼ regressed, = unchanged).
       ```

    3. **Eval YAML example** — update the example YAML block to use the current `read-over-cat.yaml` content (v1.1 format — no `pass_threshold`, no `completed` assertion, 4 prompts, refined assertion patterns).

    4. **Shipped evals table** — replace the 4-row table with all 11:
       ```markdown
       | Eval | Category | What it tests |
       |------|----------|---------------|
       | `read-over-cat` | tool-routing | Uses Read instead of bash cat/head/tail |
       | `edit-over-sed` | tool-routing | Uses Edit instead of bash sed/awk/perl |
       | `search-over-find` | tool-routing | Uses Grep/find/ls instead of bash find |
       | `grep-over-bash-grep` | tool-routing | Uses Grep instead of bash grep/rg/ag |
       | `edit-over-write` | tool-routing | Uses Edit for changes, not Write for overwrites |
       | `graph-for-structure` | tool-routing | Uses codegraph tools for structural code questions |
       | `read-before-edit` | tool-discipline | Reads a file before editing it |
       | `no-redundant-cd` | tool-discipline | Doesn't use cd && or cd ; patterns in bash |
       | `parallel-tool-calls` | tool-discipline | Parallelizes independent reads/searches |
       | `edit-accuracy` | tool-discipline | Edit calls succeed without errors; reads before edits |
       | `truncation-follow-up` | context | Follows up with offset after truncated read |
       ```

    5. **Assertion Types table** — expand from 6 to 9 rows, adding:
       ```markdown
       | `tool_used_any` | At least one of the listed tools was called |
       | `tool_no_errors` | A specific tool had no error results (vacuous pass if not called) |
       | `tool_preference` | Preferred tools were used more than alternative tools (soft signal) |
       ```

    6. **Results Format** — update the example JSON:
       - Add `"thinking": "default"` field
       - Update totals to `"total": 26` (reflecting 11 evals)

    7. **Roadmap section** — replace stale items with current status:
       ```markdown
       ## Roadmap

       **v0.3 (current):**
       - [x] Test framework + 67 unit tests (Phase I)
       - [x] 3 new assertion types: `tool_used_any`, `tool_no_errors`, `tool_preference` (Phase J)
       - [x] 11 eval definitions across 3 categories (Phase J)
       - [x] Documentation refresh (Phase K)

       **Future:**
       - Per-tool-description evals (v2)
       - Custom eval authoring documentation
       - Regression trend tracking across runs
       ```

    8. **Adding New Evals** — add `timeout` to the optional fields list.
  </action>
  <verify>grep -c "tool_used_any\|tool_no_errors\|tool_preference" README.md && grep -c "eval-compare" README.md && grep -c "graph-for-structure\|truncation-follow-up" README.md</verify>
  <done>AC-1, AC-2, AC-3, AC-4 satisfied: README documents all 11 evals, 9 assertion types, /eval-compare, and updated roadmap.</done>
</task>

<task type="manual">
  <name>Task 2: Run new baseline with 11 evals</name>
  <files>results/baseline.json</files>
  <action>
    This task requires manual execution in a live cmux pi session.

    **Steps:**
    1. Open a cmux session
    2. Start pi in the pi-agent-evals project directory
    3. Run: `/eval-run all --baseline`
    4. Wait for all 11 evals (26 prompts) to complete
    5. Verify `results/baseline.json` was written with the new results

    **Expected outcome:**
    - `results/baseline.json` contains results for all 11 evals
    - The `totals` field shows `total: 26`
    - The `model` and `thinking` fields are populated
    - Most prompts pass (some may fail — that's the baseline)

    **Verification:**
    ```bash
    node -e "
      const d = require('./results/baseline.json');
      console.log('Model:', d.model);
      console.log('Thinking:', d.thinking);
      console.log('Evals:', [...new Set(d.evals.map(e => e.evalName))].length);
      console.log('Prompts:', d.totals.total);
      console.log('Passed:', d.totals.passed);
    "
    ```

    If the user opts to skip the baseline run, Phase K can still be unified with just the README refresh — the old baseline remains functional (it covers the original 4 evals).
  </action>
  <verify>test -f results/baseline.json && node -e "const d=require('./results/baseline.json'); console.log(d.totals.total, 'prompts');"</verify>
  <done>AC-5 satisfied: baseline.json updated with 11 evals, 26 prompts.</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- src/ (all source files are stable)
- index.ts (extension entry point is stable)
- evals/*.yaml (eval definitions are stable from Phase J)
- package.json (no new scripts or dependencies)
- tsconfig.json (build config is stable)

## SCOPE LIMITS
- No source code changes
- No new test files
- No CI workflow (deferred — low value for single-developer extension project)
- No new dependencies
- Baseline run is manual (requires live cmux + pi session)
- Task 2 is skippable — phase can unify with Task 1 alone if needed
</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm test` runs all 67 tests and exits 0
- [ ] README "Shipped evals" table lists all 11 evals
- [ ] README "Assertion Types" table lists all 9 types
- [ ] README has /eval-compare in Commands table
- [ ] README has "Comparing results" section with usage examples
- [ ] README Roadmap section reflects current status
- [ ] No source file changes (src/, index.ts, evals/, package.json)
- [ ] results/baseline.json updated with 11 evals (or deferred with note)
- [ ] All acceptance criteria met (AC-1 through AC-6)
</verification>

<success_criteria>
- README documents: 11 evals, 9 assertion types, /eval-compare, updated roadmap
- All 67 tests pass: `pnpm test` exits 0
- No source code changes
- Baseline updated with 11 evals (or explicitly deferred)
- Milestone v0.3 deliverables complete
</success_criteria>

<output>
After completion, create `.paul/phases/K-ci-integration-documentation-refresh/K-01-SUMMARY.md`
</output>
