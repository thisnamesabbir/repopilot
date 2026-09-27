import { describe, it, expect } from 'vitest';
import { generateRepositoryMarkdown } from '../src/utils/markdownExport';
import { TASKFLOW_REPO } from '../src/data/demoRepo';
import { SecurityAuditReport } from '../types';

describe('generateRepositoryMarkdown', () => {
  it('should generate valid markdown with repo name and tech stack', () => {
    const md = generateRepositoryMarkdown(TASKFLOW_REPO, null);
    expect(md).toContain('# TaskFlow — AI Task Management Platform — Architecture & Security Audit');
    expect(md).toContain('Total Source Files');
    expect(md).toContain(String(TASKFLOW_REPO.files.length));
    expect(md).toContain('TypeScript');
  });

  it('should include high-level architecture when analysis is present', () => {
    const md = generateRepositoryMarkdown(TASKFLOW_REPO, null);
    expect(md).toContain('High-Level Architecture & Overview');
    expect(md).toContain('src/App.tsx');
    expect(md).toContain('server/middleware/auth.ts');
  });

  it('should include security audit findings when report is supplied', () => {
    const mockReport: SecurityAuditReport = {
      timestamp: Date.now(),
      totalFindings: 1,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 0,
      findings: [
        {
          id: 'sec_1',
          category: 'Secrets',
          finding: 'Hardcoded Fallback JWT Secret',
          severity: 'high',
          affectedFile: 'server/middleware/auth.ts',
          evidence: 'const JWT_SECRET = ...',
          whyItMatters: 'Allows token forgery',
          recommendedFix: 'Throw error if secret is missing',
          validationSteps: ['Unset env var', 'Check refusal']
        }
      ],
      scannerType: 'RepoPilot AST Analyzer'
    };

    const md = generateRepositoryMarkdown(TASKFLOW_REPO, mockReport);
    expect(md).toContain('Security Audit & Vulnerability Assessment');
    expect(md).toContain('[HIGH] Hardcoded Fallback JWT Secret');
    expect(md).toContain('server/middleware/auth.ts');
    expect(md).toContain('Allows token forgery');
  });
});
