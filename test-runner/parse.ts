export interface ParsedCounts {
  passed: number | null;
  failed: number | null;
  skipped: number | null;
}

/**
 * Parses real runner output for test counts.
 * Returns nulls when the pattern doesn't match — never guesses counts.
 * Anything exotic falls through so the caller can mark status "unable_to_determine".
 */
export function parseCounts(
  framework: string,
  stdout: string,
  stderr: string,
  _exitCode: number | null,
): ParsedCounts {
  const combined = stdout + "\n" + stderr;

  // Jest / Vitest / npm-script summary: "Tests: 5 passed, 1 failed, 2 skipped"
  if (framework === "jest" || framework === "vitest" || framework === "npm-script") {
    const m = combined.match(
      /Tests:\s*(?:(\d+)\s*passed)?[^,\n]*?(?:,\s*(\d+)\s*failed)?[^,\n]*?(?:,\s*(\d+)\s*skipped)?/,
    );
    if (m && (m[1] || m[2] || m[3])) {
      return {
        passed:  m[1] ? +m[1] : 0,
        failed:  m[2] ? +m[2] : 0,
        skipped: m[3] ? +m[3] : 0,
      };
    }
  }

  // pytest: "5 passed, 1 failed, 2 skipped in 3.2s"
  if (framework === "pytest") {
    const grab = (label: string) => {
      const hit = combined.match(new RegExp(`(\\d+)\\s+${label}`));
      return hit ? +hit[1] : 0;
    };
    if (/=+\s.+\s=+/.test(combined) && /\d+\s+(passed|failed|error)/.test(combined)) {
      return {
        passed:  grab("passed"),
        failed:  grab("failed") + grab("error"),
        skipped: grab("skipped"),
      };
    }
  }

  // go test: "ok  pkg 0.5s" / "--- FAIL" lines
  if (framework === "go") {
    if (/\bFAIL\b/.test(combined)) {
      const fails = (combined.match(/--- FAIL/g) ?? []).length;
      return { passed: null, failed: fails || null, skipped: null };
    }
    if (/^ok\s/m.test(combined)) {
      return { passed: null, failed: 0, skipped: null };
    }
  }

  // cargo test: "test result: ok. 10 passed; 0 failed; 0 ignored"
  if (framework === "cargo") {
    const m = combined.match(
      /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed;\s+\d+ ignored/,
    );
    if (m) return { passed: +m[1], failed: +m[2], skipped: 0 };
  }

  // No pattern matched — never guess
  return { passed: null, failed: null, skipped: null };
}
