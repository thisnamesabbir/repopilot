import { describe, it, expect } from 'vitest';
import { generateUnifiedDiff, parseDiffLines, calculateLineStats } from '../src/utils/diffUtils';

describe('diffUtils', () => {
  it('should correctly detect added lines', () => {
    const oldCode = 'const a = 1;';
    const newCode = 'const a = 1;\nconst b = 2;';
    const stats = calculateLineStats(oldCode, newCode);
    expect(stats.added).toBe(1);
    expect(stats.removed).toBe(0);
  });

  it('should correctly detect removed lines', () => {
    const oldCode = 'const a = 1;\nconst b = 2;\nconst c = 3;';
    const newCode = 'const a = 1;\nconst c = 3;';
    const stats = calculateLineStats(oldCode, newCode);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(1);
  });

  it('should produce unified diff with correct git-style headers', () => {
    const oldCode = 'line 1\nline 2';
    const newCode = 'line 1\nline 2 modified';
    const diff = generateUnifiedDiff('src/App.tsx', oldCode, newCode);
    expect(diff).toContain('--- a/src/App.tsx');
    expect(diff).toContain('+++ b/src/App.tsx');
    expect(diff).toContain('+ line 2 modified');
  });

  it('should parse lines into line-numbered diff structures', () => {
    const oldCode = 'first\nsecond';
    const newCode = 'first\nsecond changed\nthird';
    const lines = parseDiffLines('test.ts', oldCode, newCode);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    const addedLines = lines.filter(l => l.type === 'added');
    expect(addedLines.length).toBe(2);
  });
});
