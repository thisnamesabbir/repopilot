"""
repopilot/gates.py -- hard gates that enforce pipeline invariants.

Each gate either passes silently or raises; it never silently downgrades
a failure to a warning.  The apply stage is diff-only: files are never
written directly.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from repopilot.agent import InsufficientContext, Session, Stage


# ---------------------------------------------------------------------------
# Pre-apply gate
# ---------------------------------------------------------------------------

def pre_apply_gate(session: Session, rel: str) -> None:
    """
    Verify -- immediately before applying a patch -- that:
      1. Evidence was collected for this file (never invent).
      2. The file on disk still matches the evidence sha256 (concurrent-edit guard).
      3. Every symbol the plan references is present in the current content.

    Raises InsufficientContext or RuntimeError; never returns silently on failure.
    """
    ev = session.evidence.get(rel)
    if ev is None:
        raise InsufficientContext([f"no evidence collected for {rel}"])

    current_path = session.repo / rel
    if not current_path.is_file():
        raise InsufficientContext([f"{rel} no longer exists on disk"])

    current = current_path.read_text(encoding="utf-8", errors="replace")
    current_sha = hashlib.sha256(current.encode()).hexdigest()
    if current_sha != ev.sha256:
        raise RuntimeError(
            f"{rel} changed on disk since inspection "
            f"(evidence={ev.sha256[:8]}, current={current_sha[:8]}); "
            "re-read required before patching"
        )

    # Verify every planned symbol still resolves
    missing_symbols = [
        sym
        for sym in session.planned_symbols.get(rel, [])
        if sym not in current
    ]
    if missing_symbols:
        raise InsufficientContext(
            [f"symbol {sym!r} not found in {rel}" for sym in missing_symbols]
        )


# ---------------------------------------------------------------------------
# Patch application
# ---------------------------------------------------------------------------

def apply_patch(session: Session, rel: str) -> None:
    """
    Apply the stored unified diff for rel via `git apply`.

    Steps:
      1. pre_apply_gate -- all preconditions verified.
      2. Write diff to .repopilot_patches/<mangled>.diff.
      3. git apply --check -- dry run; failure raises.
      4. git apply -- real application.

    The file is never written directly; all modifications are diff-based.
    """
    pre_apply_gate(session, rel)

    diff = session.diffs.get(rel)
    if not diff:
        raise InsufficientContext([f"no diff stored for {rel}"])

    patches_dir = session.repo / ".repopilot_patches"
    patches_dir.mkdir(exist_ok=True)
    patch_path = patches_dir / f"{rel.replace('/', '_')}.diff"
    patch_path.write_text(diff, encoding="utf-8")

    check = session.run(
        Stage.APPLY,
        ["git", "apply", "--check", str(patch_path)],
    )
    if check.exit_code != 0:
        raise RuntimeError(
            f"git apply --check failed for {rel}:\n{check.stderr.strip()}"
        )

    session.run(Stage.APPLY, ["git", "apply", str(patch_path)])


# ---------------------------------------------------------------------------
# Post-apply validation
# ---------------------------------------------------------------------------

def post_apply_validate(session: Session, rel: str) -> None:
    """
    After a patch is applied:
      1. Re-read the file so evidence is refreshed to the new sha256.
      2. Syntax-check Python files with py_compile.
      3. Never disable checks to force green -- failures propagate into the report.
    """
    session.read_file(rel)   # refresh evidence

    if rel.endswith(".py"):
        session.run(Stage.VALIDATE, ["python", "-m", "py_compile", rel])


# ---------------------------------------------------------------------------
# Test deletion guard
# ---------------------------------------------------------------------------

_TEST_FILE_PATTERNS = ("test_", "_test.py", "/tests/", "\\tests\\")


def _touches_test_file(rel: str) -> bool:
    return any(pat in rel for pat in _TEST_FILE_PATTERNS)


_SECURITY_CONFIG_PATTERNS = (
    ".semgrepignore",
    "pyproject.toml",
    "setup.cfg",
    ".github/workflows",
    ".eslintrc",
    "tsconfig.json",
)


def _touches_security_config(rel: str) -> bool:
    return any(pat in rel for pat in _SECURITY_CONFIG_PATTERNS)


def diff_policy_gate(
    session: Session,
    rel: str,
    user_approved_test_deletion: bool = False,
) -> None:
    """
    Enforce patch-quality rules before the diff is applied:
      - Test file line deletions require explicit user approval.
      - Security/lint config changes are flagged as significant.
    """
    diff = session.diffs.get(rel, "")
    removed_lines = [
        line for line in diff.splitlines()
        if line.startswith("-") and not line.startswith("---")
    ]

    if _touches_test_file(rel) and removed_lines and not user_approved_test_deletion:
        raise RuntimeError(
            f"Diff for {rel} removes {len(removed_lines)} line(s) from a test file. "
            "Explicit user approval required (pass user_approved_test_deletion=True)."
        )

    if _touches_security_config(rel) and diff:
        # Not a hard block -- must appear in the approval card
        session.planned_symbols.setdefault("__significant_changes__", []).append(rel)


# ---------------------------------------------------------------------------
# Approval card emitter
# ---------------------------------------------------------------------------

def build_approval_card(
    session: Session,
    affected: list[str],
    plan_summary: str,
    risks: list[str],
) -> str:
    """
    Emit a structured approval card for multi-file / significant changes.
    The caller must block and wait for explicit 'yes' before proceeding.
    """
    lines_added = lines_removed = 0
    for rel in affected:
        diff = session.diffs.get(rel, "")
        lines_added   += sum(1 for l in diff.splitlines() if l.startswith("+") and not l.startswith("+++"))
        lines_removed += sum(1 for l in diff.splitlines() if l.startswith("-") and not l.startswith("---"))

    # Discover relevant tests by naming convention
    tests_to_run: list[str] = []
    for rel in affected:
        stem = Path(rel).stem
        for candidate in (f"test_{stem}.py", f"tests/test_{stem}.py"):
            if (session.repo / candidate).exists():
                tests_to_run.append(candidate)

    card_lines = [
        "=" * 60,
        "APPROVAL REQUIRED",
        "=" * 60,
        f"Files affected : {', '.join(affected)}",
        f"Reason         : {plan_summary}",
        f"Patch summary  : +{lines_added} / -{lines_removed} across {len(affected)} file(s)",
        "Risks          :",
        *[f"  * {r}" for r in (risks or ["(none identified)"])],
        "Tests to run   : " + (", ".join(tests_to_run) or "(none discovered by convention)"),
        "Security       : semgrep --config auto " + " ".join(affected),
        "-" * 60,
        "Approve? (yes/no)",
    ]
    return "\n".join(card_lines)
