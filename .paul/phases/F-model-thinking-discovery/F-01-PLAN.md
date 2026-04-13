---
phase: F-model-thinking-discovery
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/runner/types.ts, src/runner/cmux-runner.ts, index.ts]
autonomous: true
---

<objective>
## Goal
Add `--models` and `--thinking` flags to `/eval-run`, integrate `pi --list-models` for dynamic model discovery, and plumb model/thinking through to the cmux runner so pi starts with the correct `--model` and `--thinking` flags.

## Purpose
Enables running evals against different models and thinking levels — the core capability for v0.2's comparison matrix. Phase G builds on this to loop over combinations and produce matrix results.

## Output
- `/eval-run all --models claude-sonnet-4` runs evals using the specified model
- `/eval-run all --thinking high` runs evals with the specified thinking level
- Both flags parse correctly and pass through to `runSingleEval`
- Pi is started with `--model` and `--thinking` arguments in the cmux pane
- No behavioral change when flags are omitted (backward compat)
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Source Files
index.ts
src/runner/types.ts
src/runner/cmux-runner.ts
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): 0 vulnerabilities — PASS
- SETH(80): No secrets detected — PASS

[dispatch] pre-plan advisory:
- ARCH(75): Flat src/ with runner/ subdir, no architectural concerns — PASS
- TODD(100): No test files in project (node_modules only) — acknowledged baseline 0
- IRIS(150): No anti-patterns (TODO/FIXME/HACK/XXX) — PASS
- LUKE(185): No UI files — skip
- ARIA(190): No UI files — skip
- DANA(195): No data files — skip
- DAVE(200): No CI config — deferred (planned for future milestone)
- DOCS(200): README.md exists, no drift expected for flag plumbing
- OMAR(205): No observability-relevant files — skip
- REED(210): No resilience-relevant files — skip
- VERA(215): No privacy-relevant files — skip
- PETE(225): No heavy imports or perf-sensitive patterns — skip
- RUBY(250): No debt signals, all files under 400 lines — PASS
- GABE(175): No API files — skip
</module_dispatch>

<acceptance_criteria>

## AC-1: Model flag parsing
```gherkin
Given the user runs /eval-run all --models claude-sonnet-4
When the command parses arguments
Then options.model is set to "claude-sonnet-4"
And pi is started with --model claude-sonnet-4 in the cmux pane
```

## AC-2: Thinking flag parsing
```gherkin
Given the user runs /eval-run all --thinking high
When the command parses arguments
Then options.thinking is set to "high"
And pi is started with --thinking high in the cmux pane
```

## AC-3: Combined flags
```gherkin
Given the user runs /eval-run all --models claude-sonnet-4 --thinking high
When the command parses arguments
Then both model and thinking are set correctly
And pi is started with both --model and --thinking flags
```

## AC-4: Backward compatibility
```gherkin
Given the user runs /eval-run all (no model/thinking flags)
When the command executes
Then behavior is identical to v0.1 (no --model or --thinking passed to pi)
And the current session's model name is used for results metadata
```

## AC-5: Build succeeds
```gherkin
Given all changes are made
When pnpm run build is executed
Then TypeScript compiles with zero errors
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Extend RunnerOptions with model and thinking fields</name>
  <files>src/runner/types.ts</files>
  <action>
    Add two optional fields to the `RunnerOptions` interface:

    1. `modelFlag?: string` — The model identifier to pass as `--model` to pi (e.g., "claude-sonnet-4"). This is the CLI flag value, distinct from the existing `model` field which is metadata-only.
    2. `thinkingFlag?: string` — The thinking level to pass as `--thinking` to pi (e.g., "high"). Valid values: off, minimal, low, medium, high, xhigh.

    Add JSDoc comments explaining each field's purpose and that they are optional (omit = use pi defaults).

    Do NOT change the existing `model?: string` field — it remains for results metadata.
  </action>
  <verify>pnpm run build — zero errors, new fields visible in dist/src/runner/types.d.ts</verify>
  <done>AC-5 partial: types compile. New fields available for Task 2 and Task 3.</done>
</task>

<task type="auto">
  <name>Task 2: Update cmux-runner to pass model/thinking when starting pi</name>
  <files>src/runner/cmux-runner.ts</files>
  <action>
    Modify `runSingleEval` to build the pi start command with optional `--model` and `--thinking` flags:

    1. In step 4 ("Start pi in the project dir"), replace the hardcoded `"pi\n"` command:
       - Build a command string: start with `"pi"`
       - If `options.modelFlag` is set, append ` --model ${options.modelFlag}`
       - If `options.thinkingFlag` is set, append ` --thinking ${options.thinkingFlag}`
       - Append `\n`
    2. Send the constructed command via `sendToSurface` instead of the hardcoded `"pi\n"`.

    Example output: `"pi --model claude-sonnet-4 --thinking high\n"`

    Do NOT modify any other functions (createPane, pollForTrace, etc.).
    Do NOT add model discovery logic here — that's the command layer's job.
  </action>
  <verify>
    grep for '--model' and '--thinking' in dist/src/runner/cmux-runner.js — confirm flag construction exists.
    pnpm run build — zero errors.
  </verify>
  <done>AC-1, AC-2, AC-3 partial: runner plumbing passes flags to pi. AC-4: no flags = no args appended.</done>
</task>

<task type="auto">
  <name>Task 3: Add --models and --thinking flag parsing to /eval-run command</name>
  <files>index.ts</files>
  <action>
    Update the `/eval-run` command handler to parse `--models` and `--thinking` flags:

    1. **Arg parsing:** After the existing `parts` split, extract:
       - `--models <value>`: the model identifier string (single model for now — Phase G adds multi-model looping)
       - `--thinking <value>`: the thinking level string
       - Update `target` extraction to skip flag keys AND their values (not just `--` prefixed tokens)

       Implementation approach:
       ```typescript
       // Extract flag values
       let modelFlag: string | undefined;
       let thinkingFlag: string | undefined;
       for (let i = 0; i < parts.length; i++) {
         if (parts[i] === "--models" && parts[i + 1]) {
           modelFlag = parts[++i];
         } else if (parts[i] === "--thinking" && parts[i + 1]) {
           thinkingFlag = parts[++i];
         }
       }
       // Target is the first non-flag, non-flag-value token
       const flagIndices = new Set<number>();
       // ... (track which indices are flags/values)
       const target = parts.find((p, idx) => !p.startsWith("--") && !flagIndices.has(idx));
       ```

    2. **Validate thinking level:** If `thinkingFlag` is provided, validate against the known set: `["off", "minimal", "low", "medium", "high", "xhigh"]`. If invalid, notify with error and return.

    3. **Pass to runner options:** Add `modelFlag` and `thinkingFlag` to the `options` object passed to `runSingleEval`.

    4. **Update usage text:** Add the new flags to the usage string:
       ```
       /eval-run <name|category|all> [--baseline] [--models <model>] [--thinking <level>]
       ```

    5. **Update results metadata:** If `modelFlag` is provided, use it as `options.model` for results metadata instead of `ctx.model?.name`. This way the results file reflects the actual model used for the eval, not the model running the orchestrating session.

    Do NOT add model discovery/listing in this task — that's informational only and can be a follow-up.
    Do NOT add multi-model looping — Phase G handles the matrix execution.
  </action>
  <verify>
    pnpm run build — zero errors.
    grep 'modelFlag\|thinkingFlag\|--models\|--thinking' dist/index.js — confirm all flag handling present.
    grep 'eval-run' dist/index.js — confirm updated usage text.
  </verify>
  <done>AC-1, AC-2, AC-3 satisfied: flags parse and pass through to runner. AC-4 satisfied: omitted flags = v0.1 behavior. AC-5 satisfied: build clean.</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (trace/assertion types — stable from v0.1)
- src/tracer.ts (tracer — stable from v0.1)
- src/assertions.ts (assertion engine — stable from v0.1)
- src/loader.ts (YAML loader — stable from v0.1)
- evals/*.yaml (eval definitions — stable from v0.1)
- results/baseline.json (v0.1 baseline — do not overwrite)

## SCOPE LIMITS
- Single model per run only (no multi-model looping — Phase G)
- No model discovery/listing command (informational, can follow)
- No results format changes (Phase G)
- No summary table (Phase G)
- No --project-dir flag (Phase H)

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with zero errors
- [ ] `RunnerOptions` has `modelFlag` and `thinkingFlag` optional fields
- [ ] `runSingleEval` constructs pi command with `--model` and `--thinking` when provided
- [ ] `/eval-run` parses `--models` and `--thinking` flags correctly
- [ ] `/eval-run all` with no flags behaves identically to v0.1
- [ ] Usage text updated to show new flags
- [ ] No changes to protected files (types.ts, tracer.ts, assertions.ts, loader.ts, evals/)
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
After completion, create `.paul/phases/F-model-thinking-discovery/F-01-SUMMARY.md`
</output>
