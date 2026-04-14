---
phase: G-matrix-execution-results
plan: 01
completed: 2026-04-14T00:45:00Z
duration: ~1 day across APPLY + follow-up fix
---

## Objective
Add `thinking` metadata to eval results and implement `/eval-compare` so two result files can be compared side-by-side, including baseline comparison, missing-file handling, and mismatched eval handling.

## What Was Built

| File | Purpose | Lines |
|------|---------|-------|
| `src/runner/types.ts` | Added `RunSummary.thinking` so persisted result files record the thinking level used for the run | 103 |
| `index.ts` | Added `thinking` to run summaries and registered `/eval-compare` with file loading, baseline shortcut, delta rendering, missing-eval handling, and terminal-safe output | 486 |

## Acceptance Criteria Results

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC-1 | Thinking field in results when `--thinking` is provided | ✓ PASS | `RunSummary` includes `thinking`; summary builder sets `thinking: options.thinkingFlag ?? "default"` |
| AC-2 | Default thinking in results when no flag is provided | ✓ PASS | `/eval-compare` baseline smoke test read an older result without `thinking` and displayed `default` |
| AC-3 | Compare two files | ✓ PASS | Command smoke test rendered side-by-side comparison with PASS/FAIL statuses and `▲ = +` deltas |
| AC-4 | Compare against baseline | ✓ PASS | `/eval-compare file1.json --baseline` resolved `results/baseline.json` and rendered comparison output |
| AC-5 | Missing file error | ✓ PASS | Command smoke test returned `File not found: <path>` and exited without crash |
| AC-6 | Format mismatch handling | ✓ PASS | Command smoke test showed missing evals as `—` / `+` / `−` rather than erroring |
| AC-7 | Build succeeds | ✓ PASS | `pnpm run build` completed successfully |

## Verification Results

```text
$ pnpm run build
✓ Build successful (0 units compiled)

$ grep 'thinking' dist/src/runner/types.d.ts
thinking: string;
thinkingFlag?: string;

$ grep 'eval-compare' dist/index.js
pi.registerCommand("eval-compare", ...)

$ node smoke test for /eval-compare
--- message 1 (info) ---
═══ EVAL COMPARISON ═══

File 1: model-a / high  (2026-04-14)
File 2: model-b / default  (2026-04-14)

Eval              File 1  File 2  Delta
───────────────────────────────────────
edit-over-sed[0]  FAIL    PASS     ▲
new-eval[0]        —      PASS     +
read-over-cat[0]  PASS    PASS     =

Summary:
  File 1: 1/2 passed (50%)
  File 2: 3/3 passed (100%)

--- message 2 (info) ---
═══ EVAL COMPARISON ═══

File 1: model-a / high  (2026-04-14)
File 2: baseline-model / default  (2026-04-13)

Eval              File 1  File 2  Delta
───────────────────────────────────────
edit-over-sed[0]  FAIL     —       −
read-over-cat[0]  PASS    FAIL     ▼

Summary:
  File 1: 1/2 passed (50%)
  File 2: 0/1 passed (0%)

--- message 3 (error) ---
File not found: /tmp/.../missing.json

$ git diff --name-only main...HEAD
.paul/STATE.md
index.ts
src/runner/types.ts
```

## Module Execution Reports

**Pre-plan dispatch**
- DEAN(50): 0 vulnerabilities — PASS
- SETH(80): No secrets — PASS
- ARCH(75): Flat `src/` with `runner/` subdir — PASS
- TODD(100): No test files (baseline 0) — skip
- IRIS(150): No anti-patterns — PASS
- DOCS(200): README.md drift noted for new commands — deferred to end of milestone
- RUBY(250): `index.ts` growth risk noted — monitor

**Pre-unify dispatch**
- `[dispatch] pre-unify: 0 modules registered for this hook`

**Apply/fix carried forward**
- Phase G implementation delivered the planned changes in `src/runner/types.ts` and `index.ts`.
- Standard fix G-02 removed an unsafe cast in `/eval-compare` header rendering so the final build passed cleanly.

**Post-unify dispatch**
- `[dispatch] post-unify: WALT(100) → 1 report / 1 side effect | SKIP(200) → 2 reports / 0 side effects | RUBY(300) → 1 report / 0 side effects`
- WALT(100): Quality delta recorded in `.paul/quality-history.md` — tests `0/0`, lint `N/A`, typecheck `clean`, coverage `N/A`, trend `→ stable`
- SKIP(200) Decision Record:
  - **Date:** 2026-04-14
  - **Type:** decision
  - **Phase:** G — Matrix Execution + Results Format
  - **Related:** `index.ts`, `src/runner/types.ts`, PR #7
  - **Context:** Result comparison is only useful if each run records its thinking level and if old result files remain readable.
  - **Decision:** Persist `thinking` in `RunSummary` and treat missing `thinking` in older files as `default` during comparison rendering.
  - **Alternatives considered:**
    - Reject older result files without `thinking` — rejected because it would break comparison against existing baselines.
    - Add schema migration tooling for historical results — rejected as unnecessary overhead for a small JSON result format.
  - **Rationale:** This keeps new runs explicit while preserving backward compatibility with existing baseline data.
  - **Impact:** Future eval comparisons can mix pre- and post-Phase-G result files without failing.
- SKIP(200) Decision Record:
  - **Date:** 2026-04-14
  - **Type:** decision
  - **Phase:** G — Matrix Execution + Results Format
  - **Related:** `index.ts`, PR #7
  - **Context:** `/eval-compare` output needs to render reliably inside pi terminal notifications.
  - **Decision:** Use padded plain-text tables and explicit delta markers (`=`, `▲`, `▼`, `+`, `−`) instead of markdown tables.
  - **Alternatives considered:**
    - Markdown table rendering — rejected because terminal/UI formatting can vary.
    - JSON-only output — rejected because quick human comparison was the primary goal.
  - **Rationale:** Plain text is deterministic in terminal notifications and keeps comparison output readable.
  - **Impact:** Future compare output should remain terminal-first unless the UI adds richer rendering primitives.
- RUBY(300): ESLint complexity invocation was unavailable/incompatible in this repo; fallback `wc -l` review shows `index.ts` at 486 lines (WARN, below 500 critical threshold) and `src/runner/types.ts` at 103 lines. Refactor recommendation: if `/eval-run` and `/eval-compare` continue to grow, extract comparison formatting/helpers from `index.ts`.

## Deviations

### 1. Build-blocker fix during UNIFY readiness
**Plan said:** Build should succeed as part of normal Phase G completion.
**Actual:** The initial `/eval-compare` implementation compiled into `dist/`, but source verification exposed a TypeScript error caused by casting `RunSummary` to `Record<string, unknown>` when reading `thinking`.
**Why:** The comparison path needed backward compatibility for older result files, and the first implementation used an unsafe cast instead of typed access with fallback.
**Impact:** Minor delay only. Standard fix `G-02` corrected the issue before UNIFY completed; no scope increase beyond the planned feature.

### 2. Backward-compatible handling for older result files
**Plan said:** `thinking` should exist in results.
**Actual:** `/eval-compare` now also tolerates legacy result files without `thinking` by displaying `default`.
**Why:** Existing baseline/history files predate the new field.
**Impact:** Positive — older baselines remain usable in comparisons.

## Key Patterns/Decisions

| Decision | Rationale |
|----------|-----------|
| Persist `thinking` in `RunSummary` | Model comparisons are incomplete without the thinking level used for the run |
| Treat missing eval entries as display-only gaps (`—`, `+`, `−`) | Comparison should be resilient to changed eval inventories instead of failing hard |
| Use padded plain-text output for `/eval-compare` | pi notifications are terminal-oriented; deterministic formatting matters more than markdown aesthetics |
| Preserve backward compatibility for old result files | Existing `baseline.json` and earlier runs should remain comparable after schema evolution |

## Next Phase

**Phase H: Project Directory Support** — add `--project-dir`, launch pi against foreign project roots, and verify extension loading works outside the current repository.
