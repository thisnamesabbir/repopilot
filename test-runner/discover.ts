import fs from "node:fs";
import path from "node:path";

export interface DetectedTestCommand {
  framework: string;
  argv: string[];        // executed with shell:false
  source: string;        // where this was discovered (evidence)
}

function readJson(p: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function fileExists(root: string, pattern: RegExp): boolean {
  return fs.readdirSync(root, { withFileTypes: true }).some((e) => pattern.test(e.name));
}

/**
 * Priority order (all evidence-backed):
 *   1. package.json "scripts.test"  (project-defined, preferred)
 *   2. framework-specific config files with npx fallback
 *   3. pytest / go / cargo project markers
 * No match ⇒ empty array ⇒ caller reports NOT VERIFIED.
 */
export function detectTestCommands(root: string): DetectedTestCommand[] {
  const found: DetectedTestCommand[] = [];

  // 1) Node project scripts — the project's own declaration wins
  const pkg = readJson(path.join(root, "package.json"));
  if (pkg && typeof pkg.scripts === "object" && pkg.scripts !== null) {
    const scripts = pkg.scripts as Record<string, string>;
    const t = scripts.test?.trim();
    if (t && t !== 'echo "Error: no test specified" && exit 1') {
      found.push({
        framework: /jest/.test(t) ? "jest" : /vitest/.test(t) ? "vitest" : "npm-script",
        // npm run test is tool-agnostic and invokes whatever the project declares
        argv: ["npm", "run", "test", "--silent"],
        source: `package.json scripts.test = "${t}"`,
      });
    }
  }

  // 2) JS framework configs — only if no package.json test script was found
  if (!found.length) {
    if (fileExists(root, /^(vitest|vite)\.config\.[cm]?[jt]s$/)) {
      found.push({
        framework: "vitest",
        argv: ["npx", "vitest", "run"],
        source: "vitest.config.* present",
      });
    } else if (fileExists(root, /^jest\.config\.[cm]?[jt]s$|^babel\.config\.[cm]?[jt]s$/)) {
      found.push({
        framework: "jest",
        argv: ["npx", "jest"],
        source: "jest/babel config present",
      });
    }
  }

  // 3) Python / Go / Rust project markers
  if (
    fs.existsSync(path.join(root, "pytest.ini")) ||
    fileExists(root, /^(pyproject|setup)\.toml$/) ||
    fs.existsSync(path.join(root, "conftest.py"))
  ) {
    found.push({
      framework: "pytest",
      argv: ["python", "-m", "pytest", "-q"],
      source: "pytest project marker",
    });
  }
  if (fs.existsSync(path.join(root, "go.mod"))) {
    found.push({ framework: "go", argv: ["go", "test", "./..."], source: "go.mod present" });
  }
  if (fs.existsSync(path.join(root, "Cargo.toml"))) {
    found.push({ framework: "cargo", argv: ["cargo", "test", "--quiet"], source: "Cargo.toml present" });
  }

  return found;
}
