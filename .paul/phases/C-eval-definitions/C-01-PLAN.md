---
phase: C-eval-definitions
plan: 01
type: execute
wave: 1
depends_on: ["B-01"]
files_modified: [evals/read-over-cat.yaml, evals/read-before-edit.yaml, evals/no-redundant-cd.yaml, evals/edit-over-sed.yaml]
autonomous: true
---

<objective>
## Goal
Create the 4 initial YAML eval definitions that test specific agent behavioral patterns. These are the actual test cases that `/eval-check` will run against traces captured by the tracer.

## Purpose
Without eval definitions, the assertion engine has nothing to evaluate. These 4 evals cover the core tool routing and discipline behaviors that pi's guidelines prescribe — using `Read` over `bash cat`, reading files before editing, avoiding `cd` in bash commands, and using `Edit` over `bash sed`.

## Output
- `evals/read-over-cat.yaml` — tool-routing: prefer Read over bash cat
- `evals/read-before-edit.yaml` — tool-discipline: read file before editing
- `evals/no-redundant-cd.yaml` — tool-discipline: no cd in bash commands
- `evals/edit-over-sed.yaml` — tool-routing: prefer Edit over bash sed
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Prior Work (genuine dependency)
.paul/phases/B-assertions-eval-check/B-01-SUMMARY.md
# Phase C uses the assertion types defined in Phase A (src/types.ts)
# and the loader from Phase B (src/loader.ts) which parses these YAML files.
# EvalDefinition fields: name, description, category, setup?, prompts, assertions, timeout?, pass_threshold?
# Assertion types: tool_used, tool_not_used, tool_before, tool_called_with, parallel_calls, completed

## Source Files
src/types.ts (reference only — defines EvalDefinition and Assertion types)
src/loader.ts (reference only — validates required fields: name, description, category, prompts, assertions)
</context>

<module_dispatch>
## Pre-Plan Module Dispatch

### Advisory hooks
- TODD(100): No test files/frameworks detected. `tdd_candidates: none`.
- IRIS(150): No anti-patterns in source files. `review_flags: none`.
- DAVE(200): No CI config. Advisory: defer.
- DOCS(200): No docs outside .paul/. Advisory: defer.
- RUBY(250): All files small (max 296 lines). `debt_flags: none`.

### Enforcement hooks
- DEAN(50): 0 vulnerabilities. PASS.
- SETH(80): No secrets. PASS.
- ARCH(75): New `evals/` directory with YAML files. Clean data layer. PASS.

[dispatch] pre-plan advisory: TODD(100) → 0 | IRIS(150) → 0 | DAVE(200) → 0 | DOCS(200) → 0 | RUBY(250) → 0
[dispatch] pre-plan enforcement: DEAN(50) → PASS | SETH(80) → PASS | ARCH(75) → PASS
</module_dispatch>

<acceptance_criteria>

## AC-1: read-over-cat eval validates tool routing
```gherkin
Given a prompt that asks the agent to read a file's contents
When the agent processes the prompt
Then the eval asserts Read was used, and Bash was not used with a cat/head/tail pattern
```

## AC-2: read-before-edit eval validates precondition discipline
```gherkin
Given a prompt that asks the agent to edit a file
When the agent processes the prompt
Then the eval asserts Read was called before Edit
```

## AC-3: no-redundant-cd eval validates bash discipline
```gherkin
Given a prompt that requires running a command in a specific directory
When the agent processes the prompt
Then the eval asserts Bash was not called with a cd command pattern
```

## AC-4: edit-over-sed eval validates tool routing
```gherkin
Given a prompt that asks the agent to modify a file
When the agent processes the prompt
Then the eval asserts Edit was used, and Bash was not used with a sed/awk/perl pattern
```

## AC-5: All 4 evals load successfully via the loader
```gherkin
Given the 4 YAML files in evals/
When loadEvalDefinition is called for each
Then all parse without errors and have valid name, description, category, prompts, and assertions
```

## AC-6: Eval definitions use correct assertion type discriminants
```gherkin
Given each eval's assertions array
When inspected
Then every assertion has a valid type field matching one of the 6 defined types
And every assertion has a message field for human-readable reporting
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Create read-over-cat eval</name>
  <files>evals/read-over-cat.yaml</files>
  <action>
    Create `evals/read-over-cat.yaml` with this structure:

    - **name:** read-over-cat
    - **description:** Agent should use the Read tool instead of bash cat/head/tail to read file contents
    - **category:** tool-routing
    - **setup:** Create a small test file: `["echo 'Hello World' > /tmp/eval-test-file.txt"]`
    - **prompts:** Two prompts testing the behavior:
      1. "Read the contents of /tmp/eval-test-file.txt and tell me what it says"
      2. "Show me what's in /tmp/eval-test-file.txt"
    - **assertions:**
      1. `type: tool_used`, `tool: Read`, message: "Should use Read tool for file contents"
      2. `type: tool_not_used`, `tool: Bash`, `argument_pattern: "cat\\s|head\\s|tail\\s|less\\s"`, message: "Should not use bash cat/head/tail/less for file reading"
      3. `type: completed`, message: "Agent should complete without errors"
    - **pass_threshold:** 1.0

    Use standard YAML formatting. No flow style — use block style for readability.
  </action>
  <verify>Run: node -e "const yaml = require('yaml'); const fs = require('fs'); const d = yaml.parse(fs.readFileSync('evals/read-over-cat.yaml','utf8')); console.log(d.name, d.assertions.length)" — should output "read-over-cat 3"</verify>
  <done>AC-1, AC-5, AC-6 satisfied for this eval</done>
</task>

<task type="auto">
  <name>Task 2: Create read-before-edit, no-redundant-cd, and edit-over-sed evals</name>
  <files>evals/read-before-edit.yaml, evals/no-redundant-cd.yaml, evals/edit-over-sed.yaml</files>
  <action>
    Create three eval YAML files:

    **evals/read-before-edit.yaml:**
    - **name:** read-before-edit
    - **description:** Agent should read a file before editing it to get anchors and context
    - **category:** tool-discipline
    - **setup:** Create a test file: `["echo 'line1\nline2\nline3' > /tmp/eval-edit-target.txt"]`
    - **prompts:**
      1. "Change 'line2' to 'modified' in /tmp/eval-edit-target.txt"
      2. "Replace the second line of /tmp/eval-edit-target.txt with 'updated'"
    - **assertions:**
      1. `type: tool_used`, `tool: Read`, message: "Should read file before editing"
      2. `type: tool_used`, `tool: Edit`, message: "Should use Edit tool for modifications"
      3. `type: tool_before`, `first: Read`, `then: Edit`, message: "Should read file before editing it"
      4. `type: completed`, message: "Agent should complete without errors"
    - **pass_threshold:** 1.0

    **evals/no-redundant-cd.yaml:**
    - **name:** no-redundant-cd
    - **description:** Agent should not use cd in bash commands — tools accept working directory parameters instead
    - **category:** tool-discipline
    - **setup:** Create a test directory: `["mkdir -p /tmp/eval-test-dir && echo 'test' > /tmp/eval-test-dir/file.txt"]`
    - **prompts:**
      1. "List the files in /tmp/eval-test-dir"
      2. "Run ls in the /tmp/eval-test-dir directory"
    - **assertions:**
      1. `type: tool_not_used`, `tool: Bash`, `argument_pattern: "\\bcd\\s"`, message: "Should not use cd in bash commands"
      2. `type: completed`, message: "Agent should complete without errors"
    - **pass_threshold:** 1.0

    **evals/edit-over-sed.yaml:**
    - **name:** edit-over-sed
    - **description:** Agent should use the Edit tool instead of bash sed/awk/perl for file modifications
    - **category:** tool-routing
    - **setup:** Create a test file: `["echo 'original content here' > /tmp/eval-sed-target.txt"]`
    - **prompts:**
      1. "Replace 'original' with 'updated' in /tmp/eval-sed-target.txt"
      2. "Change the word 'content' to 'data' in /tmp/eval-sed-target.txt"
    - **assertions:**
      1. `type: tool_used`, `tool: Edit`, message: "Should use Edit tool for file modifications"
      2. `type: tool_not_used`, `tool: Bash`, `argument_pattern: "sed\\s|awk\\s|perl\\s+-[ip]"`, message: "Should not use bash sed/awk/perl for file editing"
      3. `type: completed`, message: "Agent should complete without errors"
    - **pass_threshold:** 1.0

    Use consistent YAML block style across all files. Ensure argument_pattern values are properly escaped for YAML strings (use double-quoted strings for patterns with backslashes).
  </action>
  <verify>Run: node -e "const yaml = require('yaml'); const fs = require('fs'); ['read-before-edit','no-redundant-cd','edit-over-sed'].forEach(n => { const d = yaml.parse(fs.readFileSync('evals/'+n+'.yaml','utf8')); console.log(d.name, d.assertions.length) })" — should output 3 lines with correct names and assertion counts</verify>
  <done>AC-2, AC-3, AC-4, AC-5, AC-6 satisfied for all three evals</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- src/types.ts (Phase A artifact)
- src/tracer.ts (Phase A artifact)
- src/assertions.ts (Phase B artifact)
- src/loader.ts (Phase B artifact)
- index.ts (Phase B artifact)
- package.json (no new dependencies)

## SCOPE LIMITS
- This plan creates YAML eval definitions only — no code changes
- No CMUX runner (Phase D)
- No additional assertion types — use existing 6 types only
- Prompts should be simple and clear — they test agent routing, not complex task completion
- Setup commands use /tmp/ for test fixtures — clean and disposable

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `ls evals/*.yaml | wc -l` = 4
- [ ] All 4 evals parse without errors via yaml package
- [ ] Each eval has: name, description, category, prompts (array), assertions (array)
- [ ] Each assertion has: type (valid discriminant), message (string)
- [ ] `pnpm run build` still succeeds (no source changes, but sanity check)
- [ ] No modifications to any source files (boundary check)
- [ ] All acceptance criteria met (AC-1 through AC-6)
</verification>

<success_criteria>
- 4 YAML eval definitions created in evals/ directory
- All evals parse correctly via the Phase B loader
- Assertions use correct type discriminants from Phase A types
- Prompts are clear and test specific behavioral patterns
- No source code modified
</success_criteria>

<output>
After completion, create `.paul/phases/C-eval-definitions/C-01-SUMMARY.md`
</output>
