import { describe, it, expect } from 'vitest';
import { TASKFLOW_REPO } from '../src/data/demoRepo';
import { CodePlanResponse } from '../types';

describe('AI Assistant Structured Workflow & Reasoning', () => {
  it('should validate structured response contract with all required fields', () => {
    const mockPlan: CodePlanResponse = {
      understanding: 'Protect the dashboard route by verifying user token session.',
      filesAffected: [{ path: 'src/App.tsx', reason: 'Add ProtectedRoute wrapper' }],
      plan: ['Step 1: Check token', 'Step 2: Redirect unauthenticated user'],
      changes: [
        {
          filePath: 'src/App.tsx',
          description: 'Add route guard',
          oldCode: 'const a = 1;',
          newCode: 'const a = 2;',
          diff: '--- a/src/App.tsx\n+++ b/src/App.tsx\n@@ -1,1 +1,1 @@\n-const a = 1;\n+const a = 2;',
          linesAdded: 1,
          linesRemoved: 1,
          explanation: 'Guarantees authenticated state before rendering dashboard.'
        }
      ],
      tests: ['Verify redirect on unauthenticated visit', 'Verify dashboard renders when logged in'],
      security: ['Prevent token leakage in URLs', 'Clear expired storage tokens'],
      limitations: ['Relies on client storage; cookies needed for strict CSRF defense'],
      confidence: 'high',
      confidenceScore: 95,
      confidenceReason: 'Evidence verified against 3 indexed repository files.',
      insufficientContext: false,
      workflowSteps: [
        { step: 'USER REQUEST', status: 'completed' },
        { step: 'UNDERSTAND REQUEST', status: 'completed' },
        { step: 'SEARCH REPOSITORY CONTEXT', status: 'completed' },
        { step: 'IDENTIFY RELEVANT FILES', status: 'completed' },
        { step: 'CREATE IMPLEMENTATION PLAN', status: 'completed' },
        { step: 'GENERATE PATCH/DIFF', status: 'completed' },
        { step: 'CREATE TEST PLAN', status: 'completed' },
        { step: 'SECURITY REVIEW', status: 'completed' },
        { step: 'FINAL SUMMARY', status: 'completed' }
      ]
    };

    expect(mockPlan.understanding).toBeDefined();
    expect(Array.isArray(mockPlan.filesAffected)).toBe(true);
    expect(Array.isArray(mockPlan.plan)).toBe(true);
    expect(Array.isArray(mockPlan.changes)).toBe(true);
    expect(Array.isArray(mockPlan.tests)).toBe(true);
    expect(Array.isArray(mockPlan.security)).toBe(true);
    expect(Array.isArray(mockPlan.limitations)).toBe(true);
    expect(mockPlan.confidence).toBe('high');
    expect(mockPlan.workflowSteps?.length).toBe(9);
  });

  it('should flag Insufficient repository context when context is missing', () => {
    const insufficientPlan: CodePlanResponse = {
      understanding: 'Insufficient repository context.',
      filesAffected: [],
      plan: [],
      changes: [],
      tests: [],
      security: [],
      limitations: ['Repository lacks requested Python or Django files.'],
      confidence: 'low',
      confidenceScore: 12,
      confidenceReason: 'Insufficient repository context: target file not found.',
      insufficientContext: true,
      missingContext: 'Please supply or upload the missing settings.py file.'
    };

    expect(insufficientPlan.understanding).toBe('Insufficient repository context.');
    expect(insufficientPlan.insufficientContext).toBe(true);
    expect(insufficientPlan.changes.length).toBe(0);
    expect(insufficientPlan.missingContext).toContain('Please supply or upload');
  });

  it('should verify demo repository contains expected grounding files', () => {
    expect(TASKFLOW_REPO.files.length).toBeGreaterThanOrEqual(5);
    const hasApp = TASKFLOW_REPO.files.some(f => f.path.includes('App.tsx'));
    const hasLogin = TASKFLOW_REPO.files.some(f => f.path.includes('Login.tsx'));
    const hasDashboard = TASKFLOW_REPO.files.some(f => f.path.includes('Dashboard.tsx'));
    expect(hasApp).toBe(true);
    expect(hasLogin).toBe(true);
    expect(hasDashboard).toBe(true);
  });
});
