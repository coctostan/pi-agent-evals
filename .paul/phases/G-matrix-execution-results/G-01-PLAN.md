---
phase: G-matrix-execution-results
plan: 01
type: execute
wave: 1
depends_on: [F-01]
files_modified: [src/runner/types.ts, index.ts]
autonomous: true
---

<objective>
## Goal
Add `thinking` field to results metadata and implement `/eval-compare` command that reads two result files and displays a side-by-side comparison table with per-eval pass/fail deltas and summary totals.

## Purpose
The `--model` and `--thinking` flags from Phase F are only useful for decisions if you can compare results across runs. `/eval-compare` closes that loop — run evals with model A, run again with model B, compare.

## Output
- `RunSummary` gains a `thinking` field capturing the thinking level used
- `/eval-compare <file1> <file2>` prints a side-by-side table showing per-eval differences
- `/eval-compare <file> --baseline` compares against `results/baseline.json`
- Clear delta indicators: `=` (same), `▲` (improved), `▼` (regressed)
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/F-model-thinking-discovery/F-01-SUMMARY.md

## Source Files
index.ts
src/runner/types.ts
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): 0 vulnerabilities — PASS
- SETH(80): No secrets — PASS

[dispatch] pre-plan advisory:
- ARCH(75): Flat src/ with runner/ subdir — PASS
- TODD(100): No test files (baseline 0) — skip
- IRIS(150): No anti-patterns — PASS
- DOCS(200): README.md drift noted (new commands not yet documented — deferred to end of milestone)
- RUBY(250): index.ts at 332 lines, will grow — monitor
</module_dispatch>

<acceptance_criteria>

## AC-1: Thinking field in results
```gherkin
Given the user runs /eval-run all --thinking high
When results are written to JSON
Then the RunSummary object contains a "thinking" field set to "high"
```

## AC-2: Default thinking in results
```gherkin
Given the user runs /eval-run all (no --thinking flag)
When results are written to JSON
Then the RunSummary object contains a "thinking" field set to "default"
```

## AC-3: Compare two files
```gherkin
Given two result files exist at results/file1.json and results/file2.json
When the user runs /eval-compare results/file1.json results/file2.json
Then a side-by-side table shows per-eval pass/fail for each file
And delta indicators show = (same), ▲ (improved), ▼ (regressed)
And a summary line shows totals and pass rates for each file
```

## AC-4: Compare against baseline
```gherkin
Given results/baseline.json exists and results/latest.json exists
When the user runs /eval-compare results/latest.json --baseline
Then it compares against results/baseline.json
And displays the same side-by-side table as AC-3
```

## AC-5: Missing file error
```gherkin
Given one of the specified result files does not exist
When the user runs /eval-compare
Then it notifies with error: "File not found: <path>"
And does not crash
```

## AC-6: Format mismatch handling
```gherkin
Given a result file has a different set of evals than the comparison file
When the user runs /eval-compare
Then missing evals show as "—" in the table (not an error)
And the summary still computes correctly for evals that exist in each file
```

## AC-7: Build succeeds
```gherkin
Given all changes are made
When pnpm run build is executed
Then TypeScript compiles with zero errors
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Add thinking field to RunSummary</name>
  <files>src/runner/types.ts, index.ts</files>
  <action>
    1. In `src/runner/types.ts`, add a `thinking` field to the `RunSummary` interface:
       ```typescript
       /** Thinking level used (from --thinking flag or "default"). */
       thinking: string;
       ```
       Place it after the `model` field.

    2. In `index.ts`, set the `thinking` field when building the `RunSummary` object (in the "Build summary" section, ~line 272):
       ```typescript
       thinking: options.thinkingFlag ?? "default",
       ```

    3. Verify the build compiles clean.
  </action>
  <verify>pnpm run build — zero errors. grep 'thinking' dist/src/runner/types.d.ts — field present in RunSummary.</verify>
  <done>AC-1, AC-2 satisfied: thinking field present in results with correct value. AC-7 partial: build clean.</done>
</task>

<task type="auto">
  <name>Task 2: Implement /eval-compare command</name>
  <files>index.ts</files>
  <action>
    Register a new `/eval-compare` command in the extension function, after the existing `/eval-run` registration.

    1. **Command registration:**
       ```typescript
       pi.registerCommand("eval-compare", {
         description: "Compare two eval result files: /eval-compare <file1> <file2|--baseline>",
         handler: async (args, ctx) => { ... },
       });
       ```

    2. **Arg parsing:**
       - Split args into parts
       - If `--baseline` is present: file2 = `join(ctx.cwd, "results", "baseline.json")`
       - Otherwise: file1 = parts[0], file2 = parts[1]
       - Both paths should be resolved relative to ctx.cwd if not absolute

    3. **File loading:**
       - Read and parse both JSON files
       - Type them as `RunSummary`
       - If file doesn't exist: `ctx.ui.notify("File not found: <path>", "error")` and return
       - If JSON parse fails: `ctx.ui.notify("Invalid JSON: <path>", "error")` and return
       - Import `readFileSync, existsSync` (already imported)

    4. **Build comparison map:**
       - For each file, build a Map keyed by `${evalName}[${promptIndex}]` → `{ passed: boolean, error?: string }`
       - Collect all unique keys across both files (union)

    5. **Render comparison table:**
       ```
       ═══ EVAL COMPARISON ═══

       File 1: {model} / {thinking}  ({timestamp date only})
       File 2: {model} / {thinking}  ({timestamp date only})

       | Eval                  | Prompt | File 1 | File 2 | Delta |
       |-----------------------|--------|--------|--------|-------|
       | read-over-cat         | 0      | PASS   | PASS   |   =   |
       | read-over-cat         | 1      | PASS   | FAIL   |   ▼   |
       | edit-over-sed         | 0      | FAIL   | PASS   |   ▲   |
       | new-eval              | 0      | —      | PASS   |   +   |

       Summary:
         File 1: 6/8 passed (75%)
         File 2: 7/9 passed (78%)
       ```

       Delta logic:
       - Both PASS → `=`
       - File 1 FAIL, File 2 PASS → `▲` (improved)
       - File 1 PASS, File 2 FAIL → `▼` (regressed)
       - Both FAIL → `=`
       - Only in File 1 → `−` (removed)
       - Only in File 2 → `+` (added)
       - ERROR in either → show `ERR` instead of PASS/FAIL

    6. **Formatting:** Use padded plain text (not markdown) for reliable terminal rendering. Pad eval names to the longest name, right-align numbers.

    7. **Usage text:**
       ```
       Usage: /eval-compare <file1> <file2>
              /eval-compare <file> --baseline

       Examples:
         /eval-compare results/2026-04-13-103000.json results/2026-04-13-104500.json
         /eval-compare results/2026-04-13-103000.json --baseline
       ```

    8. **Import resolve from node:path** (already imported) for resolving relative paths.
  </action>
  <verify>
    pnpm run build — zero errors.
    grep 'eval-compare' dist/index.js — confirm command registered.
    grep 'EVAL COMPARISON\|Delta\|baseline' dist/index.js — confirm comparison logic present.
  </verify>
  <done>AC-3, AC-4, AC-5, AC-6, AC-7 satisfied: compare command works with two files, --baseline shortcut, missing file handling, format mismatch handling, build clean.</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (trace/assertion types — stable)
- src/tracer.ts (tracer — stable)
- src/assertions.ts (assertion engine — stable)
- src/loader.ts (YAML loader — stable)
- src/runner/cmux-runner.ts (runner — Phase F complete)
- evals/*.yaml (eval definitions — stable)
- results/baseline.json (v0.1 baseline — do not overwrite)

## SCOPE LIMITS
- No --project-dir flag (Phase H)
- No multi-model per run (user decision — one model, one thinking per run)
- No automatic re-run capability (user runs manually, compares after)
- Compare reads existing files only — does not trigger new eval runs

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with zero errors
- [ ] `RunSummary` has `thinking` field
- [ ] Results JSON includes `thinking` value
- [ ] `/eval-compare` command registered
- [ ] `/eval-compare file1 file2` produces side-by-side table
- [ ] `/eval-compare file --baseline` compares against baseline.json
- [ ] Missing file shows helpful error
- [ ] Mismatched evals show `—` (not crash)
- [ ] Delta indicators: = ▲ ▼ + −
- [ ] No changes to protected files
- All acceptance criteria met
</verification>

<success_criteria>
- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Build produces clean TypeScript output
- Backward compatibility preserved
</success_criteria>

<output>
After completion, create `.paul/phases/G-matrix-execution-results/G-01-SUMMARY.md`
</output>
