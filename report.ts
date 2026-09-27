import { ToolResult, ToolStatus } from "./core/result.ts";

export interface ReportSection {
  title: string;
  content: string;
}

export interface AuditReport {
  generatedAt: string;
  sections: ReportSection[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: ToolStatus): string {
  const map: Record<ToolStatus, string> = {
    success:      "✔ SUCCESS",
    failed:       "✘ FAILED",
    not_verified: "— NOT VERIFIED",
    skipped:      "⊘ SKIPPED",
  };
  return map[s];
}

function resultRow(r: ToolResult): string {
  const lines: string[] = [];
  lines.push(`  • [${r.tool}/${r.operation}] ${statusLabel(r.status)}`);
  if (r.exitCode !== null) lines.push(`    exit-code: ${r.exitCode}`);
  if (r.limitations.length) lines.push(`    limitations: ${r.limitations.join("; ")}`);
  return lines.join("\n");
}

/**
 * Collects all ToolResults and emits the canonical 10-section audit report.
 * Every section is derived only from actual ToolResults — no fabricated defaults.
 */
export function generateReport(results: ToolResult[]): AuditReport {
  const generatedAt = new Date().toISOString();

  // ── 1. Executive Summary ──────────────────────────────────────────────────
  const total   = results.length;
  const success = results.filter((r) => r.status === "success").length;
  const failed  = results.filter((r) => r.status === "failed").length;
  const nv      = results.filter((r) => r.status === "not_verified").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  const execSummary =
    `Tools run: ${total} | Success: ${success} | Failed: ${failed} | ` +
    `Not Verified: ${nv} | Skipped: ${skipped}\n` +
    `Report generated: ${generatedAt}`;

  // ── 2. Actual Actions ─────────────────────────────────────────────────────
  const actionsContent = results.length
    ? results.map((r) => `  • ${r.tool}/${r.operation} at ${r.timestamp}`).join("\n")
    : "  (none)";

  // ── 3. Files Changed ─────────────────────────────────────────────────────
  const fileEvidence = results
    .flatMap((r) => r.evidence)
    .filter((e) => e.kind === "file");
  const filesContent = fileEvidence.length
    ? fileEvidence.map((e) => `  • ${e.description}: ${e.data}`).join("\n")
    : "  NOT VERIFIED — no file-change evidence recorded.";

  // ── 4. Tests Actually Executed ───────────────────────────────────────────
  const testResults = results.filter((r) => r.tool === "tests");
  const testsContent = testResults.length
    ? testResults.map(resultRow).join("\n")
    : "  NOT VERIFIED — test runner was not invoked or no test system was discovered.";

  // ── 5. Security Checks Actually Executed ─────────────────────────────────
  const secResults = results.filter(
    (r) => r.tool === "secrets" || r.tool === "security" || r.tool === "manifest",
  );
  const secContent = secResults.length
    ? secResults.map(resultRow).join("\n")
    : "  NOT VERIFIED — no security tools were executed.";

  // ── 6. Confirmed Findings ─────────────────────────────────────────────────
  const confirmed = results.filter((r) => r.status === "success" && r.result != null);
  const confirmedContent = confirmed.length
    ? confirmed
        .map((r) => {
          const items = Array.isArray(r.result) ? r.result : [r.result];
          return items
            .map((item) => `  • [${r.tool}] ${JSON.stringify(item)}`)
            .join("\n");
        })
        .join("\n")
    : "  None.";

  // ── 7. Needs Verification ─────────────────────────────────────────────────
  const nvResults = results.filter((r) => r.status === "not_verified");
  const nvContent = nvResults.length
    ? nvResults.map(resultRow).join("\n")
    : "  None — all executed tools returned a definitive status.";

  // ── 8. Failures ──────────────────────────────────────────────────────────
  const failedResults = results.filter((r) => r.status === "failed");
  const failuresContent = failedResults.length
    ? failedResults
        .map((r) => {
          const lines = [resultRow(r)];
          if (r.stderr) lines.push(`    stderr: ${r.stderr.slice(0, 300)}`);
          return lines.join("\n");
        })
        .join("\n")
    : "  None.";

  // ── 9. Limitations ───────────────────────────────────────────────────────
  const allLimitations = results.flatMap((r) =>
    r.limitations.map((l) => `  • [${r.tool}/${r.operation}] ${l}`),
  );
  const limitationsContent = allLimitations.length
    ? allLimitations.join("\n")
    : "  None recorded.";

  // ── 10. Next Recommended Action ──────────────────────────────────────────
  let nextAction = "  No issues found — re-run after the next code change.";
  if (failedResults.length) {
    const first = failedResults[0];
    nextAction = `  Investigate failure in [${first.tool}/${first.operation}]. ` +
      (first.stderr ? `Error: ${first.stderr.slice(0, 200)}` : "See stderr above.");
  } else if (nvResults.length) {
    const first = nvResults[0];
    nextAction = `  Resolve unverified item [${first.tool}/${first.operation}]: ` +
      (first.limitations[0] ?? "check tool prerequisites.");
  } else if (confirmed.length) {
    // Count security/secret findings
    const secFindings = confirmed
      .filter((r) => r.tool === "secrets" || r.tool === "security")
      .flatMap((r) => (Array.isArray(r.result) ? r.result : []));
    if (secFindings.length > 0) {
      nextAction = `  Review and remediate ${secFindings.length} security/secret finding(s) listed above.`;
    }
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  const sections: ReportSection[] = [
    { title: "Executive Summary",                content: execSummary },
    { title: "Actual Actions",                   content: actionsContent },
    { title: "Files Changed",                    content: filesContent },
    { title: "Tests Actually Executed",          content: testsContent },
    { title: "Security Checks Actually Executed", content: secContent },
    { title: "Confirmed Findings",               content: confirmedContent },
    { title: "Needs Verification",               content: nvContent },
    { title: "Failures",                         content: failuresContent },
    { title: "Limitations",                      content: limitationsContent },
    { title: "Next Recommended Action",          content: nextAction },
  ];

  return { generatedAt, sections };
}

/** Renders the AuditReport as a plain-text string. */
export function renderReportText(report: AuditReport): string {
  const divider = "═".repeat(72);
  const lines: string[] = [
    divider,
    `  REPOPILOT AUDIT REPORT — ${report.generatedAt}`,
    divider,
  ];
  for (const [i, sec] of report.sections.entries()) {
    lines.push(`\n${i + 1}. ${sec.title.toUpperCase()}\n${"-".repeat(sec.title.length + 3)}`);
    lines.push(sec.content);
  }
  lines.push(`\n${divider}`);
  return lines.join("\n");
}
