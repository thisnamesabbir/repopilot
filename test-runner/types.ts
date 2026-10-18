export type TestStatus =
  | "passed"             // execution happened; all tests green
  | "failed"             // execution happened; one or more tests red
  | "skipped"            // execution happened; counts are all skipped
  | "not_verified"       // nothing executed
  | "unable_to_determine"; // executed but counts unparseable

export interface EvidenceEntry {
  kind: "command" | "config" | "output" | "observation";
  description: string;
  data: string;
  timestamp: string;
}

export interface TestRunResult {
  status: TestStatus;
  framework: string | null;
  command: string | null;        // exact argv as executed
  exitCode: number | null;
  durationMs: number | null;
  passed: number | null;
  failed: number | null;
  skipped: number | null;
  rawOutput: string | null;      // redacted, capped
  evidence: EvidenceEntry[];
  limitations: string[];
}

export function emptyResult(): TestRunResult {
  return {
    status: "not_verified",
    framework: null,
    command: null,
    exitCode: null,
    durationMs: null,
    passed: null,
    failed: null,
    skipped: null,
    rawOutput: null,
    evidence: [],
    limitations: [],
  };
}
