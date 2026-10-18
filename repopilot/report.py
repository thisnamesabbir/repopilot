"""
repopilot/report.py -- final report generator.

Derives every claim directly from the Session object.
A section with no backing executions renders "NOT RUN" -- never fabricated.
"""
from __future__ import annotations

from repopilot.agent import ExecutionRecord, Session, Stage


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _stage_records(session: Session, stage: Stage) -> list[ExecutionRecord]:
    return [e for e in session.executions if e.stage == stage]


def _verified(session: Session) -> bool:
    """
    Status is VERIFIED only when ALL of:
      1. Every file in session.diffs was re-read after patching (evidence refreshed).
      2. All syntax checks (py_compile / tsc) passed.
      3. At least one relevant test was executed.
    """
    patched_files = set(session.diffs.keys())
    re_read = set(session.evidence.keys())
    if not patched_files.issubset(re_read):
        return False

    syntax_checks = _stage_records(session, Stage.VALIDATE)
    if syntax_checks and any(r.exit_code != 0 for r in syntax_checks):
        return False

    test_runs = _stage_records(session, Stage.TEST)
    return bool(test_runs)


# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def _section(title: str, body: str) -> str:
    bar = "-" * len(title)
    return f"\n{title}\n{bar}\n{body}"


def _exec_summary(session: Session) -> str:
    total    = len(session.executions)
    ok       = sum(1 for e in session.executions if e.exit_code == 0)
    failed   = total - ok
    patched  = len(session.diffs)
    status   = "VERIFIED" if _verified(session) else "NOT VERIFIED"
    return (
        f"Session      : {session.session_id}\n"
        f"Branch       : {session.branch}\n"
        f"Commands run : {total}  (success={ok}, failed={failed})\n"
        f"Files patched: {patched}\n"
        f"Status       : {status}"
    )


def _actual_actions(session: Session) -> str:
    if not session.executions:
        return "NOT RUN -- no commands were executed in this session."
    lines = []
    for e in session.executions:
        tag = "OK" if e.exit_code == 0 else f"FAILED (exit={e.exit_code})"
        lines.append(f"  [{e.stage.value}] {' '.join(e.command)} -> {tag}")
    return "\n".join(lines)


def _files_changed(session: Session) -> str:
    if not session.diffs:
        return "No files were modified in this session."
    lines = []
    for rel, diff in session.diffs.items():
        added   = sum(1 for l in diff.splitlines() if l.startswith("+") and not l.startswith("+++"))
        removed = sum(1 for l in diff.splitlines() if l.startswith("-") and not l.startswith("---"))
        ev = session.evidence.get(rel)
        sha = ev.sha256[:12] if ev else "unknown"
        lines.append(f"  {rel}  +{added}/-{removed}  sha256={sha}")
    return "\n".join(lines)


def _tests_run(session: Session) -> str:
    recs = _stage_records(session, Stage.TEST)
    if not recs:
        return "NOT RUN -- test stage was not reached or no test runner was discovered."
    lines = []
    for r in recs:
        tag = "PASS" if r.exit_code == 0 else "FAIL"
        lines.append(f"  [{tag}] {' '.join(r.command)}")
        if r.exit_code != 0 and r.stderr:
            for ln in r.stderr.strip().splitlines()[:10]:
                lines.append(f"         {ln}")
    return "\n".join(lines)


def _security_checks(session: Session) -> str:
    recs = _stage_records(session, Stage.SECURITY)
    if not recs:
        return "NOT RUN -- security stage was not reached or no tool was available."
    lines = []
    for r in recs:
        tag = "PASS" if r.exit_code == 0 else "FINDINGS"
        lines.append(f"  [{tag}] {' '.join(r.command)}")
        if r.stdout:
            for ln in r.stdout.strip().splitlines()[:20]:
                lines.append(f"         {ln}")
    return "\n".join(lines)


def _failures(session: Session) -> str:
    failed = [e for e in session.executions if e.exit_code != 0]
    if not failed:
        return "None."
    lines = []
    for f in failed:
        lines.append(f"  [{f.stage.value}] {' '.join(f.command)} exit={f.exit_code}")
        if f.stderr:
            for ln in f.stderr.strip().splitlines()[:8]:
                lines.append(f"    {ln}")
    return "\n".join(lines)


def _apply_records(session: Session) -> str:
    recs = _stage_records(session, Stage.APPLY)
    if not recs:
        return "No patches were applied."
    return "\n".join(
        f"  {'OK' if r.exit_code == 0 else 'FAIL'} {' '.join(r.command)}"
        for r in recs
    )


def _evidence_table(session: Session) -> str:
    if not session.evidence:
        return "No files were inspected."
    lines = ["  {:<50} {}".format("File", "SHA-256 (first 16 chars)")]
    lines.append("  " + "-" * 68)
    for rel, ev in session.evidence.items():
        lines.append("  {:<50} {}".format(rel[:50], ev.sha256[:16]))
    return "\n".join(lines)


def _next_action(session: Session) -> str:
    failed = [e for e in session.executions if e.exit_code != 0]
    if failed:
        f = failed[0]
        detail = f"\n  stderr: {f.stderr.strip()[:200]}" if f.stderr else ""
        return f"Investigate failure in [{f.stage.value}]: {' '.join(f.command)}{detail}"
    if not _stage_records(session, Stage.TEST):
        return "Run the relevant test suite to verify the applied changes."
    if not _verified(session):
        return "Re-inspect patched files and ensure all syntax + test checks pass before marking VERIFIED."
    return "All checks passed.  Review the diff and merge the branch when ready."


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def render_report(session: Session) -> str:
    div = "=" * 72
    sections = [
        ("1. EXECUTIVE SUMMARY",                    _exec_summary(session)),
        ("2. ACTUAL ACTIONS",                        _actual_actions(session)),
        ("3. FILES CHANGED",                         _files_changed(session)),
        ("4. PATCHES APPLIED",                       _apply_records(session)),
        ("5. TESTS ACTUALLY RUN",                    _tests_run(session)),
        ("6. SECURITY CHECKS ACTUALLY RUN",          _security_checks(session)),
        ("7. FAILURES",                              _failures(session)),
        ("8. EVIDENCE TABLE (files inspected)",      _evidence_table(session)),
        ("9. VERIFICATION STATUS",
         "VERIFIED" if _verified(session) else
         "NOT VERIFIED -- one or more post-apply checks are absent or failed."),
        ("10. NEXT RECOMMENDED ACTION",              _next_action(session)),
    ]
    parts = [div, f"  REPOPILOT AGENT REPORT -- session {session.session_id}", div]
    for title, body in sections:
        parts.append(_section(title, body))
    parts.append(f"\n{div}")
    return "\n".join(parts)
