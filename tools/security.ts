import fs from "node:fs";
import path from "node:path";
import { Boundary } from "../core/boundary.ts";
import { ToolResult, makeResult } from "../core/result.ts";

interface SinkPattern {
  category: string;
  severity: string;
  re: RegExp;
}

const SINKS: SinkPattern[] = [
  {
    category: "command-injection",
    severity: "critical",
    re: /(?:exec|execSync|spawn(?:Sync)?)\s*\(\s*(?!['"`][^'"`]*['"`])[^,\n]+/g,
  },
  { category: "eval",            severity: "high",     re: /\beval\s*\(|new\s+Function\s*\(/g },
  { category: "ssrf",            severity: "high",     re: /(axios(\.\w+)?\(|fetch\(|got\(|node-fetch)/g },
  { category: "xss",             severity: "high",     re: /dangerouslySetInnerHTML|innerHTML\s*=/g },
  { category: "deserialization", severity: "high",     re: /pickle\.loads|yaml\.load\((?![^)]*Loader)/g },
  { category: "path-traversal",  severity: "high",     re: /\.\.[\/\\]/g },
];

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "venv", ".venv"]);
const MAX_FILE = 512 * 1024;

export interface SinkFinding {
  file: string;
  line: number;
  category: string;
  severity: string;
  snippet: string;
}

export async function scanSecuritySinks(
  b: Boundary,
): Promise<ToolResult<SinkFinding[]>> {
  const r = makeResult<SinkFinding[]>("security", "scan-sinks");
  const findings: SinkFinding[] = [];

  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name));
        continue;
      }
      if (!e.isFile()) continue;
      const fp = path.join(dir, e.name);
      const st = fs.statSync(fp);
      if (st.size > MAX_FILE) continue;
      let text: string;
      try {
        text = fs.readFileSync(fp, "utf8");
      } catch {
        continue;
      }
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        for (const sink of SINKS) {
          // Reset lastIndex for global regexes before each test
          sink.re.lastIndex = 0;
          if (sink.re.test(line)) {
            findings.push({
              file: path.relative(b.root, fp),
              line: i + 1,
              category: sink.category,
              severity: sink.severity,
              snippet: line.trim().slice(0, 120),
            });
          }
          sink.re.lastIndex = 0;
        }
      });
    }
  };

  try {
    b.verifyNoSymlinkEscape(".");
    walk(b.root);
    r.result = findings;
    r.status = "success";
    r.limitations.push(
      "Findings are needs_verification until an exploit path (user-input → sink) is traced by a human reviewer.",
    );
    r.evidence.push({
      kind: "observation",
      description: "security-sink pattern scan",
      data: `${findings.length} candidate(s) across ${SINKS.length} sink categories`,
      timestamp: r.timestamp,
    });
  } catch (e) {
    r.status = "failed";
    r.stderr = String(e);
  }

  return r;
}
