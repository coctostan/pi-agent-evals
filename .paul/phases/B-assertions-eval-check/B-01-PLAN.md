---
phase: B-assertions-eval-check
plan: 01
type: execute
wave: 1
depends_on: ["A-01"]
files_modified: [src/assertions.ts, src/loader.ts, index.ts]
autonomous: true
---

<objective>
## Goal
Implement the assertion engine that evaluates traces against eval definitions, the YAML eval loader, and the `/eval-check` command for manual validation in live pi sessions.

## Purpose
Phase B is the core logic layer. Without it, traces captured in Phase A have no meaning — there's nothing to evaluate "did the agent behave correctly?" Phase B makes the tracer useful by adding the evaluation pipeline: load an eval definition → run assertions against the trace → report pass/fail.

## Output
- `src/assertions.ts` — assertion engine: `checkAssertions(trace, assertions) → AssertionResult[]`
- `src/loader.ts` — YAML eval loader: `loadEvalDefinition(evalName, evalsDir?) → EvalDefinition`
- `index.ts` — updated with `/eval-check <name>` command registration
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work (genuine dependency)
.paul/phases/A-tracer-types/A-01-SUMMARY.md
# Phase B imports types and Tracer directly from Phase A output:
# - EvalTrace, ToolTraceEntry, Assertion, AssertionResult, EvalDefinition from src/types.ts
# - Tracer from src/tracer.ts (accessed via extension closure in index.ts)

## Source Files
src/types.ts
src/tracer.ts
index.ts
package.json
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

### Advisory hooks
- TODD(100): No project test files or frameworks detected (greenfield). `tdd_candidates: none`.
- IRIS(150): No anti-patterns (TODO/FIXME/HACK/XXX) in source files. `review_flags: none`.
- DAVE(200): No CI config detected. Advisory: defer CI to Phase D/E.
- DOCS(200): No documentation files outside `.paul/`. Advisory: README deferred.
- RUBY(250): All source files small (types.ts 181, tracer.ts 125, index.ts 70 lines). `debt_flags: none`.

### Enforcement hooks
- DEAN(50): `pnpm audit` → 0 vulnerabilities across all severities. PASS.
- SETH(80): No hardcoded secrets detected in source files. PASS.
- ARCH(75): Flat `src/` structure detected. New files (`assertions.ts`, `loader.ts`) fit cleanly in existing layer. No architectural concerns.

[dispatch] pre-plan advisory: TODD(100) → 0 inject | IRIS(150) → 0 inject | DAVE(200) → 0 inject | DOCS(200) → 0 inject | RUBY(250) → 0 inject
[dispatch] pre-plan enforcement: DEAN(50) → PASS | SETH(80) → PASS | ARCH(75) → PASS
</module_dispatch>

<acceptance_criteria>

## AC-1: Assertion engine evaluates all 6 assertion types correctly
```gherkin
Given a function checkAssertions(trace, assertions)
When called with an EvalTrace and an array of Assertion[]
Then it returns an AssertionResult[] with one result per assertion,
  each containing pass (boolean), the original assertion, and a human-readable detail string
```

## AC-2: tool_used assertion passes when tool appears in trace
```gherkin
Given a trace containing entries with toolName "Read"
When a tool_used assertion for "Read" is evaluated
Then the result is pass: true with detail indicating match count
```

## AC-3: tool_not_used assertion blocks calls matching argument_pattern
```gherkin
Given a trace containing a Bash entry with args matching "cat somefile"
When a tool_not_used assertion for "Bash" with argument_pattern "cat\\s" is evaluated
Then the result is pass: false with detail indicating the matching entry
And when no argument_pattern is provided, any Bash entry causes failure
```

## AC-4: tool_before assertion validates ordering
```gherkin
Given a trace where "Read" appears at index 0 and "Edit" at index 2
When a tool_before assertion {first: "Read", then: "Edit"} is evaluated
Then the result is pass: true
And if "Edit" appears before "Read", the result is pass: false
```

## AC-5: YAML eval loader parses definitions correctly
```gherkin
Given a YAML file at evals/<name>.yaml with valid EvalDefinition structure
When loadEvalDefinition(name) is called
Then it returns a parsed EvalDefinition object with name, description, category, prompts, and assertions
And if the file doesn't exist, it throws a descriptive error
```

## AC-6: /eval-check command produces pass/fail output
```gherkin
Given a live pi session with trace data from the tracer
When the user runs /eval-check <eval-name>
Then the command loads evals/<eval-name>.yaml, runs all assertions against the current trace,
  and displays per-assertion pass/fail results with details via ctx.ui.notify
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Create assertion engine</name>
  <files>src/assertions.ts</files>
  <action>
    Create `src/assertions.ts` exporting a single function:

    ```
    checkAssertions(trace: EvalTrace, assertions: Assertion[]): AssertionResult[]
    ```

    Implement a checker for each assertion type in the discriminated union:

    1. **tool_used**: Check if `trace.entries` contains at least one entry where `toolName === assertion.tool`. Detail: "Found N {tool} calls" or "No {tool} calls found".

    2. **tool_not_used**: If `argument_pattern` is provided, check that no entry has `toolName === assertion.tool` AND `JSON.stringify(entry.arguments)` matching the regex. If no `argument_pattern`, check that no entry has that toolName at all. Detail: "No {tool} calls found" or "Found {tool} call matching pattern at turn N".

    3. **tool_before**: Find the first occurrence index of `first` tool and first occurrence index of `then` tool in entries. Pass if first < then (both must exist). Detail: "{first} at index N, {then} at index M" or "Missing {tool} in trace".

    4. **tool_called_with**: Check if any entry with matching `toolName` has `JSON.stringify(entry.arguments)` matching the `argument_pattern` regex. Detail: "Found matching {tool} call" or "No {tool} call matched pattern".

    5. **parallel_calls**: Group entries by `parallelGroup` (skip entries without one). Check if any group has size >= `min_parallel`. Detail: "Found group of N parallel calls" or "Max parallel group size: N (needed M)".

    6. **completed**: Pass if `trace.entries.length > 0` AND no entries have `isError: true`. Both conditions must hold — the agent must have produced tool calls and none of them errored. Detail: "Trace has N entries, 0 errors" or "Trace is empty" or "Trace has N entries but M had errors".

    Use a switch/case on `assertion.type` with exhaustive checking (add `default: never` pattern).

    Import types from `./types.js`. Use `new RegExp()` for pattern matching (not literal regex) since patterns come from YAML strings.

    Avoid: throwing on invalid regex — wrap in try/catch, return pass: false with detail explaining the bad pattern.
  </action>
  <verify>pnpm run build succeeds with no type errors; grep for all 6 assertion type strings in dist/src/assertions.js</verify>
  <done>AC-1 through AC-4 satisfied: all 6 assertion types implemented with correct pass/fail logic and human-readable details</done>
</task>

<task type="auto">
  <name>Task 2: Create eval loader and /eval-check command</name>
  <files>src/loader.ts, index.ts</files>
  <action>
    **src/loader.ts** — Create YAML eval definition loader:

    ```
    loadEvalDefinition(evalName: string, evalsDir?: string): EvalDefinition
    ```

    - Default `evalsDir` to `evals` (repo-relative, resolved from cwd at call site)
    - Read `{evalsDir}/{evalName}.yaml` synchronously using `readFileSync` (simple, called once)
    - Parse with `yaml` package (`import { parse } from "yaml"`)
    - Validate required fields exist: `name`, `description`, `category`, `prompts`, `assertions`
    - Throw descriptive error if file not found or required fields missing
    - Return typed `EvalDefinition`
    - Also export a utility: `listEvalDefinitions(evalsDir?: string): string[]` that returns available eval names by listing `*.yaml` files in the evals directory

    **index.ts** — Register `/eval-check` command:

    - Import `checkAssertions` from `./src/assertions.js`
    - Import `loadEvalDefinition` from `./src/loader.js`
    - Add these to the existing re-exports block
    - Register new command `eval-check` with the pi API:
      - Description: "Run assertions for an eval against the current trace"
      - Parse first arg as eval name (required — notify error if missing)
      - Resolve evals dir as `join(ctx.cwd, "evals")`
      - Load eval definition via `loadEvalDefinition(evalName, evalsDir)`
      - Get current trace via `tracer.getTrace(ctx)`
      - Run `checkAssertions(trace, evalDef.assertions)`
      - Format results as a readable report:
        ```
        eval: {name}
        description: {description}

        ✓ AC-1: {message} — {detail}
        ✗ AC-2: {message} — {detail}

        Result: 2/3 passed
        ```
      - Display via `ctx.ui.notify(report, allPassed ? "info" : "warning")`

    Avoid: modifying the existing /eval-trace command or lifecycle hooks.
    Avoid: changing the Tracer class or types — those are Phase A artifacts.
  </action>
  <verify>pnpm run build succeeds; grep "eval-check" dist/index.js confirms command registration; grep "loadEvalDefinition" dist/src/loader.js confirms loader exists</verify>
  <done>AC-5 and AC-6 satisfied: YAML loader parses eval definitions, /eval-check command produces formatted pass/fail output</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (Phase A artifact — type definitions are locked)
- src/tracer.ts (Phase A artifact — tracer implementation is locked)
- package.json (no new dependencies needed — `yaml` already declared)
- tsconfig.json (build config is stable)

## SCOPE LIMITS
- This plan creates the assertion engine and loader only — no eval YAML files (Phase C)
- No CMUX runner integration (Phase D)
- No test infrastructure (greenfield — tests are a future concern, not blocking)
- Do not add new lifecycle hooks or modify existing hook registrations in index.ts
- The `/eval-check` command uses the existing in-memory tracer instance via closure — no architectural changes

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with 0 errors
- [ ] `ls dist/src/assertions.js dist/src/loader.js` — both files exist
- [ ] `grep -c "tool_used\|tool_not_used\|tool_before\|tool_called_with\|parallel_calls\|completed" dist/src/assertions.js` — all 6 types present
- [ ] `grep "eval-check" dist/index.js` — command registered
- [ ] `grep "loadEvalDefinition" dist/src/loader.js` — loader exported
- [ ] `grep "checkAssertions" dist/src/assertions.js` — engine exported
- [ ] No modifications to src/types.ts or src/tracer.ts (boundary check)
- [ ] All acceptance criteria met (AC-1 through AC-6)
</verification>

<success_criteria>
- Assertion engine correctly evaluates all 6 assertion types
- YAML loader parses eval definitions with validation
- /eval-check command produces human-readable pass/fail output
- Build succeeds with no type errors
- Phase A artifacts untouched
</success_criteria>

<output>
After completion, create `.paul/phases/B-assertions-eval-check/B-01-SUMMARY.md`
</output>
