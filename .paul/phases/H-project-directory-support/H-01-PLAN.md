---
phase: H-project-directory-support
plan: 01
type: execute
wave: 1
depends_on: [G-01]
files_modified: [src/runner/types.ts, src/runner/cmux-runner.ts, index.ts, README.md]
autonomous: true
---

<objective>
## Goal
Add `--project-dir` support to `/eval-run` so evals can launch pi inside a foreign project directory while still loading this repo's extension and keeping eval definitions/results rooted in the current repo.

## Purpose
Phase D intentionally ran pi from the extension repo so the tracer auto-loaded from `package.json`. That limitation now blocks running the eval harness against other project roots. Phase H removes that constraint without changing the existing eval format, assertion engine, or results workflow.

## Output
- `/eval-run <target> --project-dir <path>` resolves and validates a foreign project directory
- The cmux runner starts pi inside the target directory while loading this repo's extension via `-e`
- Trace polling reads `.pi/eval-trace.json` from the target project directory
- Evals and results continue to resolve from the orchestrating repo (`evals/`, `results/` under `ctx.cwd`)
- README usage and examples document the new flag and foreign-project behavior
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/G-matrix-execution-results/G-01-SUMMARY.md
.paul/phases/D-cmux-runner/D-01-SUMMARY.md

## Source Files
index.ts
src/runner/types.ts
src/runner/cmux-runner.ts
README.md
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
- DEAN(50): `pnpm audit --json` reports 0 critical / 0 high / 0 moderate / 0 low vulnerabilities — PASS
- SETH(80): No hardcoded secrets detected in planned files; scope is CLI/path plumbing only — PASS

[dispatch] pre-plan advisory:
- ARCH(75): Flat `src/` with `runner/` subdir; no circular-dependency concern in planned files. `index.ts` is 486 lines and `src/runner/cmux-runner.ts` is 376 lines, so keep changes tightly scoped and avoid incidental refactors.
- TODD(100): No test files/framework present in repo — execution must verify with build + targeted smoke checks rather than existing automated tests.
- IRIS(150): No TODO/FIXME/HACK/XXX markers in planned files — PASS
- GABE(175): No API files in scope — skip
- LUKE(185): No UI files in scope — skip
- ARIA(190): No UI files in scope — skip
- DANA(195): No data/migration files in scope — skip
- DAVE(200): No CI config detected (`.github/workflows`, `.gitlab-ci.yml`, Dockerfile, docker-compose, Jenkinsfile absent) — deferred to a future milestone
- DOCS(200): README.md exists and must be updated because `/eval-run` command surface changes
- OMAR(205): No observability-specific files in scope — skip
- REED(210): No resilience-specific files in scope beyond existing timeout plumbing — skip
- VERA(215): No privacy-relevant files in scope — skip
- PETE(225): No heavy imports detected; performance risk is limited to keeping option plumbing simple — skip
- RUBY(250): Debt watch only — `index.ts` is near the 500-line threshold, so only extract helpers if the new flag cannot be added cleanly in place
</module_dispatch>

<acceptance_criteria>
## AC-1: `/eval-run` accepts a project directory override
```gherkin
Given the user runs /eval-run all --project-dir ../other-project
When the command parses and validates arguments
Then the runner target directory is resolved from that path relative to ctx.cwd
And eval definitions and results still resolve from ctx.cwd
```

## AC-2: Invalid project directories fail fast
```gherkin
Given the user passes --project-dir with a missing path or a non-directory path
When /eval-run validates inputs
Then it notifies with a clear error
And it does not start the cmux runner
```

## AC-3: The runner launches pi in the target project and loads this extension explicitly
```gherkin
Given RunnerOptions includes a target project directory different from the extension repo
When runSingleEval starts pi in the cmux pane
Then it changes into the target project directory
And it starts pi with -e pointing at the extension repo path
And trace polling reads .pi/eval-trace.json from the target project directory
```

## AC-4: Backward compatibility is preserved when the flag is omitted
```gherkin
Given the user runs /eval-run all without --project-dir
When the command executes
Then the current repo cwd remains the runner target directory
And behavior matches the existing v0.2 flow
```

## AC-5: Foreign-project execution is documented
```gherkin
Given a user reads README.md
When they look up /eval-run usage
Then the command syntax includes --project-dir
And an example explains that pi runs in the foreign project while evals/results remain in this repo
```

## AC-6: Build and smoke verification succeed
```gherkin
Given all changes are made
When pnpm run build and the planned foreign-project smoke verification are executed
Then TypeScript compiles with zero errors
And the smoke run proves the extension loads in a foreign project directory
```
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task 1: Separate extension location from runner target directory</name>
  <files>src/runner/types.ts, src/runner/cmux-runner.ts</files>
  <action>
    Extend runner configuration so the code can distinguish between:
    1. the extension repo path that should be loaded with `pi -e ...`, and
    2. the target project directory where pi should start and where `.pi/eval-trace.json` should be read.

    In `src/runner/types.ts`:
    - add a field for the extension repo path (for example `extensionDir: string`)
    - update the existing `projectDir` comment so it clearly means the target working directory for the eval session, not the extension source location

    In `src/runner/cmux-runner.ts`:
    - keep pane creation, setup commands, prompt send, polling, and cleanup behavior unchanged
    - keep `tracePath` rooted at `options.projectDir`
    - build the pi start command so it includes the extension repo with `-e` when the target project differs from the extension repo
    - preserve the existing `--model` and `--thinking` pass-through behavior
    - do not add `--no-extensions`; this phase only ensures the eval extension is explicitly loaded in foreign projects
  </action>
  <verify>pnpm run build && grep 'extensionDir\|projectDir\| -e ' dist/src/runner/types.d.ts dist/src/runner/cmux-runner.js</verify>
  <done>AC-3 satisfied: runner options separate extension-vs-target paths, pi startup includes explicit extension loading for foreign projects, and trace polling remains target-project scoped. AC-6 partial: build clean.</done>
</task>

<task type="auto">
  <name>Task 2: Add --project-dir parsing and validation to /eval-run</name>
  <files>index.ts</files>
  <action>
    Update the `/eval-run` command handler to support an optional `--project-dir <path>` flag.

    Implementation requirements:
    - extend the command description, usage text, and examples to show the new flag
    - parse `--project-dir` alongside the existing `--baseline`, `--model`, and `--thinking` flags
    - resolve the supplied path relative to `ctx.cwd` (unless already absolute)
    - validate that the resolved path exists and is a directory before starting cmux
    - keep `evalsDir` and `outputDir` anchored to `ctx.cwd`
    - pass both the extension repo path (`ctx.cwd`) and the resolved target project directory into runner options
    - if the flag is omitted, preserve the current behavior by using `ctx.cwd` as the target project directory

    Do NOT change result schema, assertion behavior, eval loading semantics, or compare-command behavior in this phase.
  </action>
  <verify>pnpm run build && grep 'project-dir\|extensionDir\|projectDir' dist/index.js</verify>
  <done>AC-1, AC-2, and AC-4 satisfied: /eval-run accepts and validates --project-dir, passes the right runner paths, and preserves current behavior when omitted. AC-6 partial: build clean.</done>
</task>

<task type="auto">
  <name>Task 3: Document and prove foreign-project execution</name>
  <files>README.md</files>
  <action>
    Update README.md so the public command surface matches the implementation.

    Documentation requirements:
    - update the command table entry for `/eval-run`
    - add at least one example using `--project-dir <path>`
    - explain that eval definitions and results stay under the extension repo, while pi itself starts inside the target project and loads the extension via `-e`

    Verification requirements:
    - use a targeted smoke command that creates a temporary foreign project directory, imports the built runner from `dist/`, runs one existing eval prompt against that directory, and confirms the target directory receives `.pi/eval-trace.json`
    - keep the smoke verification repo-local and dependency-free; use existing eval definitions and node builtins only
  </action>
  <verify>pnpm run build && tmpdir=$(mktemp -d) && mkdir -p "$tmpdir" && printf '{"name":"foreign-project"}\n' > "$tmpdir/package.json" && TARGET_PROJECT_DIR="$tmpdir" node --input-type=module -e "import { existsSync } from 'node:fs'; import { loadEvalDefinition } from './dist/src/loader.js'; import { runSingleEval } from './dist/src/runner/cmux-runner.js'; const evalDef = loadEvalDefinition('read-over-cat', './evals'); const projectDir = process.env.TARGET_PROJECT_DIR; const result = await runSingleEval(evalDef, 0, evalDef.prompts[0], { timeout: 120000, outputDir: './results', evalsDir: './evals', extensionDir: process.cwd(), projectDir, model: 'unknown', piStartupDelay: 5000, pollInterval: 1000 }); if (result.error) throw new Error(result.error); if (!existsSync(projectDir + '/.pi/eval-trace.json')) throw new Error('missing foreign-project trace file'); console.log(JSON.stringify({ passed: result.passed, trace: projectDir + '/.pi/eval-trace.json' }));"</verify>
  <done>AC-5 and AC-6 satisfied: README documents the new flag and a smoke run proves the extension loads and traces from a foreign project directory.</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- src/types.ts (trace/assertion types remain stable)
- src/tracer.ts (tracer lifecycle logic remains stable)
- src/assertions.ts (assertion engine remains stable)
- src/loader.ts (eval YAML loading stays repo-local)
- evals/*.yaml (existing eval definitions are not part of this phase)
- results/baseline.json (historical baseline artifact)

## SCOPE LIMITS
- No new dependencies
- No result schema changes
- No new eval definitions or assertion types
- No CI/workflow setup in this phase
- No extension-isolation redesign (`--no-extensions`, sandboxing, or custom session bootstrapping)
- No refactor beyond the path plumbing needed for `--project-dir`
</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` succeeds with zero errors
- [ ] `/eval-run` usage text includes `--project-dir <path>`
- [ ] Invalid `--project-dir` values fail before cmux starts
- [ ] Runner options distinguish extension repo path from target project dir
- [ ] `runSingleEval` starts pi in the target project directory
- [ ] `runSingleEval` includes `-e` for the extension repo when running against a foreign project
- [ ] Trace polling reads `.pi/eval-trace.json` from the target project directory
- [ ] `/eval-run all` without `--project-dir` behaves like the existing flow
- [ ] README includes at least one foreign-project example
- [ ] Foreign-project smoke verification proves `.pi/eval-trace.json` is written under the target project
- [ ] No changes to protected files or out-of-scope behavior
- [ ] All acceptance criteria met
</verification>

<success_criteria>
- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Build produces clean TypeScript output
- Foreign-project execution works without breaking the current in-repo flow
- README accurately documents the new command behavior
</success_criteria>

<output>
After completion, create `.paul/phases/H-project-directory-support/H-01-SUMMARY.md`
</output>
