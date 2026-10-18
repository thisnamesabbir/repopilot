import fs from "node:fs";
import path from "node:path";
import { Boundary } from "../core/boundary.ts";
import { ToolResult, makeResult } from "../core/result.ts";
import { run } from "../core/runner.ts";

interface LintRunner {
  name: string;
  binary: string;
  args: string[];
  /** Config file name that confirms the linter is configured. */
  configFile: string;
}

const LINT_RUNNERS: LintRunner[] = [
  {
    name: "eslint",
    binary: "npx",
    args: ["eslint", "."],
    configFile: ".eslintrc",
  },
  {
    name: "tsc",
    binary: "npx",
    args: ["tsc", "--noEmit"],
    configFile: "tsconfig.json",
  },
];

function isLinterPresent(b: Boundary, linter: LintRunner): boolean {
  const entries = fs.readdirSync(b.root, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.startsWith(linter.configFile)) return true;
  }
  return false;
}

export async function runLint(b: Boundary): Promise<ToolResult> {
  const r = makeResult("lint", "run-linters");

  const found = LINT_RUNNERS.filter((l) => isLinterPresent(b, l));
  if (found.length === 0) {
    r.status = "not_verified";
    r.limitations.push(
      "No lint configuration discovered (no .eslintrc or tsconfig.json found).",
    );
    return r;
  }

  // Run all discovered linters; aggregate failures
  let lastResult = r;
  for (const linter of found) {
    const res = await run(b, {
      tool: "lint",
      operation: `run-${linter.name}`,
      binary: linter.binary,
      args: linter.args,
    });
    lastResult = res;
    // Merge evidence and limitations into a single result
    r.evidence.push(...res.evidence);
    r.limitations.push(...res.limitations);
    if (res.status === "failed") {
      r.status = "failed";
      r.exitCode = res.exitCode;
      r.stdout = (r.stdout ?? "") + (res.stdout ?? "");
      r.stderr = (r.stderr ?? "") + (res.stderr ?? "");
    }
  }

  if (r.status !== "failed") {
    r.status = "success";
    r.stdout = lastResult.stdout;
    r.stderr = lastResult.stderr;
    r.exitCode = lastResult.exitCode;
  }

  return r;
}
