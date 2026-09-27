"""
Core scanner: walks a source tree, applies regex rule-sets, emits findings.

Design principles
-----------------
* Every finding starts as NEEDS VERIFICATION — regex alone can never CONFIRM.
* Evidence snippets are always redacted before storage.
* File-reading errors are skipped silently (binary, permissions, encoding).
* Caller controls include_ext; None means all text files.
"""

import re
import os

from lib.redact import redact

# Directories never descended into
_EXCLUDE_DIRS = frozenset({
    ".git", "node_modules", "venv", ".venv", "__pycache__",
    "dist", "build", ".next",
})

MAX_FILE_BYTES = 512 * 1024  # skip files larger than 512 KB


def iter_files(root, include_ext=None, exclude_dirs=None):
    """
    Yield absolute paths for every file under root.

    Parameters
    ----------
    include_ext  : list of str  e.g. [".py", ".js"] — None means all files
    exclude_dirs : set of str   additional dir-names to prune (merged with defaults)
    """
    skip = _EXCLUDE_DIRS | (set(exclude_dirs) if exclude_dirs else set())
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip]
        for fname in filenames:
            if include_ext and not fname.endswith(tuple(include_ext)):
                continue
            yield os.path.join(dirpath, fname)


def _line_number(src: str, offset: int) -> int:
    return src[:offset].count("\n") + 1


def guess_function(lines, ln: int) -> str:
    """Walk backwards from ln to find the nearest enclosing function name."""
    for i in range(ln - 1, -1, -1):
        m = re.match(
            r'\s*(?:async\s+)?def\s+(\w+)'         # Python def
            r'|function\s+(\w+)'                    # JS/TS function declaration
            r'|(\w+)\s*=\s*(?:async\s*)?\(',        # JS arrow / assigned function
            lines[i],
        )
        if m:
            return next(g for g in m.groups() if g)
    return "<module-level>"


def scan(root, rules, include_ext=None):
    """
    Run all rules against all matching files under root.

    Parameters
    ----------
    rules : list of dicts, each with keys:
        id             str   short identifier e.g. "CMD-01"
        title          str   human-readable description
        severity       str   CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL
        patterns       list  of regex strings
        confidence_hint str  optional note for the analyst

    Returns
    -------
    list of finding dicts, all with status "NEEDS VERIFICATION"
    """
    findings = []

    for path in iter_files(root, include_ext):
        try:
            stat = os.stat(path)
            if stat.st_size > MAX_FILE_BYTES:
                continue
            with open(path, encoding="utf-8", errors="replace") as fh:
                src = fh.read()
        except OSError:
            continue

        lines = src.splitlines()

        for rule in rules:
            compiled = [re.compile(p, re.MULTILINE) for p in rule.get("patterns", [])]
            for regex in compiled:
                for m in regex.finditer(src):
                    ln = _line_number(src, m.start())
                    snippet_lines = lines[max(0, ln - 2): ln + 2]
                    findings.append({
                        "rule":         rule["id"],
                        "title":        rule["title"],
                        "severity":     rule["severity"],
                        "file":         path,
                        "line":         ln,
                        "function":     guess_function(lines, ln),
                        "evidence":     redact("\n".join(snippet_lines)),
                        "confidence_hint": rule.get("confidence_hint", ""),
                        # Hard rule: regex hit alone is never CONFIRMED.
                        "status":       "NEEDS VERIFICATION",
                    })

    return findings
