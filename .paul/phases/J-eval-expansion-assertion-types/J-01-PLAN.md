---
phase: J-eval-expansion-assertion-types
plan: 01
type: execute
wave: 1
depends_on: [I-01]
files_modified: [src/types.ts, src/assertions.ts, src/loader.ts, src/assertions.test.ts, src/loader.test.ts, evals/read-over-cat.yaml, evals/read-before-edit.yaml, evals/no-redundant-cd.yaml, evals/edit-over-sed.yaml, evals/search-over-find.yaml, evals/grep-over-bash-grep.yaml, evals/parallel-tool-calls.yaml, evals/edit-over-write.yaml, evals/edit-accuracy.yaml, evals/graph-for-structure.yaml, evals/truncation-follow-up.yaml]
autonomous: true
---

<objective>
## Goal
Add 3 new assertion types (`tool_used_any`, `tool_no_errors`, `tool_preference`), replace the existing 4 eval definitions with expanded versions from the v1.1 spec, add 7 new eval definitions (4 → 11 total), introduce a `context` category, and extend all test suites and loader validation for the new types.

## Purpose
The current eval suite covers only 4 scenarios across 2 categories (tool-routing, tool-discipline). The assertion engine only supports 6 types, which cannot express "any of these tools" or "no errors for a specific tool" or "prefer X over Y". These gaps prevent evals that measure codegraph tool usage, edit accuracy, and search tool routing — critical agent behaviors. Phase J closes these gaps before Phase K adds CI gating.

## Output
- `src/types.ts` — 3 new assertion type interfaces added to the `Assertion` discriminated union
- `src/assertions.ts` — 3 new checker functions wired into `checkOne`
- `src/loader.ts` — `KNOWN_ASSERTION_TYPES` and `validateAssertionShape` updated for new types
- `src/assertions.test.ts` — new test groups for all 3 new assertion types
- `src/loader.test.ts` — new tests for validation of new assertion shapes
- `evals/*.yaml` — 4 existing evals replaced with expanded versions, 7 new eval files (11 total)
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/I-test-foundation-validation/I-01-SUMMARY.md
.paul/phases/B-assertions-eval-check/B-01-SUMMARY.md

## Source Files
src/types.ts
src/assertions.ts
src/loader.ts
src/assertions.test.ts
src/loader.test.ts
index.ts
evals/read-over-cat.yaml
evals/read-before-edit.yaml
evals/no-redundant-cd.yaml
evals/edit-over-sed.yaml

## Design Source
~/pi/workspace/thinkingSpace/plans/eval-definitions-v1.1.md
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): No new runtime dependencies — assertion types are pure TypeScript logic. YAML files are data-only. PASS
- SETH(80): No secrets in scope — assertion logic and eval YAML definitions only. PASS
- ARCH(75): New assertion types extend the existing discriminated union in types.ts, checker pattern in assertions.ts, and validation switch in loader.ts. The architecture is designed for exactly this extension. No structural concerns.

[dispatch] pre-plan advisory:
- TODD(100): Phase I established comprehensive test patterns. New assertion types MUST follow the same pass/fail/edge coverage pattern. `tdd_candidates: tool_used_any, tool_no_errors, tool_preference checkers`.
- CARL(125): assertions.ts uses an exhaustive `never` check in `checkOne()` — adding new types to the union without updating the switch will produce a compile error. This is the desired safety net.
- IRIS(150): loader.ts line 106 has `// NOTE: Phase J will add tool_used_any, tool_no_errors, tool_preference` — this comment guided the placeholder and should be removed when the types are added. PASS
- RUBY(250): assertions.ts is 302 lines with 8 functions. Adding 3 more checkers (~100 lines) keeps it under 410 — no extraction needed.
- WALT(155): assertions.test.ts is 390 lines. Adding ~90 lines for 3 new test groups brings it to ~480 — acceptable for a single test file with clear describe blocks.
- DOCS(200): README does not need updating — no command surface changes, just internal capability expansion.
- SKIP(160): Eval YAML files in v1.1 spec differ from existing files. Task 5 replaces existing 4 files with v1.1 versions (more prompts, refined assertions) and creates 7 new files. All 11 must pass `loadEvalDefinition` validation.
- DAVE(200): No CI config yet (Phase K) — skip.
- GABE(175): No API files — skip.
- LUKE(185): No UI files — skip.
- ARIA(190): No UI files — skip.
- DANA(195): No data/migration files — skip.
- OMAR(205): No observability files — skip.
- REED(210): No resilience files — skip.
- VERA(215): No privacy files — skip.
- PETE(225): 3 new assertion checkers are O(n) over trace entries, same as existing checkers. No performance risk.
</module_dispatch>

<acceptance_criteria>
## AC-1: Three new assertion types are defined in types.ts
```gherkin
Given src/types.ts defines the Assertion discriminated union
When tool_used_any, tool_no_errors, and tool_preference interfaces are added
Then the Assertion union includes all 9 types
And each new interface has the correct required fields:
  - tool_used_any: tools (string[]), message (string)
  - tool_no_errors: tool (string), message (string)
  - tool_preference: preferred (string[]), over (string[]), message (string)
And the TypeScript build succeeds with zero errors
```

## AC-2: Three new assertion checkers are implemented in assertions.ts
```gherkin
Given src/assertions.ts implements checkOne() with an exhaustive switch
When tool_used_any, tool_no_errors, and tool_preference cases are added
Then:
  - tool_used_any passes if ANY tool in the tools array was called at least once
  - tool_no_errors passes if no call to the specified tool has isError: true (passes vacuously if tool not called)
  - tool_preference passes if preferred tools were used more than over tools (soft: passes vacuously if neither used)
And the exhaustive never check still compiles
```

## AC-3: Loader validates new assertion shapes
```gherkin
Given src/loader.ts validates assertion shapes via validateAssertionShape()
When KNOWN_ASSERTION_TYPES is updated to include the 3 new types
And the validation switch adds cases for new types
Then:
  - tool_used_any without tools array → throws descriptive error
  - tool_no_errors without tool → throws descriptive error
  - tool_preference without preferred → throws descriptive error
  - tool_preference without over → throws descriptive error
  - Well-formed new-type assertions load successfully
  - The Phase J placeholder comment is removed
```

## AC-4: New assertion types have comprehensive test coverage
```gherkin
Given src/assertions.test.ts tests all assertion types
When new describe blocks are added for tool_used_any, tool_no_errors, tool_preference
Then each new type has:
  - At least one passing test case
  - At least one failing test case
  - Edge case coverage (empty trace, case-insensitive matching where applicable)
And all existing 28 assertion tests still pass
```

## AC-5: Loader tests cover new assertion shape validation
```gherkin
Given src/loader.test.ts tests assertion shape validation
When new test cases are added for tool_used_any, tool_no_errors, tool_preference
Then:
  - Each new type has a "throws when required field missing" test
  - A well-formed eval with new types loads successfully
  - The unknown type test still reports available types including new ones
And all existing 18 loader tests still pass
```

## AC-6: All 11 eval definitions are valid and loadable
```gherkin
Given 4 existing evals are replaced with v1.1 versions and 7 new evals are added
When loadEvalDefinition is called for each of the 11 evals
Then all 11 load without errors
And the evals cover 3 categories: tool-routing, tool-discipline, context
And the total prompt count across all evals is >= 25
```

## AC-7: Existing tests remain green
```gherkin
Given 46 existing tests pass before Phase J changes
When all Phase J changes are applied
Then pnpm test passes with zero failures
And pnpm run build succeeds with zero TypeScript errors
```
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task 1: Add 3 new assertion type interfaces to types.ts</name>
  <files>src/types.ts</files>
  <action>
    Add 3 new assertion interfaces and expand the `Assertion` union:

    1. **`ToolUsedAnyAssertion`** — passes if ANY of the listed tools was called at least once:
       ```typescript
       /** Assert that at least one of the listed tools was used. */
       export interface ToolUsedAnyAssertion {
         type: "tool_used_any";
         /** Tool names — at least one must appear in the trace. */
         tools: string[];
         /** Human-readable failure message. */
         message: string;
       }
       ```

    2. **`ToolNoErrorsAssertion`** — passes if no call to the given tool returned isError:
       ```typescript
       /** Assert that a specific tool had no error results. */
       export interface ToolNoErrorsAssertion {
         type: "tool_no_errors";
         /** Tool name to check for errors. */
         tool: string;
         /** Human-readable failure message. */
         message: string;
       }
       ```

    3. **`ToolPreferenceAssertion`** — soft signal that preferred tools should be used more than alternatives:
       ```typescript
       /** Assert that preferred tools were used more than alternative tools. Soft signal. */
       export interface ToolPreferenceAssertion {
         type: "tool_preference";
         /** Tools that should be preferred. */
         preferred: string[];
         /** Tools that should be avoided in favor of preferred. */
         over: string[];
         /** Human-readable failure message. */
         message: string;
       }
       ```

    4. Update the `Assertion` union to include all 9 types:
       ```typescript
       export type Assertion =
         | ToolUsedAssertion
         | ToolNotUsedAssertion
         | ToolBeforeAssertion
         | ToolCalledWithAssertion
         | ParallelCallsAssertion
         | CompletedAssertion
         | ToolUsedAnyAssertion
         | ToolNoErrorsAssertion
         | ToolPreferenceAssertion;
       ```

    Do NOT change any existing interfaces. Only add the 3 new ones and expand the union.

    After this task, `pnpm run build` will fail because assertions.ts has an exhaustive `never` check on the Assertion type — that's expected and will be fixed in Task 2.
  </action>
  <verify>grep -c "type:" src/types.ts | head -5</verify>
  <done>AC-1 satisfied: 3 new assertion type interfaces defined, Assertion union expanded to 9 types.</done>
</task>

<task type="auto">
  <name>Task 2: Implement 3 new assertion checkers in assertions.ts</name>
  <files>src/assertions.ts</files>
  <action>
    Add 3 new checker functions and wire them into the `checkOne` switch:

    1. **Update imports** — the new assertion types are already part of the `Assertion` union imported via types.ts, so no import changes needed.

    2. **Add cases to `checkOne` switch** (before the `default` case):
       ```typescript
       case "tool_used_any":
         return checkToolUsedAny(trace, assertion);
       case "tool_no_errors":
         return checkToolNoErrors(trace, assertion);
       case "tool_preference":
         return checkToolPreference(trace, assertion);
       ```

    3. **Implement `checkToolUsedAny`:**
       ```typescript
       /** Assert that at least one of the listed tools was used. */
       function checkToolUsedAny(
         trace: EvalTrace,
         assertion: Extract<Assertion, { type: "tool_used_any" }>,
       ): AssertionResult {
         const found = assertion.tools.filter((tool) =>
           trace.entries.some((e) => toolNameMatch(e.toolName, tool)),
         );

         if (found.length > 0) {
           return {
             pass: true,
             assertion,
             detail: `Found tool(s): ${found.join(", ")}`,
           };
         }

         return {
           pass: false,
           assertion,
           detail: `None of [${assertion.tools.join(", ")}] found in trace`,
         };
       }
       ```

    4. **Implement `checkToolNoErrors`:**
       ```typescript
       /** Assert that a specific tool had no error results. */
       function checkToolNoErrors(
         trace: EvalTrace,
         assertion: Extract<Assertion, { type: "tool_no_errors" }>,
       ): AssertionResult {
         const toolEntries = trace.entries.filter(
           (e) => toolNameMatch(e.toolName, assertion.tool),
         );

         if (toolEntries.length === 0) {
           // Vacuous pass — tool was never called, so no errors
           return {
             pass: true,
             assertion,
             detail: `No ${assertion.tool} calls in trace (vacuous pass)`,
           };
         }

         const errorCount = toolEntries.filter((e) => e.isError).length;

         if (errorCount === 0) {
           return {
             pass: true,
             assertion,
             detail: `${toolEntries.length} ${assertion.tool} call(s), 0 errors`,
           };
         }

         return {
           pass: false,
           assertion,
           detail: `${errorCount} of ${toolEntries.length} ${assertion.tool} call(s) had errors`,
         };
       }
       ```

    5. **Implement `checkToolPreference`:**
       ```typescript
       /** Assert that preferred tools were used more than alternative tools. Soft signal. */
       function checkToolPreference(
         trace: EvalTrace,
         assertion: Extract<Assertion, { type: "tool_preference" }>,
       ): AssertionResult {
         const preferredCount = trace.entries.filter((e) =>
           assertion.preferred.some((p) => toolNameMatch(e.toolName, p)),
         ).length;

         const overCount = trace.entries.filter((e) =>
           assertion.over.some((o) => toolNameMatch(e.toolName, o)),
         ).length;

         if (preferredCount === 0 && overCount === 0) {
           // Vacuous pass — neither preferred nor over tools were used
           return {
             pass: true,
             assertion,
             detail: "Neither preferred nor over tools used (vacuous pass)",
           };
         }

         if (preferredCount > overCount) {
           return {
             pass: true,
             assertion,
             detail: `Preferred tools: ${preferredCount} calls, over tools: ${overCount} calls`,
           };
         }

         return {
           pass: false,
           assertion,
           detail: `Preferred tools: ${preferredCount} calls, over tools: ${overCount} calls (wanted preferred > over)`,
         };
       }
       ```

    The existing exhaustive `never` check will now compile again with all 9 cases handled.
  </action>
  <verify>pnpm run build 2>&1 | tail -5</verify>
  <done>AC-2 satisfied: 3 new assertion checkers implemented and wired into checkOne switch.</done>
</task>

<task type="auto">
  <name>Task 3: Update loader validation for new assertion types</name>
  <files>src/loader.ts</files>
  <action>
    1. **Update `KNOWN_ASSERTION_TYPES`** to include the 3 new types:
       ```typescript
       const KNOWN_ASSERTION_TYPES = [
         "tool_used",
         "tool_not_used",
         "tool_before",
         "tool_called_with",
         "parallel_calls",
         "completed",
         "tool_used_any",
         "tool_no_errors",
         "tool_preference",
       ] as const;
       ```

    2. **Add validation cases to `validateAssertionShape`** — in the switch statement, before the `default` case, add:

       ```typescript
       case "tool_used_any":
         if (!Array.isArray(a.tools) || a.tools.length === 0) {
           throw new Error(
             `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "tools" (non-empty string array)`,
           );
         }
         break;

       case "tool_no_errors":
         if (typeof a.tool !== "string") {
           throw new Error(
             `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "tool"`,
           );
         }
         break;

       case "tool_preference":
         if (!Array.isArray(a.preferred) || a.preferred.length === 0) {
           throw new Error(
             `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "preferred" (non-empty string array)`,
           );
         }
         if (!Array.isArray(a.over) || a.over.length === 0) {
           throw new Error(
             `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "over" (non-empty string array)`,
           );
         }
         break;
       ```

    3. **Remove the Phase J placeholder comment** — delete the two-line comment on lines 106-107:
       ```
       // NOTE: Phase J will add tool_used_any, tool_no_errors, tool_preference.
       // When those are added, update this validation accordingly.
       ```
  </action>
  <verify>pnpm run build 2>&1 | tail -5</verify>
  <done>AC-3 satisfied: loader validates new assertion shapes with descriptive errors.</done>
</task>

<task type="auto">
  <name>Task 4: Add tests for new assertion types</name>
  <files>src/assertions.test.ts, src/loader.test.ts</files>
  <action>
    **Part A: Assertion engine tests (src/assertions.test.ts)**

    Add 3 new describe blocks after the existing `completed` tests and before the `checkAssertions` tests:

    1. **`tool_used_any`** (4 tests):
       - Pass: one of the listed tools is present in trace
       - Pass: multiple of the listed tools are present (detail lists all found)
       - Fail: none of the listed tools are present
       - Fail: empty trace
       - Case-insensitive matching: trace has "grep" but assertion lists "Grep"

    2. **`tool_no_errors`** (4 tests):
       - Pass: tool called with no errors
       - Pass: tool not in trace at all (vacuous pass — detail includes "vacuous")
       - Fail: tool called with some errors
       - Pass: tool called multiple times, only non-error calls

    3. **`tool_preference`** (5 tests):
       - Pass: preferred tools used more than over tools
       - Fail: over tools used more than preferred tools
       - Pass: neither preferred nor over tools used (vacuous pass)
       - Pass: preferred used, over not used at all
       - Fail: preferred not used but over tools used
       - Case-insensitive matching: trace has "symbol_graph" but assertion lists "Symbol_Graph"

    **Part B: Loader tests (src/loader.test.ts)**

    Add new test cases to the existing "Assertion shape validation" describe block:

    1. `tool_used_any` without tools → throws with "missing required field \"tools\""
    2. `tool_used_any` with empty tools array → throws
    3. `tool_no_errors` without tool → throws with "missing required field \"tool\""
    4. `tool_preference` without preferred → throws with "missing required field \"preferred\""
    5. `tool_preference` without over → throws with "missing required field \"over\""
    6. Well-formed eval with all 9 assertion types loads successfully (update existing "well-formed eval with multiple assertion types" test to include new types)
    7. Update the "unknown type" test expectation — verify that the error message lists all 9 available types

    All existing tests must continue to pass unchanged.
  </action>
  <verify>pnpm test 2>&1 | tail -15</verify>
  <done>AC-4 and AC-5 satisfied: new assertion types have comprehensive test coverage, loader validation tested.</done>
</task>

<task type="auto">
  <name>Task 5: Replace existing 4 evals and add 7 new eval definitions</name>
  <files>evals/read-over-cat.yaml, evals/read-before-edit.yaml, evals/no-redundant-cd.yaml, evals/edit-over-sed.yaml, evals/search-over-find.yaml, evals/grep-over-bash-grep.yaml, evals/parallel-tool-calls.yaml, evals/edit-over-write.yaml, evals/edit-accuracy.yaml, evals/graph-for-structure.yaml, evals/truncation-follow-up.yaml</files>
  <action>
    Replace the 4 existing eval YAML files with the v1.1 versions from `~/pi/workspace/thinkingSpace/plans/eval-definitions-v1.1.md` and create the 7 new eval files.

    **Existing evals — REPLACE contents** (v1.1 has more prompts and refined assertions):

    1. **`evals/read-over-cat.yaml`** — 4 prompts (was 2), 3 assertions (tool_used Read, tool_not_used Bash+cat, tool_not_used Bash+head/tail/less/more)
    2. **`evals/read-before-edit.yaml`** — 1 prompt (same), setup commands, 1 assertion (tool_before Read→Edit)
    3. **`evals/no-redundant-cd.yaml`** — 3 prompts (was 3 but different text), 2 assertions (tool_not_used cd&&, tool_not_used cd;)
    4. **`evals/edit-over-sed.yaml`** — 1 prompt (same), setup commands, 4 assertions (tool_used Edit, tool_not_used sed, tool_not_used awk, tool_not_used perl)

    **New evals — CREATE:**

    5. **`evals/search-over-find.yaml`** — category: tool-routing, 4 prompts, 3 assertions (tool_used_any [Grep,find,ls], tool_not_used Bash+find, tool_not_used Bash+ls -R)
    6. **`evals/grep-over-bash-grep.yaml`** — category: tool-routing, 3 prompts, 4 assertions (tool_used Grep, tool_not_used grep, tool_not_used rg, tool_not_used ag)
    7. **`evals/parallel-tool-calls.yaml`** — category: tool-discipline, 3 prompts, 1 assertion (parallel_calls min_parallel:2)
    8. **`evals/edit-over-write.yaml`** — category: tool-routing, setup block, 2 prompts, 2 assertions (tool_used Edit, tool_not_used Write)
    9. **`evals/edit-accuracy.yaml`** — category: tool-discipline, setup block, 1 prompt, 3 assertions (tool_used Edit, tool_before Read→Edit, tool_no_errors Edit)
    10. **`evals/graph-for-structure.yaml`** — category: tool-routing, 3 prompts, 2 assertions (tool_used_any codegraph tools, tool_preference graph over grep). **NOTE:** Include `cwd: ~/pi/workspace/pi-hashline-readmap` field.
    11. **`evals/truncation-follow-up.yaml`** — category: context, setup block (generates 3000-line file + marker), 1 prompt, 2 assertions (tool_used Read, tool_called_with Read+offset)

    Copy YAML content exactly from the v1.1 spec document. Do NOT add `pass_threshold` or `timeout` unless specified in the spec (defaults apply).

    After writing all files, validate every eval loads:
    ```bash
    node -e "
      const { loadEvalDefinition, listEvalDefinitions } = require('./dist/src/loader.js');
      const names = listEvalDefinitions('evals');
      console.log('Evals found:', names.length, names);
      for (const name of names) {
        loadEvalDefinition(name, 'evals');
        console.log('  ✓', name);
      }
    "
    ```
  </action>
  <verify>pnpm run build && node -e "const { listEvalDefinitions, loadEvalDefinition } = require('./dist/src/loader.js'); const n = listEvalDefinitions('evals'); console.log(n.length, 'evals loaded'); n.forEach(name => loadEvalDefinition(name, 'evals'));" 2>&1</verify>
  <done>AC-6 satisfied: all 11 eval definitions valid and loadable, covering 3 categories with 25+ total prompts.</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- src/tracer.ts (tracer logic is stable)
- src/runner/cmux-runner.ts (runner internals are stable)
- src/runner/types.ts (runner types are stable)
- index.ts (no command surface changes needed — the runner already dispatches via checkAssertions which handles new types automatically)
- results/ (historical artifacts)
- package.json (no new dependencies needed)

## SCOPE LIMITS
- No new commands or command surface changes
- No CI/workflow setup (Phase K)
- No README changes (Phase K)
- No new baseline run (Phase K)
- No changes to RunSummary or EvalRunResult schemas
- The `tool_preference` assertion is a SOFT signal — it should pass/fail like other assertions but its intent is advisory. No special display treatment.
- graph-for-structure.yaml uses `cwd` field — this is informational metadata for the runner (Phase H's `--project-dir` handles execution). The loader accepts arbitrary extra fields.
</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with zero TypeScript errors
- [ ] `pnpm test` discovers and runs all test files with zero failures
- [ ] types.ts has 9 assertion type interfaces and a 9-member Assertion union
- [ ] assertions.ts handles all 9 types in checkOne() with exhaustive never check compiling
- [ ] loader.ts KNOWN_ASSERTION_TYPES has 9 entries
- [ ] loader.ts validateAssertionShape covers all 9 types
- [ ] Phase J placeholder comment removed from loader.ts
- [ ] assertions.test.ts has tests for tool_used_any (4+), tool_no_errors (4+), tool_preference (5+)
- [ ] loader.test.ts validates shape rejection for all 3 new types
- [ ] All 46 existing tests still pass
- [ ] 11 eval YAML files exist in evals/ directory
- [ ] All 11 evals load via loadEvalDefinition without errors
- [ ] Eval categories cover: tool-routing, tool-discipline, context
- [ ] Total prompt count across all evals is >= 25
- [ ] No changes to protected files (tracer.ts, runner/*, index.ts, package.json)
- [ ] All acceptance criteria met (AC-1 through AC-7)
</verification>

<success_criteria>
- Build clean: `pnpm run build` exits 0 with zero errors
- All tests pass: `pnpm test` exits 0 (existing 46 + new ~15 = ~61 total)
- 9 assertion types fully implemented, validated, and tested
- 11 eval definitions loadable across 3 categories (tool-routing, tool-discipline, context)
- 25+ total prompts across all evals
- Assertion exhaustive check compiles (TypeScript catch for missing cases)
- Existing Phase A–I artifacts untouched
</success_criteria>

<output>
After completion, create `.paul/phases/J-eval-expansion-assertion-types/J-01-SUMMARY.md`
</output>
