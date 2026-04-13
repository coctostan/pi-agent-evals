---
phase: A-tracer-types
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [package.json, tsconfig.json, src/types.ts, src/tracer.ts, index.ts]
autonomous: true
---

<objective>
## Goal
Scaffold the pi-agent-evals extension project and implement the tracer that captures every tool call in a session, writing a structured trace to `.pi/eval-trace.json` on agent_end.

## Purpose
The tracer is the foundation of the entire eval system. Without tool call capture, no assertions can be validated. This phase delivers the core data collection layer that all subsequent phases depend on.

## Output
- `package.json` — extension manifest with dependencies
- `tsconfig.json` — TypeScript configuration
- `src/types.ts` — ToolTraceEntry, EvalTrace, EvalDefinition, Assertion type definitions
- `src/tracer.ts` — Tracer class capturing tool_execution_start/tool_execution_end/turn_start/agent_end events
- `index.ts` — Extension entry point registering tracer hooks + `/eval-trace` debug command
</objective>

<context>
## Project Context
.paul/PROJECT.md
.paul/ROADMAP.md
.paul/STATE.md

## Source Files
~/pi/workspace/thinkingSpace/plans/pi-agent-evals-build-plan.md (architecture reference)

## API Reference
Pi extension API: ExtensionAPI, ExtensionFactory, ToolExecutionStartEvent, ToolExecutionEndEvent, TurnStartEvent, AgentEndEvent

Event execution order (confirmed from pi source):
```
agent_start
  turn_start                    ← turnIndex, timestamp
    tool_execution_start        ← toolCallId, toolName, args (raw LLM args, passive/observational)
    tool_call                   ← extension hook, can BLOCK/MUTATE (NOT used by tracer)
    [actual tool execution]
    tool_result                 ← extension hook, can MODIFY result (NOT used by tracer)
    tool_execution_end          ← toolCallId, toolName, result, isError (passive/observational)
  turn_end
agent_end                       ← fires on normal, error, AND abort
```

Design decision: Use `tool_execution_start`/`tool_execution_end` (passive) instead of `tool_call`/`tool_result` (interceptive).
Rationale: Zero risk of interfering with execution; records all calls including blocked ones.

- `pi.on("tool_execution_start", handler)` — fires when tool execution begins, provides toolCallId, toolName, args
- `pi.on("tool_execution_end", handler)` — fires when tool execution ends, provides toolCallId, toolName, result, isError
- `pi.on("turn_start", handler)` — provides turnIndex, timestamp
- `pi.on("agent_start", handler)` — fires at start of agent loop (used to clear trace)
- `pi.on("agent_end", handler)` — fires when agent loop ends (all cases: normal, error, abort)
- `pi.registerCommand(name, { description, handler })` — register slash commands
- Extension entry: `export default (pi: ExtensionAPI) => void`
- Extension discovery: loaded via `.pi/settings.json` packages array
</context>

<module_dispatch>
## Pre-Plan Module Dispatch
[dispatch] pre-plan advisory: TODD(100) → 0 inject (no test files/frameworks) | IRIS(150) → skip (no source files) | DAVE(200) → 0 inject (no CI config — suggest adding later) | DOCS(200) → 0 inject (no source docs yet) | RUBY(250) → skip (no source files)
[dispatch] pre-plan enforcement: DEAN(50) → skip (no package.json — no audit possible) | SETH(80) → skip (no source files) | ARCH(75) → skip (no source directories)

No blockers. Greenfield project — all modules will engage meaningfully after this phase creates the first source files.
</module_dispatch>

<acceptance_criteria>

## AC-1: Extension loads in pi
```gherkin
Given the extension is built and installed
When pi starts a session with this extension enabled
Then the extension loads without errors and the /eval-trace command is available
```

## AC-2: Tool calls are captured in trace
```gherkin
Given the extension is loaded in a pi session
When the agent executes tool calls (e.g., Read, Bash, Edit)
Then each tool call is recorded as a ToolTraceEntry with toolName, arguments, turnIndex, callIndex, and timestamp
```

## AC-3: Tool results update trace entries
```gherkin
Given tool calls have been captured
When a tool_execution_end event fires
Then the corresponding trace entry's isError field is updated based on the result
```

## AC-4: Trace file written on agent_end
```gherkin
Given tool calls have been captured during an agent loop
When the agent_end event fires
Then a valid JSON file is written to .pi/eval-trace.json containing the full EvalTrace structure
```

## AC-5: /eval-trace command dumps current trace
```gherkin
Given tool calls have been captured
When the user runs /eval-trace
Then the current in-memory trace is displayed as formatted JSON via ctx.ui.notify()
```

</acceptance_criteria>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold project structure</name>
  <files>package.json, tsconfig.json</files>
  <action>
    Create package.json with:
    - name: "pi-agent-evals"
    - version: "0.1.0"
    - type: "module"
    - main: "dist/index.js"
    - types: "dist/index.d.ts"
    - pi extension config: `"pi": { "extensions": ["dist/index.js"] }`
    - scripts: build (tsc), dev (tsc --watch), clean (rm -rf dist)
    - bin: { "pi-eval": "./dist/src/runner/cli.js" } (placeholder for Phase D)
    - peerDependencies: @mariozechner/pi-coding-agent, @sinclair/typebox
    - dependencies: yaml
    - devDependencies: typescript, @types/node

    Create tsconfig.json with:
    - target: ES2022, module: Node16, moduleResolution: Node16
    - outDir: dist, rootDir: .
    - declaration: true, strict: true, esModuleInterop: true
    - include: ["index.ts", "src/**/*.ts"]

    Run `pnpm install` to install dependencies.

    Avoid: Adding unnecessary dependencies. Do NOT add a test framework yet (Phase B scope).
  </action>
  <verify>
    Run `pnpm run build` — should compile without errors (even if no source files yet, create empty placeholders if needed, or verify after Task 2/3).
  </verify>
  <done>AC-1 partially satisfied: project compiles</done>
</task>

<task type="auto">
  <name>Task 2: Implement type definitions and tracer</name>
  <files>src/types.ts, src/tracer.ts</files>
  <action>
    **src/types.ts** — Define all types for the eval system:
    `ToolTraceEntry` interface:
    - toolName: string
    - arguments: Record<string, unknown>
    - turnIndex: number
    - callIndex: number (position within the turn)
    - timestamp: number
    - isError: boolean
    - parallelGroup?: string (shared ID when multiple calls in same turn)

    `EvalTrace` interface:
    - sessionId: string
    - model: string
    - extensions: string[]
    - cwd: string
    - startedAt: string (ISO timestamp)
    - entries: ToolTraceEntry[]

    `EvalDefinition` interface:
    - name: string
    - description: string
    - category: string
    - setup?: string[] (shell commands before prompt)
    - prompts: string[]
    - assertions: Assertion[]
    - timeout?: number
    - pass_threshold?: number (default 1.0)

    `Assertion` type (discriminated union):
    - { type: "tool_used"; tool: string; message: string }
    - { type: "tool_not_used"; tool: string; argument_pattern?: string; message: string }
    - { type: "tool_before"; first: string; then: string; message: string }
    - { type: "tool_called_with"; tool: string; argument_pattern: string; message: string }
    - { type: "parallel_calls"; min_parallel: number; message: string }
    - { type: "completed"; message: string }
    Note: `tool_not_used` uses optional `argument_pattern` instead of two separate variants
    (single discriminant value, optional field pattern).

    `AssertionResult` interface:
    - pass: boolean
    - assertion: Assertion
    - detail: string

    Export all types.

    **src/tracer.ts** — Implement the Tracer class:
    - Private state: entries (ToolTraceEntry[]), currentTurnIndex (number), callCountInTurn (number), pendingCalls (Map<string, number> mapping toolCallId to entry index), startedAt (string)
    - `onAgentStart()`: clear entries, pendingCalls, reset counters, set startedAt = new Date().toISOString(). This ensures each agent loop produces a clean trace.
    - `onTurnStart(turnIndex: number)`: set currentTurnIndex, reset callCountInTurn to 0
    - `onToolExecutionStart(toolCallId: string, toolName: string, args: Record<string, unknown>)`:
      - Create ToolTraceEntry with toolName, args, currentTurnIndex, callCountInTurn, Date.now(), isError: false
      - Detect parallel group: if callCountInTurn > 0, assign parallelGroup = `turn-${currentTurnIndex}`
        (also retroactively tag the first call in this turn with the same parallelGroup)
      - Increment callCountInTurn
      - Push to entries, store index in pendingCalls map keyed by toolCallId
    - `onToolExecutionEnd(toolCallId: string, isError: boolean)`:
      - Look up entry index from pendingCalls, update isError, remove from pendingCalls
    - `getTrace(ctx: ExtensionContext): EvalTrace`:
      - Build EvalTrace with sessionId from cwd basename, model from ctx.model?.name ?? "unknown", extensions: [], cwd: ctx.cwd, startedAt, entries
    - `clearTrace()`: reset entries, pendingCalls, counters
    - `async writeTrace(ctx: ExtensionContext, outputPath?: string)`:
      - Default path: path.join(ctx.cwd, ".pi", "eval-trace.json")
      - Ensure .pi directory exists: await fs.mkdir(path.dirname(outputPath), { recursive: true })
      - Write using async fs.writeFile (not writeFileSync — avoid blocking the event loop in extension hooks)
      - Write JSON.stringify(getTrace(ctx), null, 2)
    Import ExtensionContext type from @mariozechner/pi-coding-agent for type safety.
    Use fs/promises for async file operations.

    Avoid: Making the tracer depend on any pi runtime beyond the type imports. Keep it a pure data collector. No crypto dependency — argumentsHash dropped (stringified args suffice for Phase B assertion matching).
  </action>
  <verify>Run `pnpm run build` — src/types.ts and src/tracer.ts compile without errors</verify>
  <done>AC-2, AC-3, AC-4 implementation complete (runtime verification in Task 3)</done>
</task>

<task type="auto">
  <name>Task 3: Extension entry point with hook registration</name>
  <files>index.ts</files>
  <action>
    **index.ts** — Extension entry point:

    Import Tracer from src/tracer.ts.
    Import ExtensionAPI type from @mariozechner/pi-coding-agent.

    Default export: `(pi: ExtensionAPI) => void`

    Create a Tracer instance.

    Register event hooks:
    - `pi.on("agent_start", () => tracer.onAgentStart())` — clear trace for new agent loop
    - `pi.on("turn_start", (event) => tracer.onTurnStart(event.turnIndex))`
    - `pi.on("tool_execution_start", (event) => tracer.onToolExecutionStart(event.toolCallId, event.toolName, event.args as Record<string, unknown>))`
    - `pi.on("tool_execution_end", (event) => tracer.onToolExecutionEnd(event.toolCallId, event.isError))`
    - `pi.on("agent_end", async (event, ctx) => { await tracer.writeTrace(ctx); })` — writes .pi/eval-trace.json

    Register commands:
    - `/eval-trace`: dumps current in-memory trace as formatted JSON
      ```
      pi.registerCommand("eval-trace", {
        description: "Dump current session trace for debugging",
        handler: async (args, ctx) => {
          const trace = tracer.getTrace(ctx);
          ctx.ui.notify(JSON.stringify(trace, null, 2), "info");
        }
      });
      ```

    Export the Tracer class and types for external use (Phase B will import them).

    Avoid: Registering /eval-check here — that's Phase B scope. Do NOT add complex error handling yet; keep the entry point minimal.
  </action>
  <verify>
    1. Run `pnpm run build` — compiles without errors
    2. Verify the dist/ output contains index.js, src/types.js, src/tracer.js
    3. Verify package.json pi.extensions points to dist/index.js
  </verify>
  <done>AC-1 satisfied: extension compiles and entry point is configured. AC-5 satisfied: /eval-trace command registered. AC-2, AC-3, AC-4 wired via hooks.</done>
</task>

</tasks>

<boundaries>

## DO NOT CHANGE
- .paul/* files (managed by PALS lifecycle)
- .gitignore (already configured)
- AGENTS.md (already configured)

## SCOPE LIMITS
- Do NOT implement the assertion engine (/eval-check command) — Phase B
- Do NOT create eval YAML definitions — Phase C
- Do NOT implement CMUX runner — Phase D
- Do NOT add test framework or tests yet — Phase B will determine test strategy
- Do NOT add CI/CD configuration — defer to later

</boundaries>

<verification>
Before declaring plan complete:
- [ ] `pnpm run build` compiles without errors
- [ ] `dist/index.js` exists and exports the extension factory
- [ ] `dist/src/types.js` and `dist/src/tracer.js` exist
- [ ] All type definitions are exported from src/types.ts
- [ ] Tracer class has onAgentStart, onTurnStart, onToolExecutionStart, onToolExecutionEnd, getTrace, clearTrace, writeTrace methods
- [ ] Extension registers tool_execution_start, tool_execution_end, turn_start, agent_start, agent_end hooks
- [ ] /eval-trace command is registered
- [ ] All acceptance criteria met
</verification>

<success_criteria>
- All tasks completed
- All verification checks pass
- No TypeScript errors or warnings
- Extension structure matches pi extension conventions (default export, pi.extensions config)
- Types are comprehensive enough for Phase B assertion engine
</success_criteria>

<output>
After completion, create `.paul/phases/A-tracer-types/A-01-SUMMARY.md`
</output>
