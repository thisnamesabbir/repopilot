/**
 * Clean Unified Diff and Line Comparison Utilities
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function generateUnifiedDiff(filePath: string, oldCode: string, newCode: string): string {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');

  let diffOutput = `--- a/${filePath}\n+++ b/${filePath}\n`;

  // Simple Myers/LCS diff algorithm for clean diff rendering
  const matrix: number[][] = Array(oldLines.length + 1)
    .fill(0)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  let i = oldLines.length;
  let j = newLines.length;
  const changes: { type: 'add' | 'rem' | 'same'; text: string; oldNum?: number; newNum?: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({ type: 'same', text: oldLines[i - 1], oldNum: i, newNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      changes.unshift({ type: 'add', text: newLines[j - 1], newNum: j });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      changes.unshift({ type: 'rem', text: oldLines[i - 1], oldNum: i });
      i--;
    }
  }

  diffOutput += `@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
  for (const c of changes) {
    if (c.type === 'add') {
      diffOutput += `+ ${c.text}\n`;
    } else if (c.type === 'rem') {
      diffOutput += `- ${c.text}\n`;
    } else {
      diffOutput += `  ${c.text}\n`;
    }
  }

  return diffOutput;
}

export function parseDiffLines(filePath: string, oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const result: DiffLine[] = [];

  const matrix: number[][] = Array(oldLines.length + 1)
    .fill(0)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  let i = oldLines.length;
  let j = newLines.length;
  const changes: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      changes.unshift({
        type: 'unchanged',
        text: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      changes.unshift({
        type: 'added',
        text: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      changes.unshift({
        type: 'removed',
        text: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  return changes;
}

export function calculateLineStats(oldCode: string, newCode: string): { added: number; removed: number } {
  const lines = parseDiffLines('', oldCode, newCode);
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.type === 'added') added++;
    if (line.type === 'removed') removed++;
  }
  return { added, removed };
}
