export type ToolStatus = "success" | "failed" | "not_verified" | "skipped";

export interface Evidence {
  kind: "command" | "file" | "observation";
  description: string;
  data: string;            // redacted output
  timestamp: string;
}

export interface ToolResult<T = unknown> {
  status: ToolStatus;
  tool: string;
  operation: string;
  timestamp: string;
  exitCode: number | null;
  stdout: string | null;
  stderr: string | null;
  result?: T;
  evidence: Evidence[];
  limitations: string[];
}

export function makeResult<T = unknown>(tool: string, operation: string): ToolResult<T> {
  return {
    status: "not_verified",
    tool,
    operation,
    timestamp: new Date().toISOString(),
    exitCode: null,
    stdout: null,
    stderr: null,
    evidence: [],
    limitations: [],
  };
}

export const NOT_VERIFIED = { status: "not_verified" as const };
