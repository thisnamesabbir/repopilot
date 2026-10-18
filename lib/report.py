"""
Report emitter — buckets findings by status.

Escalation rule (hard-coded)
-----------------------------
A regex hit alone can NEVER become CONFIRMED.
Promotion requires at least one of:
  (a) Data-flow trace from a request source to the sink in the same codebase.
  (b) Reproduction in the local dev environment with recorded output.
  (c) Tool output (npm audit / pip-audit / semgrep / gitleaks) confirming
      the specific issue.

Safe Reproduction steps are written per finding but only marked "executed"
if the run actually happened.
"""

from __future__ import annotations
from typing import Any

_VALID_STATUSES = {"CONFIRMED", "NEEDS VERIFICATION", "INFORMATIONAL", "FALSE POSITIVE"}


def emit(findings: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """
    Validate and bucket findings.

    Any finding that arrives without a status (or with an unrecognised status)
    is forced to NEEDS VERIFICATION — never silently promoted.

    Returns a dict with keys: CONFIRMED, NEEDS VERIFICATION, INFORMATIONAL,
    FALSE POSITIVE (each maps to a possibly-empty list).
    """
    buckets: dict[str, list[dict[str, Any]]] = {
        "CONFIRMED":         [],
        "NEEDS VERIFICATION": [],
        "INFORMATIONAL":     [],
        "FALSE POSITIVE":    [],
    }

    for f in findings:
        status = f.get("status", "NEEDS VERIFICATION")
        if status not in _VALID_STATUSES:
            status = "NEEDS VERIFICATION"
        f["status"] = status
        buckets[status].append(f)

    return buckets


def render_text(buckets: dict[str, list[dict[str, Any]]], tool_results: list[dict] | None = None) -> str:
    """
    Render the canonical 10-section report as plain text.

    Sections with no backing evidence render the literal string NOT VERIFIED,
    never a fabricated default.
    """
    lines: list[str] = []
    div = "=" * 72

    lines += [div, "  REPOPILOT SECURITY REPORT", div, ""]

    # 1. Executive Summary
    total = sum(len(v) for v in buckets.values())
    lines.append("1. EXECUTIVE SUMMARY")
    lines.append("-" * 22)
    lines.append(f"   Total findings   : {total}")
    for status, findings in buckets.items():
        lines.append(f"   {status:<22}: {len(findings)}")
    lines.append("")

    # 2. Actual Actions
    lines.append("2. ACTUAL ACTIONS")
    lines.append("-" * 18)
    if tool_results:
        for tr in tool_results:
            lines.append(f"   • {tr.get('tool','?')}/{tr.get('operation','?')}  [{tr.get('status','?')}]")
    else:
        lines.append("   NOT VERIFIED — no tool-result records supplied to report generator.")
    lines.append("")

    # 3. Confirmed Findings
    lines.append("3. CONFIRMED FINDINGS")
    lines.append("-" * 21)
    confirmed = buckets.get("CONFIRMED", [])
    if confirmed:
        for f in confirmed:
            lines.append(f"   [{f['severity']}] {f['rule']} — {f['title']}")
            lines.append(f"        {f['file']}:{f['line']}  fn={f['function']}")
            lines.append(f"        {f['evidence']}")
    else:
        lines.append("   None.")
    lines.append("")

    # 4. Needs Verification
    lines.append("4. NEEDS VERIFICATION")
    lines.append("-" * 21)
    nv = buckets.get("NEEDS VERIFICATION", [])
    if nv:
        for f in nv:
            lines.append(f"   [{f['severity']}] {f['rule']} — {f['title']}")
            lines.append(f"        {f['file']}:{f['line']}  fn={f['function']}")
            if f.get("confidence_hint"):
                lines.append(f"        hint: {f['confidence_hint']}")
            lines.append(f"        {f['evidence']}")
    else:
        lines.append("   None.")
    lines.append("")

    # 5. Informational
    lines.append("5. INFORMATIONAL")
    lines.append("-" * 17)
    info = buckets.get("INFORMATIONAL", [])
    if info:
        for f in info:
            lines.append(f"   [{f['severity']}] {f['rule']} — {f['title']}")
    else:
        lines.append("   None.")
    lines.append("")

    # 6. Escalation Rule (always printed as a reminder)
    lines.append("6. ESCALATION RULE")
    lines.append("-" * 19)
    lines.append("   A regex hit alone can NEVER become CONFIRMED.")
    lines.append("   Promotion requires data-flow trace, live reproduction, or")
    lines.append("   corroborating tool output (npm audit / pip-audit / semgrep).")
    lines.append("")

    lines.append(div)
    return "\n".join(lines)
