---
phase: G-matrix-execution-results
plan: 02
type: fix
wave: 1
depends_on: []
files_modified: [index.ts]
autonomous: true
---

<objective>
## Fix
Resolve the Phase G TypeScript build failure in `/eval-compare` caused by unsafe casting when reading `thinking` from parsed `RunSummary` data.
</objective>

<tasks>
<task type="auto">
  <name>Fix: remove unsafe `RunSummary` cast in /eval-compare labels</name>
  <files>index.ts</files>
  <action>
    Replace the `Record<string, unknown>` casts used to read `thinking` from parsed summaries with direct `RunSummary` property access and a runtime fallback for older result files missing the field.
  </action>
  <verify>pnpm run build succeeds with zero TypeScript errors.</verify>
  <done>Fix verified working</done>
</task>
</tasks>

<verification>
- [x] Fix applied and verified
- [x] No regressions introduced
</verification>
