---
phase: I-test-foundation-validation
plan: 01
type: execute
wave: 1
depends_on: [H-01]
files_modified: [package.json, src/assertions.test.ts, src/loader.test.ts, src/loader.ts, index.ts]
autonomous: true
---

<objective>
## Goal
Add vitest test framework, comprehensive unit tests for the assertion engine and eval loader, harden YAML validation to check assertion shapes, enforce `pass_threshold` semantics, and wire per-eval `timeout` from YAML definitions to the runner.

## Purpose
Eight phases have shipped with zero automated test coverage. The assertion engine is the core correctness layer — if it silently mishandles a type or edge case, eval results are wrong. The loader does only shallow validation, accepting malformed assertions without complaint. `pass_threshold` is defined in every YAML but never enforced. Per-eval `timeout` is ignored in favor of a hardcoded 120s. Phase I resolves all of these before Phase J adds 3 new assertion types and 7 new evals.

## Output
- `src/assertions.test.ts` — unit tests covering all 6 assertion types with pass, fail, and edge cases
- `src/loader.test.ts` — unit tests for YAML loading, field validation, and deep assertion shape validation
- `src/loader.ts` — hardened with assertion shape validation
- `index.ts` — pass_threshold enforcement and per-eval timeout wiring
- `package.json` — vitest dev dependency and `test` script
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/B-assertions-eval-check/B-01-SUMMARY.md
.paul/phases/H-project-directory-support/H-01-SUMMARY.md

## Source Files
src/assertions.ts
src/loader.ts
src/types.ts
src/runner/types.ts
index.ts
package.json
evals/read-over-cat.yaml
evals/read-before-edit.yaml
evals/no-redundant-cd.yaml
evals/edit-over-sed.yaml
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): `pnpm audit --json` reports 0 vulnerabilities — PASS. Adding vitest (dev dependency) is low risk.
- SETH(80): No secrets in scope — test files and validation logic only — PASS
- ARCH(75): New files are test siblings (`*.test.ts` beside source). Loader validation stays in `src/loader.ts`. Runner behavior changes are confined to `index.ts` timeout/threshold logic. No architectural concerns.

[dispatch] pre-plan advisory:
- TODD(100): This phase IS the test foundation — vitest setup + tests for the two core modules. `tdd_candidates: assertions.ts, loader.ts`.
- IRIS(150): No TODO/FIXME/HACK/XXX markers in current source files — PASS
- RUBY(250): `index.ts` is 506 lines — threshold wiring and timeout changes are surgical (2 small edits), no extraction needed.
- DOCS(200): README does not need updating — internal quality improvement, no command surface changes.
- DAVE(200): No CI config yet (Phase K). vitest will run locally via `pnpm test`.
- GABE(175): No API files — skip
- LUKE(185): No UI files — skip
- ARIA(190): No UI files — skip
- DANA(195): No data/migration files — skip
- OMAR(205): No observability files — skip
- REED(210): No resilience files — skip
- VERA(215): No privacy files — skip
- PETE(225): vitest is fast, no performance risk — skip
</module_dispatch>

<acceptance_criteria>
## AC-1: vitest is installed and `pnpm test` runs
```gherkin
Given vitest is added as a devDependency
When `pnpm test` is executed
Then vitest discovers and runs all *.test.ts files
And the command exits with code 0 when all tests pass
```

## AC-2: All 6 assertion types have pass and fail test cases
```gherkin
Given src/assertions.test.ts exists
When the test suite runs
Then each assertion type (tool_used, tool_not_used, tool_before, tool_called_with, parallel_calls, completed) has:
  - At least one passing test case
  - At least one failing test case
  - Edge case coverage (empty trace, case-insensitive match, invalid regex for pattern types)
```

## AC-3: Eval loader tests cover valid, invalid, and edge cases
```gherkin
Given src/loader.test.ts exists
When the test suite runs
Then the loader is tested for:
  - Successful YAML parse of a valid eval file
  - Thrown error when file does not exist
  - Thrown error when required fields are missing
  - Thrown error when assertion shapes are invalid (wrong type discriminant, missing required fields)
  - listEvalDefinitions returns correct names
```

## AC-4: Loader validates assertion shapes
```gherkin
Given an eval YAML file with an assertion missing a required field (e.g., tool_used without tool)
When loadEvalDefinition is called
Then it throws a descriptive error identifying the malformed assertion
And well-formed YAML still loads successfully
```

## AC-5: pass_threshold is enforced in /eval-run results
```gherkin
Given an eval with pass_threshold: 0.5 and 4 prompts
When 2 of 4 prompts pass all assertions
Then the eval is reported as PASS (2/4 >= 0.5)
And when only 1 of 4 passes, it is reported as FAIL (1/4 < 0.5)
And when pass_threshold is omitted, 1.0 is used (all prompts must pass)
```

## AC-6: Per-eval timeout from YAML is wired to runner
```gherkin
Given an eval YAML with timeout: 60000
When the runner executes that eval
Then the runner uses 60000ms as the timeout for that eval
And when timeout is omitted, the default (120000ms) is used
```
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task 1: Add vitest and test infrastructure</name>
  <files>package.json</files>
  <action>
    Add vitest as a devDependency and wire up the test script:

    1. Run `pnpm add -D vitest` to install vitest
    2. Add `"test": "vitest run"` to the `scripts` section of package.json
    3. Add `"test:watch": "vitest"` for development convenience

    No vitest config file is needed — vitest auto-detects TypeScript via tsconfig.json and finds `*.test.ts` files by convention.

    Verify vitest runs (it will find zero tests initially and that's fine).
  </action>
  <verify>pnpm test 2>&1 | head -20</verify>
  <done>AC-1 satisfied: vitest installed, `pnpm test` script wired.</done>
</task>

<task type="auto">
  <name>Task 2: Unit tests for the assertion engine</name>
  <files>src/assertions.test.ts</files>
  <action>
    Create `src/assertions.test.ts` with comprehensive tests for `checkAssertions()`.

    Use a helper to build minimal `EvalTrace` objects:
    ```typescript
    function makeTrace(entries: Partial<ToolTraceEntry>[] = []): EvalTrace {
      return {
        sessionId: "test",
        model: "test-model",
        extensions: [],
        cwd: "/tmp/test",
        startedAt: new Date().toISOString(),
        entries: entries.map((e, i) => ({
          toolName: e.toolName ?? "Unknown",
          arguments: e.arguments ?? {},
          turnIndex: e.turnIndex ?? 0,
          callIndex: e.callIndex ?? i,
          timestamp: e.timestamp ?? Date.now(),
          isError: e.isError ?? false,
          parallelGroup: e.parallelGroup,
        })),
      };
    }
    ```

    **Test groups:**

    1. **tool_used** (3+ tests):
       - Pass: trace has matching tool entries
       - Fail: trace has no matching tool entries
       - Case-insensitive: "read" matches assertion for "Read"
       - Edge: empty trace → fail

    2. **tool_not_used** (5+ tests):
       - Pass: tool absent from trace
       - Fail: tool present, no argument_pattern
       - Pass: tool present but argument_pattern doesn't match
       - Fail: tool present and argument_pattern matches
       - Edge: invalid regex pattern → fail with descriptive detail
       - Case-insensitive: "bash" matches "Bash"

    3. **tool_before** (4+ tests):
       - Pass: first tool appears before then tool
       - Fail: then tool appears before first tool
       - Fail: first tool missing from trace
       - Fail: then tool missing from trace
       - Edge: same tool as first and then, indices checked correctly

    4. **tool_called_with** (4+ tests):
       - Pass: tool call exists with matching argument pattern
       - Fail: tool call exists but pattern doesn't match
       - Fail: no tool calls at all
       - Edge: invalid regex → fail with descriptive detail
       - Pattern matches against JSON.stringify(arguments)

    5. **parallel_calls** (3+ tests):
       - Pass: parallelGroup with enough entries
       - Fail: no groups meet min_parallel
       - Edge: entries without parallelGroup are skipped
       - Edge: empty trace → fail

    6. **completed** (3+ tests):
       - Pass: non-empty trace, zero errors
       - Fail: empty trace
       - Fail: non-empty trace with some isError entries
       - Verify detail string includes entry count and error count

    **General tests:**
    - `checkAssertions` returns results in same order as input assertions
    - Multiple assertions in one call all evaluated independently
  </action>
  <verify>pnpm test -- src/assertions.test.ts</verify>
  <done>AC-2 satisfied: all 6 assertion types have pass, fail, and edge case tests.</done>
</task>

<task type="auto">
  <name>Task 3: Harden loader validation and add loader tests</name>
  <files>src/loader.ts, src/loader.test.ts</files>
  <action>
    **Part A: Harden `src/loader.ts` with assertion shape validation**

    After the existing field-presence and array checks, add deep validation for each assertion object:

    ```typescript
    // Add after existing validation (line ~77)
    for (let i = 0; i < (obj.assertions as unknown[]).length; i++) {
      validateAssertionShape(obj.assertions[i], i, filePath);
    }
    ```

    Create a `validateAssertionShape(assertion, index, filePath)` function that:
    1. Checks assertion is an object with a `type` field (string)
    2. Checks `message` is present (string) — required for all types
    3. Switch on `type`:
       - `tool_used`: requires `tool` (string)
       - `tool_not_used`: requires `tool` (string); optional `argument_pattern` (string)
       - `tool_before`: requires `first` (string) and `then` (string)
       - `tool_called_with`: requires `tool` (string) and `argument_pattern` (string)
       - `parallel_calls`: requires `min_parallel` (number)
       - `completed`: no additional required fields
       - Unknown type: throw with available type list
    4. Throws descriptive error: `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "${field}"`

    This validation MUST remain forward-compatible — Phase J will add new types (`tool_used_any`, `tool_no_errors`, `tool_preference`). Add a comment noting that unknown types should warn rather than hard-fail once Phase J adds new types, but for now hard-fail is correct since only the 6 known types exist.

    **Part B: Create `src/loader.test.ts`**

    Use `node:fs` `mkdtempSync` + `writeFileSync` to create temporary YAML files for testing.

    Test groups:

    1. **Valid loading** (2+ tests):
       - Load a minimal valid eval YAML with all required fields
       - Verify returned object has correct name, description, category, prompts, assertions
       - Load a YAML with optional fields (setup, timeout, pass_threshold)

    2. **File errors** (2+ tests):
       - Missing file throws "not found" error
       - Invalid YAML syntax throws parse error

    3. **Field validation** (3+ tests):
       - Missing `name` → throws with "missing required fields: name"
       - Missing `prompts` → throws with "missing required fields: prompts"
       - `prompts` not an array → throws with "must be an array"
       - `assertions` not an array → throws with "must be an array"

    4. **Assertion shape validation** (5+ tests):
       - `tool_used` without `tool` → throws
       - `tool_not_used` without `tool` → throws
       - `tool_before` without `first` → throws
       - `tool_called_with` without `argument_pattern` → throws
       - `parallel_calls` without `min_parallel` → throws
       - Unknown type → throws with available types
       - `tool_used` with `tool` → passes validation
       - Well-formed eval with all assertion types → loads successfully

    5. **listEvalDefinitions** (2+ tests):
       - Returns sorted names for a directory with .yaml files
       - Returns empty array for non-existent directory

    Clean up temp directories in afterEach.
  </action>
  <verify>pnpm test -- src/loader.test.ts</verify>
  <done>AC-3 and AC-4 satisfied: loader validates assertion shapes, loader tests cover valid/invalid/edge cases.</done>
</task>

<task type="auto">
  <name>Task 4: Enforce pass_threshold and wire per-eval timeout</name>
  <files>index.ts</files>
  <action>
    **Part A: Wire per-eval timeout**

    In the `/eval-run` command handler, when building runner options (around line 262-273), replace the hardcoded `timeout: 120_000` with per-eval timeout resolution.

    The current code builds options once and reuses for all evals. Since timeout varies per eval, pass it per-eval instead. The cleanest approach:
    - Keep the options object as-is with `timeout: 120_000` as default
    - Before calling `runSingleEval`, override `options.timeout` with the eval's timeout:
      ```typescript
      const evalTimeout = evalDef.timeout ?? 120_000;
      const result = await runSingleEval(evalDef, promptIdx, evalDef.prompts[promptIdx], {
        ...options,
        timeout: evalTimeout,
      });
      ```

    **Part B: Enforce pass_threshold**

    After running all prompts for a single eval, evaluate whether enough prompts passed.

    Currently the code loops over all evalDefs and all prompts, pushing results flat into `allResults`. To enforce pass_threshold, restructure the per-eval loop:

    ```typescript
    for (const evalDef of evalDefs) {
      const evalResults: EvalRunResult[] = [];
      const evalTimeout = evalDef.timeout ?? 120_000;
      
      for (let promptIdx = 0; promptIdx < evalDef.prompts.length; promptIdx++) {
        const result = await runSingleEval(
          evalDef, promptIdx, evalDef.prompts[promptIdx],
          { ...options, timeout: evalTimeout },
        );
        evalResults.push(result);
      }

      // Apply pass_threshold
      const threshold = evalDef.pass_threshold ?? 1.0;
      const promptsPassed = evalResults.filter(r => r.passed).length;
      const passRate = evalResults.length > 0 ? promptsPassed / evalResults.length : 0;
      const evalPassed = passRate >= threshold;

      // If the eval passes via threshold but some prompts failed, mark as threshold-pass
      // This doesn't change individual prompt results — it affects the summary message
      allResults.push(...evalResults);
    }
    ```

    Update the results display to show per-eval threshold status. After the per-assertion detail lines for each eval, add a threshold summary line when threshold < 1.0:
    ```
    ✓ read-over-cat: 3/4 prompts passed (threshold: 0.75) — PASS
    ```

    The `summary.totals.passed` count should still reflect individual prompt pass counts (not threshold-level pass). This preserves backward compatibility with existing result files and `/eval-compare`.

    Do NOT change the RunSummary schema, EvalRunResult schema, or assertion engine behavior. The threshold is a display-layer concern applied after individual prompt results are computed.
  </action>
  <verify>pnpm run build && pnpm test</verify>
  <done>AC-5 and AC-6 satisfied: per-eval timeout used, pass_threshold enforced and displayed.</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- src/types.ts (assertion types remain stable — Phase J will add new types)
- src/tracer.ts (tracer logic is stable)
- src/runner/cmux-runner.ts (runner internals are stable — only `options.timeout` is already wired)
- src/runner/types.ts (runner types are stable)
- evals/*.yaml (existing eval definitions are not part of this phase)
- results/ (historical artifacts)

## SCOPE LIMITS
- No new assertion types (Phase J)
- No new eval definitions (Phase J)
- No new commands or command surface changes
- No CI/workflow setup (Phase K)
- No README changes (no user-visible behavior changes beyond threshold enforcement)
- Vitest is the only new dependency
- Loader validation must remain forward-compatible for Phase J's new assertion types
</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm install` succeeds (vitest added)
- [ ] `pnpm test` discovers and runs all test files
- [ ] `pnpm test -- src/assertions.test.ts` passes — all 6 assertion types tested
- [ ] `pnpm test -- src/loader.test.ts` passes — valid/invalid/shape validation tested
- [ ] `pnpm run build` succeeds with zero TypeScript errors
- [ ] Malformed assertion YAML (e.g., tool_used without tool) throws descriptive error from loader
- [ ] Valid existing eval YAMLs (all 4) still load without error
- [ ] index.ts respects evalDef.timeout when provided
- [ ] index.ts defaults to 120_000ms when timeout is omitted
- [ ] pass_threshold is evaluated per-eval after all prompts complete
- [ ] Results display shows threshold info when threshold < 1.0
- [ ] No changes to protected files (types.ts, tracer.ts, runner/*)
- [ ] All acceptance criteria met (AC-1 through AC-6)
</verification>

<success_criteria>
- All tests pass: `pnpm test` exits 0
- Build clean: `pnpm run build` exits 0 with zero errors
- 20+ test cases covering assertions and loader
- Loader rejects malformed assertion shapes with descriptive errors
- Existing 4 eval YAMLs continue to load successfully
- pass_threshold semantics work (default 1.0, fractional thresholds honored)
- Per-eval timeout wired from YAML to runner
- Phase A/B/C/D/E/F/G/H artifacts untouched
</success_criteria>

<output>
After completion, create `.paul/phases/I-test-foundation-validation/I-01-SUMMARY.md`
</output>
