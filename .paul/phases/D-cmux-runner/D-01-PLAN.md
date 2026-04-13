---
phase: D-cmux-runner
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/runner/types.ts
  - src/runner/cmux-runner.ts
  - src/runner/cli.ts
  - package.json
  - tsconfig.json
autonomous: true
---

<objective>
## Goal
Build the CMUX runner that automates eval execution — creates clean pi sessions via cmux, sends eval prompts, waits for trace completion, runs assertions, and reports results.

## Purpose
Phases A–C established manual eval validation (tracer → assertions → `/eval-check`). Phase D completes the automation loop: `npx pi-eval run all` executes all evals unattended, which is the core success metric for v0.1.

## Output
- `src/runner/types.ts` — Result types for eval runs
- `src/runner/cmux-runner.ts` — CMUX orchestrator (spawn workspace, start pi, send prompt, poll trace, close)
- `src/runner/cli.ts` — CLI entry point for `npx pi-eval run [eval-name|category|all]`
- Updated `package.json` with any needed bin/script adjustments
- Successful `pnpm run build` with all runner files compiled
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work
.paul/phases/C-eval-definitions/C-01-SUMMARY.md — 4 eval YAML files created, all loadable via `loadEvalDefinition()`

## Source Files
src/types.ts — ToolTraceEntry, EvalTrace, EvalDefinition, Assertion, AssertionResult
src/assertions.ts — checkAssertions(trace, assertions) → AssertionResult[]
src/loader.ts — loadEvalDefinition(name, dir), listEvalDefinitions(dir)
src/tracer.ts — Tracer class (reference for trace output format)
index.ts — Extension entry (tracer hooks + /eval-check command)
evals/*.yaml — 4 eval definitions (read-over-cat, read-before-edit, no-redundant-cd, edit-over-sed)
package.json — already has `"bin": { "pi-eval": "./dist/src/runner/cli.js" }`

## External Reference — CMUX CLI (verified on v0.61.0)
Binary: `/Applications/cmux.app/Contents/Resources/bin/cmux` (macOS)
Socket: `/tmp/cmux.sock` — **restricted to cmux-spawned processes by default**
  - Runner MUST be invoked from inside a cmux terminal, OR user sets CMUX_SOCKET_MODE=allowAll
  - Inside cmux, env vars auto-set: `CMUX_WORKSPACE_ID`, `CMUX_SURFACE_ID`

Verified commands (pane-based flow):
- `cmux new-pane [--type terminal|browser] [--direction left|right|up|down] [--workspace <id|ref>] --json` → creates a pane (split) in current workspace, returns pane/surface refs
- `cmux send [--workspace <id|ref>] [--surface <id|ref>] <text>` → send text to a specific surface (\n = Enter)
- `cmux close-surface [--surface <id|ref>] [--workspace <id|ref>]` → close a surface/tab
- `cmux new-surface [--type terminal] [--pane <id|ref>]` → add a tab to an existing pane
- `cmux list-panes [--workspace <id|ref>] --json` → list panes
- `cmux list-pane-surfaces [--workspace <id|ref>] [--pane <id|ref>] --json` → list surfaces in a pane
- Global flags: `--json`, `--id-format refs|uuids|both`
- Ref format: `workspace:N`, `pane:N`, `surface:N`
- Hierarchy: Workspace > Pane (split) > Surface (tab/terminal)
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

[dispatch] pre-plan enforcement:
  DEAN(50) → PASS: 0 critical, 0 high, 0 moderate, 0 low (261 dependencies)

[dispatch] pre-plan advisory:
  ARCH(75)  → Flat src/ structure. New src/runner/ subdirectory planned. No architectural concerns.
  SETH(80)  → PASS: No secrets detected.
  TODD(100) → No test infrastructure detected. Consider adding tests (deferred — no test framework in project yet).
  IRIS(150) → No anti-patterns in existing source files.
  DAVE(200) → No CI config found. Deferred to v2.
  DOCS(200) → No README.md. doc_warnings: 1 (README missing). Deferred to Phase E or later.
  RUBY(250) → No preliminary debt indicators.
</module_dispatch>

<acceptance_criteria>

## AC-1: Runner Executes a Single Eval
```gherkin
Given a valid eval YAML file (e.g., read-over-cat) and cmux is available
When the runner creates a cmux workspace, starts pi, sends the eval prompt, and polls for the trace file
Then the trace file is detected, assertions are evaluated, and per-assertion pass/fail results are returned
```

## AC-2: CLI Runs All Evals and Produces Results
```gherkin
Given 4 eval YAML files in evals/ and the runner is built
When the user runs `npx pi-eval run all`
Then all 4 evals execute sequentially in clean cmux workspaces, results are aggregated, and a JSON results file is written to the output directory
```

## AC-3: CLI Supports Filtering and Options
```gherkin
Given eval definitions with names and categories
When the user runs `npx pi-eval run read-over-cat` or `npx pi-eval run tool-routing`
Then only matching evals execute, and `--timeout` and `--output-dir` options are respected
```

## AC-4: Graceful Error Handling
```gherkin
Given a scenario where cmux is unavailable, pi fails to start, or the trace file never appears
When the runner encounters the error condition
Then it reports a clear error message per-eval, marks the eval as failed, and continues with remaining evals
```

## AC-5: Build Succeeds
```gherkin
Given all runner files are implemented
When `pnpm run build` is executed
Then TypeScript compilation succeeds with zero errors and dist/src/runner/*.js files are produced
```

</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task 1: Create runner types and CMUX runner module</name>
  <files>src/runner/types.ts, src/runner/cmux-runner.ts</files>
  <action>
    **src/runner/types.ts** — Define result types:
    - `EvalRunResult`: `{ evalName: string; description: string; category: string; promptIndex: number; prompt: string; assertions: AssertionResult[]; passed: boolean; duration: number; error?: string }`
    - `RunSummary`: `{ timestamp: string; model: string; evals: EvalRunResult[]; totals: { total: number; passed: number; failed: number; errored: number } }`
    - `RunnerOptions`: `{ timeout: number; outputDir: string; evalsDir: string; projectDir: string; model?: string; piStartupDelay: number; pollInterval: number }`
    **src/runner/cmux-runner.ts** — CMUX orchestrator:
    - Export `runSingleEval(evalDef: EvalDefinition, promptIndex: number, prompt: string, options: RunnerOptions): Promise<EvalRunResult>`
    - Flow:
      1. Run eval `setup` commands via `child_process.execSync(cmd, { cwd: '/tmp' })` (setup creates /tmp fixtures)
      2. Delete stale trace file: `rm -f {projectDir}/.pi/eval-trace.json` (ensure fresh trace per eval)
      3. Create a new cmux pane: `execSync(cmuxBin + ' new-pane --json')` — parse JSON output for the surface ref
         - `new-pane` creates a split terminal in the current workspace (lightweight, no full workspace lifecycle)
         - The `--json` output should contain the pane and/or surface ref — parse defensively, fall back to `list-pane-surfaces` if needed
      4. Send `cd {projectDir}\n` then `pi\n` to the new surface via `cmux send --surface <ref>`
         - projectDir = options.projectDir (this project root, where the extension is declared in package.json)
         - This ensures the tracer extension auto-loads from the project's pi config
      5. Wait for pi to start: configurable delay via `options.piStartupDelay` (default 5000ms)
         - Log the wait so the user sees progress
      6. Send the eval prompt followed by `\n` via `cmux send --surface <ref>`
      7. Poll for trace file: `{projectDir}/.pi/eval-trace.json`
         - Check at `options.pollInterval` (default 1000ms) intervals
         - Validate: file exists AND parses as JSON AND has non-empty `entries` array AND `startedAt` is recent (within this run)
         - Timeout after `options.timeout` ms
      8. When trace file detected, read and parse as `EvalTrace`
      9. Run `checkAssertions(trace, evalDef.assertions)` from existing engine
      10. Clean up: `cmux close-surface --surface <ref>` (in try/finally to ensure cleanup on error)
      11. Return `EvalRunResult` with assertion results, pass/fail, and duration

    - **cmux binary resolution** — `resolveCmuxBin(): string`
      Search order:
      1. `CMUX_CLI_PATH` env var (explicit override)
      2. `cmux` in PATH (via `which cmux`)
      3. `/Applications/cmux.app/Contents/Resources/bin/cmux` (macOS default)
      Throw with helpful message if none found.

    - **cmux environment check** — `checkCmuxEnvironment(): { available: boolean; inCmux: boolean; bin: string | null; message: string }`
      - Check binary exists (via resolveCmuxBin)
      - Check `CMUX_WORKSPACE_ID` env var to detect if running inside cmux
      - If binary found but NOT inside cmux: warn "cmux CLI found but you are not running inside cmux. The socket restricts access to cmux-spawned processes. Either run this command from a cmux terminal, or set CMUX_SOCKET_MODE=allowAll in cmux settings."
      - If inside cmux: return available=true
    - Use `child_process.execSync` for cmux CLI commands with `{ encoding: 'utf-8' }` option
    - Use `node:fs` `existsSync`, `readFileSync`, `unlinkSync`, `statSync` for file ops
    - Use `node:timers/promises` `setTimeout` for async polling
    - Handle errors gracefully: wrap each eval in try/finally, always close the surface, return `EvalRunResult` with `error` field set and `passed: false` on failure

    Avoid:
    - Do NOT use the socket API — CLI is simpler and sufficient for v0.1
    - Do NOT add complex retry logic — simple poll-and-timeout is enough
    - Do NOT import from the extension entry (index.ts) — import directly from src/assertions.ts and src/loader.ts
    - Do NOT create temp directories for the pi session — run pi from the project dir so the extension loads
  </action>
  <verify>
    `pnpm run build` succeeds and `dist/src/runner/types.js` and `dist/src/runner/cmux-runner.js` exist
  </verify>
  <done>AC-1 satisfied: Runner module can execute a single eval via cmux. AC-4 partially satisfied: error handling in runSingleEval.</done>
</task>

<task type="auto">
  <name>Task 2: Create CLI entry point</name>
  <files>src/runner/cli.ts, package.json</files>
  <action>
    **src/runner/cli.ts** — CLI entry with `#!/usr/bin/env node` shebang:
    - Parse `process.argv` manually (no arg-parsing library needed for v0.1):
      - `npx pi-eval run <target>` where target is an eval name, category, or "all"
      - `--timeout <ms>` (default: 120000 — 2 minutes per eval)
      - `--output-dir <path>` (default: "results")
      - `--model <name>` (store for metadata, passed through to RunnerOptions)
      - `--startup-delay <ms>` (default: 5000 — time to wait for pi to start)
      - `--poll-interval <ms>` (default: 1000 — trace file poll frequency)
    - Validate the subcommand is "run" and target is provided
    - Run `checkCmuxEnvironment()` — exit with helpful message if not available, warn if not inside cmux
    - Resolve `projectDir` as `process.cwd()` (the project root where package.json declares the extension)
    - Load eval definitions using `listEvalDefinitions()` and `loadEvalDefinition()` from `../loader.js`
    - Filter evals by target:
      - If target is "all": run all evals
      - If target matches an eval name: run that one eval
      - If target matches a category: run all evals in that category
      - Otherwise: print error and available evals/categories, exit 1
    - For each matching eval, for each prompt in the eval:
      - Run `runSingleEval(evalDef, promptIndex, prompt, options)`
      - Print per-prompt pass/fail results to stdout as they complete
    - After all evals complete:
      - Build `RunSummary` with totals
      - Print summary table to stdout
      - Write results JSON to `{outputDir}/{YYYY-MM-DD-HHmmss}.json`
      - Ensure output directory exists (`mkdirSync({ recursive: true })`)
      - Exit with code 0 if all passed, 1 if any failed
    - `"pi-eval": "./dist/src/runner/cli.js"` already exists — no changes needed unless path is wrong
    - Ensure no new runtime dependencies are needed (use only node builtins + existing deps)
    Avoid:
    - Do NOT add external arg-parsing libraries (yargs, commander, etc.) — keep it simple with process.argv
    - Do NOT run evals in parallel — sequential execution is safer for v0.1 (avoids cmux workspace conflicts)
    - Do NOT import from `index.ts` — use `../loader.js` and `../assertions.js` directly
  </action>
  <verify>
    `pnpm run build` succeeds; `dist/src/runner/cli.js` exists and starts with the node shebang; `node dist/src/runner/cli.js` (without args) prints usage help without crashing
  </verify>
  <done>AC-2 satisfied: CLI can run all evals and produce results JSON. AC-3 satisfied: CLI supports name/category filtering and --timeout/--output-dir/--startup-delay/--poll-interval options. AC-5 satisfied: build succeeds.</done>
</task>

<task type="auto">
  <name>Task 3: End-to-end build verification and dry-run validation</name>
  <files>src/runner/types.ts, src/runner/cmux-runner.ts, src/runner/cli.ts</files>
  <action>
    Final verification pass:
    1. Run `pnpm run build` — confirm zero TypeScript errors
    2. Verify `dist/src/runner/cli.js`, `dist/src/runner/cmux-runner.js`, `dist/src/runner/types.js` all exist
    3. Run `node dist/src/runner/cli.js` with no args — should print usage help and exit
    4. Run `node dist/src/runner/cli.js run --help` or invalid args — should print error + usage
    5. Verify the CLI detects cmux environment (binary resolution + inside-cmux check)
    6. Verify that the existing extension code (`dist/index.js`) still works — `pnpm run build` should compile both extension and runner
    7. Verify no circular imports between runner modules and extension modules
    8. Spot-check that `loadEvalDefinition` can still load all 4 evals from the built output
  </action>
  <verify>
    `pnpm run build` exits 0; `node dist/src/runner/cli.js` exits cleanly with usage output; `ls dist/src/runner/` shows cli.js, cmux-runner.js, types.js
  </verify>
  <done>AC-4 satisfied: graceful handling when cmux unavailable or not inside cmux. AC-5 satisfied: full build clean. All AC met.</done>
</task>
</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (core types are stable from Phase A)
- src/tracer.ts (tracer is stable from Phase A)
- src/assertions.ts (assertion engine is stable from Phase B)
- src/loader.ts (loader is stable from Phase B)
- index.ts (extension entry is stable from Phase B)
- evals/*.yaml (eval definitions are stable from Phase C)

## SCOPE LIMITS
- CLI only needs `run` subcommand — no `compare`, `list`, or other subcommands yet
- No parallel eval execution — sequential only for v0.1
- No `--model` flag behavior beyond storing metadata (model switching is v2)
- No `--thinking` flag (v2)
- No historical comparison (v2)
- No CI integration (v2)
- Do NOT add external dependencies (yargs, commander, chalk, etc.) — use node builtins only
- Socket API deferred — use cmux CLI commands only

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` exits 0 with zero errors
- [ ] `ls dist/src/runner/` shows cli.js, cmux-runner.js, types.js (and .d.ts files)
- [ ] `node dist/src/runner/cli.js` prints usage help and exits cleanly
- [ ] `node dist/src/runner/cli.js run all` either runs evals (if cmux available) or prints a clear "cmux not found" error
- [ ] No modifications to Phase A–C source files (boundaries respected)
- [ ] All acceptance criteria (AC-1 through AC-5) verified
</verification>

<success_criteria>
- All 3 tasks completed
- All 5 acceptance criteria met
- Build succeeds with zero errors
- CLI executable via `npx pi-eval run` (or `node dist/src/runner/cli.js run`)
- No regressions in existing extension functionality
</success_criteria>

<output>
After completion, create `.paul/phases/D-cmux-runner/D-01-SUMMARY.md`
</output>
