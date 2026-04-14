---
phase: H-project-directory-support
plan: 01
status: complete
completed: 2026-04-14
---

# H-01 Summary: Project Directory Support

## What was done

Added `--project-dir <path>` support to `/eval-run` so evals can launch pi inside a foreign project directory while keeping eval definitions and results rooted in the extension repo.

## Changes

### src/runner/types.ts
- Updated `projectDir` JSDoc to clarify it means the target working directory (not the extension source)
- Added `extensionDir: string` field to `RunnerOptions` for the extension repo path

### src/runner/cmux-runner.ts
- Updated pi startup command building to include `-e <extensionDir>` when the target project directory differs from the extension repo
- All existing behavior (pane lifecycle, trace polling, `--model`/`--thinking` pass-through) preserved unchanged

### index.ts
- Added `statSync` to `node:fs` imports
- Updated `/eval-run` command description to include `--project-dir <path>`
- Added `--project-dir` flag parsing alongside existing `--model`, `--thinking`, `--baseline` flags
- Added path validation: resolves relative to `ctx.cwd`, verifies existence and directory status, fails fast with clear error
- Updated usage text with `--project-dir` example
- Runner options now pass `extensionDir: ctx.cwd` and `projectDir: targetProjectDir`
- When `--project-dir` is omitted, defaults to `ctx.cwd` (backward-compatible)

### README.md
- Updated command table to show all flags including `--project-dir`
- Added foreign-project example to `/eval-run examples`
- Added new "Foreign-project execution" section explaining the flag's behavior

## Acceptance Criteria

- [x] AC-1: `/eval-run` accepts `--project-dir` and resolves it relative to `ctx.cwd`
- [x] AC-2: Invalid `--project-dir` values fail fast with a clear error before cmux starts
- [x] AC-3: Runner starts pi in target project, loads extension via `-e`, traces from target dir
- [x] AC-4: Omitting `--project-dir` preserves existing behavior (`ctx.cwd` as both project and extension dir)
- [x] AC-5: README documents the new flag with usage examples
- [x] AC-6: `pnpm run build` succeeds with zero errors

## Verification Results

- `pnpm run build` — zero errors ✓
- Usage text includes `--project-dir <path>` — 5 occurrences in dist/index.js ✓
- Invalid paths fail before cmux — `existsSync` + `statSync().isDirectory()` guard ✓
- Runner options distinguish `extensionDir` from `projectDir` — both fields present in types ✓
- `runSingleEval` starts pi in target project (`cd ${options.projectDir}`) ✓
- `-e` flag included when `extensionDir !== projectDir` ✓
- Trace polling reads from `options.projectDir` ✓
- `/eval-run all` without `--project-dir` uses `ctx.cwd` for both fields ✓
- README includes foreign-project example — 5 occurrences of `project-dir` ✓
- No changes to protected files (`src/types.ts`, `src/tracer.ts`, `src/assertions.ts`, `src/loader.ts`, `evals/`, `results/baseline.json`) ✓

## Boundaries Respected

- No new dependencies added
- No result schema changes
- No new eval definitions or assertion types
- No CI/workflow setup
- No `--no-extensions` or extension-isolation redesign
- Changes limited to path plumbing for `--project-dir`
