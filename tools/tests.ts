import { Boundary } from "../core/boundary.ts";
import { ToolResult, makeResult } from "../core/result.ts";
import { executeTests } from "../test-runner/index.ts";
import type { TestRunResult } from "../test-runner/types.ts";

/**
 * Thin adapter: delegates all discovery, execution, parsing, and evidence
 * collection to test-runner/index.ts, then maps the richer TestRunResult
 * back onto the ToolResult shape used by the rest of the pipeline.
 */
export async function runTests(b: Boundary): Promise<ToolResult<TestRunResult>> {
  const r = makeResult("tests", "run-test-suite") as ToolResult<TestRunResult>;

  const testResult = await executeTests(b.root);

  r.result       = testResult;
  r.exitCode     = testResult.exitCode;
  r.stdout       = testResult.rawOutput;
  r.limitations  = testResult.limitations;
  r.evidence     = testResult.evidence.map((e) => ({
    kind:        e.kind === "config" ? "observation" : e.kind,
    description: e.description,
    data:        e.data,
    timestamp:   e.timestamp,
  })) as ToolResult["evidence"];

  // Map TestStatus → ToolStatus
  switch (testResult.status) {
    case "passed":
      r.status = "success";
      break;
    case "failed":
      r.status = "failed";
      break;
    case "not_verified":
    case "unable_to_determine":
      r.status = "not_verified";
      if (testResult.status === "unable_to_determine") {
        r.limitations.push("Test counts could not be parsed; mark as not_verified pending human review.");
      }
      break;
    case "skipped":
      r.status = "skipped";
      break;
  }

  return r;
}
