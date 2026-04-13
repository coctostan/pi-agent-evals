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
