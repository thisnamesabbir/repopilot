/**
 * Clean Unified Diff and Line Comparison Utilities
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

const MAX_LCS_CELLS = 1_000_000;

function splitLines(code: string): string[] {
  return code.length === 0 ? [] : code.replace(/\r\n/g, '\n').split('\n');
}

function buildDiffLines(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = splitLines(oldCode);
  const newLines = splitLines(newCode);
  let prefixLength = 0;

  while (
    prefixLength < oldLines.length &&
    prefixLength < newLines.length &&
    oldLines[prefixLength] === newLines[prefixLength]
  ) {
    prefixLength++;
  }

  let suffixLength = 0;
  while (
    suffixLength < oldLines.length - prefixLength &&
    suffixLength < newLines.length - prefixLength &&
    oldLines[oldLines.length - suffixLength - 1] === newLines[newLines.length - suffixLength - 1]
  ) {
    suffixLength++;
  }

  const oldEnd = oldLines.length - suffixLength;
  const newEnd = newLines.length - suffixLength;
  const oldCount = oldEnd - prefixLength;
  const newCount = newEnd - prefixLength;
  const changes: DiffLine[] = [];

  for (let index = 0; index < prefixLength; index++) {
    changes.push({
      type: 'unchanged',
      text: oldLines[index],
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
    });
  }

  if ((oldCount + 1) * (newCount + 1) <= MAX_LCS_CELLS) {
    const matrix: number[][] = Array(oldCount + 1)
      .fill(0)
      .map(() => Array(newCount + 1).fill(0));

    for (let i = 1; i <= oldCount; i++) {
      for (let j = 1; j <= newCount; j++) {
        if (oldLines[prefixLength + i - 1] === newLines[prefixLength + j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    let i = oldCount;
    let j = newCount;
    const reversed: DiffLine[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[prefixLength + i - 1] === newLines[prefixLength + j - 1]) {
        reversed.push({
          type: 'unchanged',
          text: oldLines[prefixLength + i - 1],
          oldLineNumber: prefixLength + i,
          newLineNumber: prefixLength + j,
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        reversed.push({
          type: 'added',
          text: newLines[prefixLength + j - 1],
          newLineNumber: prefixLength + j,
        });
        j--;
      } else {
        reversed.push({
          type: 'removed',
          text: oldLines[prefixLength + i - 1],
          oldLineNumber: prefixLength + i,
        });
        i--;
      }
    }

    changes.push(...reversed.reverse());
  } else {
    // Keep large unrelated edits linear-time instead of allocating a quadratic LCS matrix.
    for (let index = prefixLength; index < oldEnd; index++) {
      changes.push({ type: 'removed', text: oldLines[index], oldLineNumber: index + 1 });
    }
    for (let index = prefixLength; index < newEnd; index++) {
      changes.push({ type: 'added', text: newLines[index], newLineNumber: index + 1 });
    }
  }

  for (let index = 0; index < suffixLength; index++) {
    const oldIndex = oldEnd + index;
    const newIndex = newEnd + index;
    changes.push({
      type: 'unchanged',
      text: oldLines[oldIndex],
      oldLineNumber: oldIndex + 1,
      newLineNumber: newIndex + 1,
    });
  }

  return changes;
}

export function generateUnifiedDiff(filePath: string, oldCode: string, newCode: string): string {
  const oldLines = splitLines(oldCode);
  const newLines = splitLines(newCode);
  const lines = buildDiffLines(oldCode, newCode);
  const safePath = filePath.replace(/[\r\n\0]/g, character =>
    `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
  );
  let diffOutput = `--- a/${safePath}\n+++ b/${safePath}\n`;

  diffOutput += `@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
  for (const line of lines) {
    const marker = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
    diffOutput += `${marker} ${line.text}\n`;
  }

  return diffOutput;
}

export function parseDiffLines(filePath: string, oldCode: string, newCode: string): DiffLine[] {
  return buildDiffLines(oldCode, newCode);
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
