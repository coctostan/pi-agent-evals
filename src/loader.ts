/**
 * Eval definition loader — parses YAML eval files into typed definitions.
 *
 * Reads eval definitions from the evals/ directory (or custom path),
 * validates required fields, and returns typed EvalDefinition objects.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { EvalDefinition } from "./types.js";

const KNOWN_ASSERTION_TYPES = [
  "tool_used",
  "tool_not_used",
  "tool_before",
  "tool_called_with",
  "parallel_calls",
  "completed",
] as const;

function validateAssertionShape(
  assertion: unknown,
  index: number,
  filePath: string,
): void {
  if (
    typeof assertion !== "object" ||
    assertion === null ||
    typeof (assertion as Record<string, unknown>).type !== "string"
  ) {
    throw new Error(
      `Eval definition ${filePath}: assertion[${index}]: must be an object with a string "type" field`,
    );
  }

  const a = assertion as Record<string, unknown>;
  const type = a.type as string;

  if (typeof a.message !== "string") {
    throw new Error(
      `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "message"`,
    );
  }

  switch (type) {
    case "tool_used":
      if (typeof a.tool !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "tool"`,
        );
      }
      break;

    case "tool_not_used":
      if (typeof a.tool !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "tool"`,
        );
      }
      if (a.argument_pattern !== undefined && typeof a.argument_pattern !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): "argument_pattern" must be a string if provided`,
        );
      }
      break;

    case "tool_before":
      if (typeof a.first !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "first"`,
        );
      }
      if (typeof a.then !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "then"`,
        );
      }
      break;

    case "tool_called_with":
      if (typeof a.tool !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "tool"`,
        );
      }
      if (typeof a.argument_pattern !== "string") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "argument_pattern"`,
        );
      }
      break;

    case "parallel_calls":
      if (typeof a.min_parallel !== "number") {
        throw new Error(
          `Eval definition ${filePath}: assertion[${index}] (type: "${type}"): missing required field "min_parallel"`,
        );
      }
      break;

    case "completed":
      break;

    default:
      // NOTE: Phase J will add tool_used_any, tool_no_errors, tool_preference.
      // When those are added, update this validation accordingly.
      throw new Error(
        `Eval definition ${filePath}: assertion[${index}]: unknown type "${type}". Available types: ${KNOWN_ASSERTION_TYPES.join(", ")}`,
      );
  }
}

const REQUIRED_FIELDS = [
  "name",
  "description",
  "category",
  "prompts",
  "assertions",
] as const;

/**
 * Load and parse a single eval definition from YAML.
 *
 * @param evalName - Name of the eval (without .yaml extension)
 * @param evalsDir - Directory containing eval YAML files (default: "evals")
 * @returns Parsed and validated EvalDefinition
 * @throws If file not found or required fields are missing
 */
export function loadEvalDefinition(
  evalName: string,
  evalsDir: string = "evals",
): EvalDefinition {
  const filePath = join(evalsDir, `${evalName}.yaml`);

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`Eval definition not found: ${filePath}`);
    }
    throw new Error(`Failed to read eval definition: ${filePath} — ${err}`);
  }

  let parsed: unknown;
  try {
    parsed = parse(content);
  } catch (err) {
    throw new Error(
      `Failed to parse YAML in ${filePath}: ${err instanceof Error ? err.message : err}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`Eval definition is not a valid object: ${filePath}`);
  }

  const obj = parsed as Record<string, unknown>;

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((field) => !(field in obj));
  if (missing.length > 0) {
    throw new Error(
      `Eval definition ${filePath} missing required fields: ${missing.join(", ")}`,
    );
  }

  // Validate field types
  if (!Array.isArray(obj.prompts)) {
    throw new Error(`Eval definition ${filePath}: "prompts" must be an array`);
  }
  if (!Array.isArray(obj.assertions)) {
    throw new Error(
      `Eval definition ${filePath}: "assertions" must be an array`,
    );
  }

  const assertions = obj.assertions as unknown[];
  for (let i = 0; i < assertions.length; i++) {
    validateAssertionShape(assertions[i], i, filePath);
  }
  return obj as unknown as EvalDefinition;
}

/**
 * List available eval definition names in a directory.
 *
 * @param evalsDir - Directory containing eval YAML files (default: "evals")
 * @returns Array of eval names (without .yaml extension)
 */
export function listEvalDefinitions(evalsDir: string = "evals"): string[] {
  let files: string[];
  try {
    files = readdirSync(evalsDir);
  } catch {
    return [];
  }

  return files
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
    .sort();
}
