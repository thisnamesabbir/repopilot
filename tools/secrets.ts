import fs from "node:fs";
import path from "node:path";
import { Boundary } from "../core/boundary.ts";
import { ToolResult, makeResult } from "../core/result.ts";

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "OpenAI key",         re: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "Anthropic key",      re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "GitHub token",       re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: "AWS access key",     re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key",        re: /-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----/ },
  {
    name: "Generic assignment",
    re: /\b(api[_-]?key|secret|password|token)\b\s*[:=]\s*["'][^"']{12,}["']/i,
  },
];

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "venv", ".venv"]);
const MAX_FILE = 512 * 1024;

export interface SecretFinding {
  file: string;
  line: number;
  kind: string;
}

export async function scanSecrets(
  b: Boundary,
): Promise<ToolResult<SecretFinding[]>> {
  const r = makeResult<SecretFinding[]>("secrets", "scan-repository");
  const findings: SecretFinding[] = [];

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
        // binary or unreadable — skip
        continue;
      }
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        for (const p of PATTERNS) {
          if (p.re.test(line)) {
            findings.push({ file: path.relative(b.root, fp), line: i + 1, kind: p.name });
          }
        }
      });
    }
  };

  try {
    b.verifyNoSymlinkEscape(".");
    walk(b.root);
    r.result = findings;
    // status "success" means the scan ran; findings may be empty — candidates require human review
    r.status = "success";
    r.evidence.push({
      kind: "observation",
      description: "secret-pattern scan",
      data: `${findings.length} candidate(s)`,
      timestamp: r.timestamp,
    });
  } catch (e) {
    r.status = "failed";
    r.stderr = String(e);
  }

  return r;
}
