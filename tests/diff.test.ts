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

  it('should treat empty and identical files as having no changes', () => {
    expect(calculateLineStats('', '')).toEqual({ added: 0, removed: 0 });
    expect(calculateLineStats('same\ncontent', 'same\ncontent')).toEqual({ added: 0, removed: 0 });
  });

  it('should normalize Windows line endings and preserve Unicode paths and text', () => {
    const diff = generateUnifiedDiff('folder with spaces/音.ts', 'const 名 = 1;\r\n', 'const 名 = 2;\r\n');

    expect(diff).toContain('--- a/folder with spaces/音.ts');
    expect(diff).toContain('- const 名 = 1;');
    expect(diff).toContain('+ const 名 = 2;');
    expect(calculateLineStats('const 名 = 1;\r\n', 'const 名 = 2;\r\n')).toEqual({ added: 1, removed: 1 });
  });

  it('should keep control characters in file names from adding diff headers', () => {
    const diff = generateUnifiedDiff('src/file.ts\n--- a/injected', 'old', 'new');

    expect(diff.match(/^--- /gm)).toHaveLength(1);
    expect(diff).toContain('src/file.ts%0A--- a/injected');
  });

  it('should bound memory for large unrelated inputs', () => {
    const oldCode = Array.from({ length: 1500 }, (_, index) => `old-${index}`).join('\n');
    const newCode = Array.from({ length: 1500 }, (_, index) => `new-${index}`).join('\n');
    const stats = calculateLineStats(oldCode, newCode);

    expect(stats).toEqual({ added: 1500, removed: 1500 });
  });
});
