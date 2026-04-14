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
Enable multi-model and multi-thinking-level runs via comma-separated values on `--model` and `--thinking`, loop over all combinations, produce a matrix-aware results file, and display a summary table showing pass rates per combination.

## Purpose
This is the core matrix capability — run the same evals across different models and thinking levels in a single invocation, making it easy to compare agent behavior across configurations.

## Output
- `/eval-run all --model claude-sonnet-4,claude-haiku-3.5` runs evals for both models
- `/eval-run all --thinking low,high` runs evals at both thinking levels
- `/eval-run all --model a,b --thinking low,high` runs 4 combinations (a/low, a/high, b/low, b/high)
- Results file contains all combinations with per-combination totals
- Summary table printed after run showing pass rates per model/thinking
- `--baseline` saves matrix results as baseline
- Single model/thinking still works (backward compat with Phase F)
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
- DOCS(200): README.md drift noted (flags not yet documented — deferred to end of milestone)
- RUBY(250): index.ts at 332 lines, approaching threshold — monitor
</module_dispatch>

<acceptance_criteria>

## AC-1: Multi-model parsing
```gherkin
Given the user runs /eval-run all --model claude-sonnet-4,claude-haiku-3.5
When the command parses arguments
Then models is set to ["claude-sonnet-4", "claude-haiku-3.5"]
And evals run for each model separately
```

## AC-2: Multi-thinking parsing
```gherkin
Given the user runs /eval-run all --thinking low,high
When the command parses arguments
Then thinkingLevels is set to ["low", "high"]
And evals run at each thinking level separately
```

## AC-3: Combination matrix
```gherkin
Given the user runs /eval-run all --model a,b --thinking low,high
When the command executes
Then 4 combinations run: a/low, a/high, b/low, b/high
And each combination runs all selected evals
```

## AC-4: Matrix results format
```gherkin
Given a matrix run completes
When the results file is written
Then it contains a top-level `combinations` array
And each entry has model, thinking, evals[], and totals
And a top-level `totals` aggregates across all combinations
```

## AC-5: Summary table output
```gherkin
Given a matrix run completes
When results are displayed
Then a summary table shows pass rates per combination
With columns: Model, Thinking, Passed, Failed, Total, Rate
```

## AC-6: Single value backward compat
```gherkin
Given the user runs /eval-run all --model claude-sonnet-4
When the command executes
Then it runs as a single-combination matrix (1 entry in combinations array)
And output is functionally equivalent to Phase F behavior
```

## AC-7: No flags backward compat
```gherkin
Given the user runs /eval-run all (no model/thinking flags)
When the command executes
Then it runs as a single combination with current session defaults
And results format uses the new matrix structure (1 combination entry)
```

## AC-8: Build succeeds
```gherkin
Given all changes are made
When pnpm run build is executed
Then TypeScript compiles with zero errors
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Define matrix result types</name>
  <files>src/runner/types.ts</files>
  <action>
    Add new types for matrix-aware results. Keep existing types intact for compatibility.

    1. Add `CombinationResult` interface:
       ```typescript
       /** Results for a single model/thinking combination. */
       export interface CombinationResult {
         /** Model used for this combination (or "default" if not specified). */
         model: string;
         /** Thinking level used (or "default" if not specified). */
         thinking: string;
         /** Individual eval prompt results for this combination. */
         evals: EvalRunResult[];
         /** Aggregate counts for this combination. */
         totals: {
           total: number;
           passed: number;
           failed: number;
           errored: number;
         };
       }
       ```

    2. Add `MatrixRunSummary` interface:
       ```typescript
       /** Aggregated results from a matrix eval run (one or more combinations). */
       export interface MatrixRunSummary {
         /** ISO timestamp when the run started. */
         timestamp: string;
         /** All model/thinking combinations that were run. */
         combinations: CombinationResult[];
         /** Aggregate totals across all combinations. */
         totals: {
           total: number;
           passed: number;
           failed: number;
           errored: number;
         };
       }
       ```

    3. Keep existing `RunSummary` interface unchanged (it's still valid for single-model results and the v0.1 baseline).

    4. Export both new types.
  </action>
  <verify>pnpm run build — zero errors. grep 'CombinationResult\|MatrixRunSummary' dist/src/runner/types.d.ts — both exported.</verify>
  <done>AC-4 partial, AC-8 partial: new types compile and export.</done>
</task>

<task type="auto">
  <name>Task 2: Multi-value parsing, combination loop, summary table, and matrix results</name>
  <files>index.ts</files>
  <action>
    Update the `/eval-run` command handler for matrix execution:

    1. **Multi-value parsing:** Change `modelFlag` and `thinkingFlag` from single strings to arrays:
       - Split on comma: `--model a,b` → `["a", "b"]`
       - Single value still works: `--model a` → `["a"]`
       - No flag → `[undefined]` (signals "use default")

    2. **Validation:** Validate each model and each thinking level individually (reuse existing validation logic from Phase F, but loop over the array).

    3. **Combination generation:** Build the matrix:
       ```typescript
       const combinations: Array<{model: string | undefined, thinking: string | undefined}> = [];
       for (const m of models) {
         for (const t of thinkingLevels) {
           combinations.push({ model: m, thinking: t });
         }
       }
       ```

    4. **Combination loop:** Replace the existing single eval loop with:
       ```typescript
       const combinationResults: CombinationResult[] = [];
       for (const combo of combinations) {
         const comboOptions = {
           ...options,
           model: combo.model ?? ctx.model?.name ?? "unknown",
           modelFlag: combo.model,
           thinkingFlag: combo.thinking,
         };

         ctx.ui.notify(`\n── ${combo.model ?? "default"} / ${combo.thinking ?? "default"} ──`, "info");

         const results: EvalRunResult[] = [];
         for (const evalDef of evalDefs) {
           for (let promptIdx = 0; promptIdx < evalDef.prompts.length; promptIdx++) {
             const result = await runSingleEval(evalDef, promptIdx, evalDef.prompts[promptIdx], comboOptions);
             results.push(result);
           }
         }

         combinationResults.push({
           model: combo.model ?? ctx.model?.name ?? "default",
           thinking: combo.thinking ?? "default",
           evals: results,
           totals: {
             total: results.length,
             passed: results.filter(r => r.passed).length,
             failed: results.filter(r => !r.passed && !r.error).length,
             errored: results.filter(r => !!r.error).length,
           },
         });
       }
       ```

    5. **Build MatrixRunSummary:** Aggregate across all combinations:
       ```typescript
       const allEvals = combinationResults.flatMap(c => c.evals);
       const matrixSummary: MatrixRunSummary = {
         timestamp: new Date().toISOString(),
         combinations: combinationResults,
         totals: {
           total: allEvals.length,
           passed: allEvals.filter(r => r.passed).length,
           failed: allEvals.filter(r => !r.passed && !r.error).length,
           errored: allEvals.filter(r => !!r.error).length,
         },
       };
       ```

    6. **Write results:** Write `matrixSummary` instead of `summary`. Same file naming (timestamped + optional baseline).

    7. **Summary table:** After the per-result output, append a summary table:
       ```
       ═══ SUMMARY TABLE ═══

       | Model          | Thinking | Passed | Failed | Total | Rate  |
       |----------------|----------|--------|--------|-------|-------|
       | claude-sonnet-4 | default  | 8      | 0      | 8     | 100%  |
       | claude-haiku-3.5| default  | 6      | 2      | 8     | 75%   |
       ```
       Only show the table when there are 2+ combinations (for single combination, the existing per-result output suffices).

    8. **Import new types:** Add `CombinationResult` and `MatrixRunSummary` to the import from `./src/runner/types.js`. Remove `RunSummary` import if no longer used.

    9. **Update notification count:** Show total combinations in the "Running N eval(s)..." message:
       `Running N eval(s) × M combination(s)...`

    Do NOT modify cmux-runner.ts — it already handles modelFlag/thinkingFlag from Phase F.
  </action>
  <verify>
    pnpm run build — zero errors.
    grep 'CombinationResult\|MatrixRunSummary\|combinations\|SUMMARY TABLE' dist/index.js — confirm matrix handling present.
    grep 'RunSummary' dist/index.js — should NOT appear (replaced by MatrixRunSummary).
  </verify>
  <done>AC-1 through AC-8 satisfied: multi-value parsing, combination loop, matrix results, summary table, backward compat, build clean.</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (trace/assertion types — stable)
- src/tracer.ts (tracer — stable)
- src/assertions.ts (assertion engine — stable)
- src/loader.ts (YAML loader — stable)
- src/runner/cmux-runner.ts (runner — Phase F complete, handles modelFlag/thinkingFlag)
- evals/*.yaml (eval definitions — stable)
- results/baseline.json (v0.1 baseline — do not overwrite)

## SCOPE LIMITS
- No --project-dir flag (Phase H)
- No historical comparison (/eval-compare — future milestone)
- No CI integration (future milestone)
- Keep existing RunSummary type (don't delete — v0.1 baseline uses it)

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with zero errors
- [ ] `--model a,b` parses into two models
- [ ] `--thinking low,high` parses into two thinking levels
- [ ] Combination loop generates correct number of runs
- [ ] `MatrixRunSummary` with `combinations` array used for results
- [ ] Summary table displayed for 2+ combinations
- [ ] Single model/thinking still works (1-element combination)
- [ ] No flags = single default combination
- [ ] `--baseline` writes matrix results
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
