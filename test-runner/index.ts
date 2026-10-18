import path from "node:path";
import { TestRunResult, emptyResult, EvidenceEntry } from "./types.ts";
import { detectTestCommands } from "./discover.ts";
import { execCapped } from "./run.ts";
import { parseCounts } from "./parse.ts";

const now = () => new Date().toISOString();

const REDACT_PATTERNS: Array<[RegExp, string]> = [
  [/(sk-[A-Za-z0-9_-]{12})[A-Za-z0-9_-]*/g,                                        "$1***REDACTED***"],
  [/(ghp_|gho_|ghs_|AKIA)[A-Za-z0-9]{6,}/g,                                         "$1***REDACTED***"],
  [/(-----BEGIN [A-Z ]*PRIVATE KEY-----)[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----)/g, "$1***REDACTED***$2"],
];

function redact(s: string): string {
  let out = s;
  for (const [re, replacement] of REDACT_PATTERNS) out = out.replace(re, replacement);
  return out;
}

function evidence(
  kind: EvidenceEntry["kind"],
  description: string,
  data: string,
): EvidenceEntry {
  return { kind, description, data, timestamp: now() };
}

/**
 * Full test-execution pipeline:
 *   1. Detect a real test command from project config (never invents commands).
 *   2. Execute it with shell:false inside root, with env allowlist and timeout.
 *   3. Parse real output for counts; returns nulls rather than guessing on unknown formats.
 *   4. Derives status from exit code AND parsed counts; conservative on mismatch.
 */
export async function executeTests(root: string): Promise<TestRunResult> {
  const result = emptyResult();
  root = path.resolve(root);

  // ── Detection ──────────────────────────────────────────────────────────────
  const candidates = detectTestCommands(root);
  if (!candidates.length) {
    result.limitations.push(
      "No test framework or test command discovered in project configuration.",
    );
    result.evidence.push(
      evidence(
        "observation",
        "framework detection",
        "package.json scripts.test: absent or placeholder; no jest/vitest/pytest/go/cargo markers found",
      ),
    );
    result.status = "not_verified";
    return result;
  }

  result.evidence.push(
    evidence(
      "config",
      "detected test command(s)",
      candidates.map((c) => `${c.framework} <- ${c.source} -> ${c.argv.join(" ")}`).join("\n"),
    ),
  );

  const chosen = candidates[0]; // project-defined script has highest priority
  result.framework = chosen.framework;
  result.command = chosen.argv.join(" ");

  // ── Execution ──────────────────────────────────────────────────────────────
  const outcome = await execCapped(root, chosen.argv);

  if (outcome.spawnError) {
    result.evidence.push(
      evidence("command", `attempted: ${result.command}`, `spawn failed: ${outcome.spawnError}`),
    );
    result.limitations.push(`Test runner binary could not be launched: ${outcome.spawnError}`);
    result.status = "not_verified";
    return result;
  }

  result.exitCode = outcome.exitCode;
  result.durationMs = outcome.durationMs;
  result.rawOutput = redact((outcome.stdout + "\n" + outcome.stderr).slice(0, 200_000));
  result.evidence.push(
    evidence(
      "command",
      `executed: ${result.command}`,
      `exit=${outcome.exitCode} duration=${outcome.durationMs}ms timedOut=${outcome.timedOut}`,
    ),
  );

  if (outcome.timedOut) {
    result.status = "failed";
    result.limitations.push("Test run killed after timeout; output may be truncated.");
    return result;
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  const counts = parseCounts(chosen.framework, outcome.stdout, outcome.stderr, outcome.exitCode);
  result.passed  = counts.passed;
  result.failed  = counts.failed;
  result.skipped = counts.skipped;

  if (counts.passed === null && counts.failed === null) {
    result.status = "unable_to_determine";
    result.limitations.push(
      `Process ran (exit=${outcome.exitCode}) but no known result-summary format was recognized. ` +
      `Review rawOutput manually; counts intentionally left null rather than inferred.`,
    );
    return result;
  }

  // Both exit code AND parsed counts must agree; mismatch stays "failed" (conservative)
  if (outcome.exitCode === 0 && (counts.failed ?? 0) === 0) {
    result.status = "passed";
  } else {
    result.status = "failed";
    if (outcome.exitCode === 0 && (counts.failed ?? 0) > 0) {
      result.limitations.push(
        `exitCode=0 but parsed failed=${counts.failed}; status kept as failed (conservative).`,
      );
    }
  }

  return result;
}
