import { spawn } from "node:child_process";
import { Boundary } from "./boundary.ts";
import { ToolResult, makeResult } from "./result.ts";

const TIMEOUT_MS = 120_000;
const MAX_OUTPUT = 1_000_000; // bytes

export interface RunSpec {
  tool: string;
  operation: string;
  binary: string;              // exact binary; never a shell string
  args: string[];
  cwd?: string;
  envAllowlist?: string[];     // e.g. ["PATH", "HOME", "NODE_ENV"]
}

/** Rejects commands containing destructive shell patterns. */
const DESTRUCTIVE =
  /\b(rm\s+-rf|mkfs|shutdown|reboot|git\s+push\s+--force|:\(\)\{.*\}\s*;|curl.*\|\s*(ba)?sh)\b/;

export async function run(b: Boundary, spec: RunSpec): Promise<ToolResult> {
  const r = makeResult(spec.tool, spec.operation);
  const cwd = spec.cwd ? b.resolve(spec.cwd) : b.root;

  const joined = `${spec.binary} ${spec.args.join(" ")}`;
  if (DESTRUCTIVE.test(joined)) {
    r.status = "failed";
    r.stderr = "Command rejected by destructive-pattern policy";
    return r;
  }

  const env: Record<string, string> = {};
  for (const k of spec.envAllowlist ?? ["PATH", "HOME", "LANG", "NODE_ENV"]) {
    if (process.env[k]) env[k] = process.env[k] as string; // secrets never inherited
  }

  return new Promise((resolve) => {
    const child = spawn(spec.binary, spec.args, {
      cwd,
      env,
      shell: false,
      timeout: TIMEOUT_MS,
    });

    let out = "";
    let err = "";

    child.stdout.on("data", (d: Buffer) => {
      if (out.length < MAX_OUTPUT) out += d;
    });
    child.stderr.on("data", (d: Buffer) => {
      if (err.length < MAX_OUTPUT) err += d;
    });

    child.on("error", (e: Error) => {
      r.status = "failed";
      r.stderr = String(e);
      resolve(r);
    });

    child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      r.exitCode = code;
      r.stdout = out;
      r.stderr = err;
      r.status = code === 0 ? "success" : "failed";
      if (signal) r.limitations.push(`Killed by signal ${signal} (likely timeout)`);
      r.evidence.push({
        kind: "command",
        description: joined,
        data: `${out}\n[exit=${code}]`,
        timestamp: r.timestamp,
      });
      resolve(r);
    });
  });
}
