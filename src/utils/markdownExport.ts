import { Repository, SecurityAuditReport, TestSuiteSummary } from '../../types';

export interface MarkdownExportOptions {
  includeTests?: boolean;
  includeArchitecture?: boolean;
  includeSecurity?: boolean;
}

export function generateRepositoryMarkdown(
  repo: Repository,
  securityReport: SecurityAuditReport | null,
  testSummary?: TestSuiteSummary,
  options: MarkdownExportOptions = { includeTests: true, includeArchitecture: true, includeSecurity: true }
): string {
  const dateStr = new Date().toUTCString();
  const analysis = repo.analysis;

  let md = `# ${repo.name} — Architecture & Security Audit

> **RepoPilot Intelligence Report**  
> Generated: ${dateStr}  
> Workspace ID: \`${repo.id}\`  
> Mode: ${repo.isDemo ? 'Demo Repository (TaskFlow Sandbox)' : 'Custom Project'}  

---

## 1. Codebase Summary & Metrics

- **Total Source Files:** ${repo.files.length}
- **Indexed Lines of Code:** ${repo.stats.codeLines}
- **Detected Technologies:** ${repo.techStack.length > 0 ? repo.techStack.join(', ') : 'N/A'}
- **Language Distribution:**
${Object.entries(repo.stats.languageDistribution || {})
  .map(([lang, count]) => `  - **${lang}:** ${count} files`)
  .join('\n') || '  - Standard source modules'}

---
`;

  if (options.includeArchitecture && analysis) {
    md += `## 2. High-Level Architecture & Overview

### Overview
${analysis.overview || 'No project overview available.'}

### System Architecture
${analysis.architecture || 'Decoupled module architecture.'}

### Key Architectural Modules
| File Path | Role | Implementation Notes |
|:---|:---|:---|
${(analysis.importantFiles || [])
  .map(f => `| \`${f.path}\` | ${f.role} | ${f.notes || 'Core logic'} |`)
  .join('\n') || '| N/A | N/A | N/A |'}

### Potential Architectural Considerations
${(analysis.potentialIssues || [])
  .map(
    issue =>
      `- **[${issue.severity.toUpperCase()}] ${issue.title}**: ${issue.description}`
  )
  .join('\n') || '- No critical architectural bottlenecks identified.'}

### Suggested Improvements
${(analysis.suggestedImprovements || [])
  .map(imp => `- [ ] ${imp}`)
  .join('\n') || '- Codebase follows standard patterns.'}

---
`;
  }

  if (options.includeSecurity) {
    md += `## 3. Security Audit & Vulnerability Assessment

`;
    if (securityReport && securityReport.findings.length > 0) {
      md += `**Audit Status:** Review Completed  
**Engine:** ${securityReport.scannerType || 'RepoPilot Static AST Analyzer'}  
**Total Findings:** ${securityReport.totalFindings}  
- **Critical:** ${securityReport.criticalCount}  
- **High:** ${securityReport.highCount}  
- **Medium:** ${securityReport.mediumCount}  
- **Low:** ${securityReport.lowCount}  

### Findings Detail

`;
      securityReport.findings.forEach((finding, idx) => {
        md += `#### ${idx + 1}. [${finding.severity.toUpperCase()}] ${finding.finding}
- **Category:** ${finding.category}
- **Affected File:** \`${finding.affectedFile}\`
- **Why It Matters:**  
  ${finding.whyItMatters}

**Evidence in Source:**
\`\`\`
${finding.evidence}
\`\`\`

**Recommended Fix:**
\`\`\`
${finding.recommendedFix}
\`\`\`

**Validation Steps:**
${finding.validationSteps.map(step => `- [ ] ${step}`).join('\n')}

---
`;
      });
    } else {
      md += `*No security findings recorded yet. Run the "Run Security Review" action in RepoPilot to populate this section.*

---
`;
    }
  }

  if (options.includeTests && testSummary) {
    md += `## 4. Test Suite Execution Status

- **Status:** ${testSummary.failed > 0 ? '⚠️ Regressions Detected' : '✅ All Tests Passing'}
- **Environment:** ${testSummary.isSimulated ? 'TaskFlow Simulated Test Runner (Demo Sandbox)' : 'Live Test Runner'}
- **Summary:** ${testSummary.passed} Passed, ${testSummary.failed} Failed, ${testSummary.skipped} Skipped (Total: ${testSummary.total})

| Test Name | Suite | Status | Duration |
|:---|:---|:---:|:---|
${testSummary.tests
  .map(t => `| ${t.name} | ${t.suite} | ${t.status === 'passed' ? 'PASS' : 'FAIL'} | ${t.durationMs}ms |`)
  .join('\n')}

---
`;
  }

  md += `\n*Exported by RepoPilot — Your AI teammate for real-world codebases.*`;
  return md;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
