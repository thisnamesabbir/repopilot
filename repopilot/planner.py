"""
repopilot/planner.py -- symbol index, plan validation, diff quality enforcement.

The planner never invents symbols or files.  Every referenced symbol must
exist in the evidence index built from real file reads.  Diffs are kept
minimal and verified against evidence-recorded line ranges.
"""
from __future__ import annotations

import ast
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from repopilot.agent import FileEvidence, InsufficientContext, Session, Stage


# ---------------------------------------------------------------------------
# Symbol index
# ---------------------------------------------------------------------------

@dataclass
class SymbolIndex:
    """
    Maps file path -> set of top-level symbol names extracted from real reads.
    Built by build_symbol_index(); the planner validates every reference here.
    """
    symbols: dict[str, set[str]] = field(default_factory=dict)

    def has_symbol(self, rel: str, name: str) -> bool:
        return name in self.symbols.get(rel, set())

    def all_symbols(self, rel: str) -> set[str]:
        return self.symbols.get(rel, set())


def _extract_python_symbols(source: str) -> set[str]:
    """Extract top-level def/class/assignment names from Python source via ast."""
    names: set[str] = set()
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return names
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names.add(node.name)
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    names.add(target.id)
    return names


def _extract_ts_symbols(source: str) -> set[str]:
    """Best-effort extraction of exported names from TypeScript/JavaScript."""
    names: set[str] = set()
    for m in re.finditer(
        r"export\s+(?:async\s+)?(?:function|class|const|let|var|type|interface)\s+(\w+)",
        source,
    ):
        names.add(m.group(1))
    return names


def build_symbol_index(session: Session) -> SymbolIndex:
    """
    Walk the repo using `git ls-files` (never assumes files exist) and build
    a symbol index from files already read into evidence.
    Falls back to rglob if git is unavailable.
    """
    index = SymbolIndex()

    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=str(session.repo),
            capture_output=True,
            text=True,
            timeout=30,
        )
        tracked = result.stdout.splitlines() if result.returncode == 0 else []
    except (FileNotFoundError, subprocess.TimeoutExpired):
        tracked = []

    # Index evidence already in session
    for rel, ev in session.evidence.items():
        if rel.endswith(".py"):
            index.symbols[rel] = _extract_python_symbols(ev.content)
        elif rel.endswith((".ts", ".tsx", ".js", ".jsx")):
            index.symbols[rel] = _extract_ts_symbols(ev.content)

    # Ensure tracked files appear in the index (empty symbol set until read)
    for rel in tracked:
        index.symbols.setdefault(rel, set())

    return index


# ---------------------------------------------------------------------------
# Plan dataclasses
# ---------------------------------------------------------------------------

@dataclass
class FilePlan:
    rel: str
    action: str                            # "modify" | "create"
    symbols_referenced: list[str]          # must exist in SymbolIndex
    new_file_justification: Optional[str] = None   # required when action == "create"
    new_dependency: Optional[str] = None
    new_dependency_justification: Optional[str] = None


@dataclass
class Plan:
    understanding: str
    files: list[FilePlan]
    risks: list[str] = field(default_factory=list)
    requires_approval: bool = False


# ---------------------------------------------------------------------------
# Plan validator
# ---------------------------------------------------------------------------

_SIGNIFICANT_THRESHOLD_LINES = 50   # diffs larger than this require justification


def validate_plan(plan: Plan, index: SymbolIndex, session: Session) -> None:
    """
    Validate a plan against the symbol index.

    Raises InsufficientContext with every unknown symbol enumerated.
    Raises ValueError for structural violations (new file without justification, etc.).
    """
    missing: list[str] = []

    for fp in plan.files:
        if fp.action == "create":
            if not fp.new_file_justification:
                raise ValueError(
                    f"New file {fp.rel!r} requires a non-empty new_file_justification."
                )
        elif fp.action == "modify":
            for sym in fp.symbols_referenced:
                if not index.has_symbol(fp.rel, sym):
                    missing.append(f"{fp.rel}::{sym}")

        if fp.new_dependency and not fp.new_dependency_justification:
            raise ValueError(
                f"New dependency {fp.new_dependency!r} for {fp.rel!r} requires "
                "new_dependency_justification explaining why stdlib or an existing dep won't work."
            )

    if missing:
        raise InsufficientContext(missing)

    # Register planned symbols into session for pre_apply_gate
    for fp in plan.files:
        session.planned_symbols[fp.rel] = fp.symbols_referenced


# ---------------------------------------------------------------------------
# Diff quality enforcement
# ---------------------------------------------------------------------------

def enforce_diff_quality(session: Session, rel: str, ev: FileEvidence) -> None:
    """
    Enforce the minimal-diff constraint:
      - Diff line count must not exceed _SIGNIFICANT_THRESHOLD_LINES.
      - Diff must only touch lines adjacent to evidence-recorded ranges (when set).

    Raises RuntimeError on violation.
    """
    diff = session.diffs.get(rel, "")
    diff_lines = [
        line for line in diff.splitlines()
        if line.startswith(("+", "-")) and not line.startswith(("+++", "---"))
    ]

    if len(diff_lines) > _SIGNIFICANT_THRESHOLD_LINES:
        raise RuntimeError(
            f"Diff for {rel} touches {len(diff_lines)} lines "
            f"(threshold={_SIGNIFICANT_THRESHOLD_LINES}). "
            "Add an explicit justification in the plan or break the change into smaller steps."
        )

    if not ev.line_ranges:
        return  # no range constraint recorded -- allow full-file diff

    # Parse changed line numbers from unified diff hunk headers: @@ -a,b +c,d @@
    changed: set[int] = set()
    for m in re.finditer(r"@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@", diff):
        start = int(m.group(1))
        count = int(m.group(2)) if m.group(2) else 1
        changed.update(range(start, start + count))

    # Allow a +-5-line margin around each recorded range
    allowed: set[int] = set()
    for lo, hi in ev.line_ranges:
        allowed.update(range(max(1, lo - 5), hi + 6))

    out_of_range = changed - allowed
    if out_of_range:
        sample = sorted(out_of_range)[:10]
        raise RuntimeError(
            f"Diff for {rel} touches lines outside evidence ranges: "
            f"{sample}{'...' if len(out_of_range) > 10 else ''}. "
            "Re-inspect the file to widen the evidence before patching."
        )
