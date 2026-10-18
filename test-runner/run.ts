import { spawn } from "node:child_process";

const TIMEOUT_MS = 300_000;
const MAX_OUTPUT_BYTES = 1_000_000;
const ENV_ALLOWLIST = ["PATH", "HOME", "LANG", "NODE_ENV", "CI"];

export interface ExecOutcome {
  argv: string[];
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  spawnError: string | null;
}

/**
 * Executes argv[0] with argv.slice(1) inside root.
 * Security properties:
 *   - shell: false — no shell metacharacter injection possible
 *   - env stripped to allowlist — secrets never reach test processes
 *   - cwd locked to project root
 *   - hard timeout with SIGKILL
 *   - output capped to prevent memory exhaustion
 */
export function execCapped(
  root: string,
  argv: string[],
  timeoutMs = TIMEOUT_MS,
): Promise<ExecOutcome> {
  const env: Record<string, string> = {};
  for (const k of ENV_ALLOWLIST) {
    if (process.env[k]) env[k] = process.env[k] as string;
  }

  return new Promise((resolve) => {
    const started = Date.now();
    let out = "";
    let err = "";
    let timedOut = false;

    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(argv[0], argv.slice(1), { cwd: root, env, shell: false });
    } catch (e) {
      return resolve({
        argv, exitCode: null, durationMs: 0,
        stdout: "", stderr: "", timedOut: false, spawnError: String(e),
      });
    }

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout?.on("data", (d: Buffer) => {
      if (out.length < MAX_OUTPUT_BYTES) out += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      if (err.length < MAX_OUTPUT_BYTES) err += d.toString();
    });
    child.on("error", (e: Error) => {
      clearTimeout(timer);
      resolve({
        argv, exitCode: null, durationMs: Date.now() - started,
        stdout: out, stderr: err, timedOut, spawnError: String(e),
      });
    });
    child.on("close", (code: number | null) => {
      clearTimeout(timer);
      resolve({
        argv, exitCode: code, durationMs: Date.now() - started,
        stdout: out, stderr: err, timedOut, spawnError: null,
      });
    });
  });
}
