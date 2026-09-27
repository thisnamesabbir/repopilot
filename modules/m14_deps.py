"""
m14_deps — Dependency vulnerability audit.

Delegates entirely to npm audit / pip-audit tool output.
Only imports tool-reported CVEs — never asserts a CVE without that evidence.
If the audit tool is not installed, returns a single INFORMATIONAL finding
noting the limitation.
"""
from __future__ import annotations
import json
import os
import subprocess
import shutil
from typing import Any


def _run(argv: list[str], cwd: str) -> tuple[int, str]:
    """Run a command, capture stdout. Returns (returncode, stdout)."""
    try:
        r = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=120)
        return r.returncode, r.stdout
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return -1, str(exc)


def _npm_findings(root: str) -> list[dict[str, Any]]:
    if not os.path.exists(os.path.join(root, "package.json")):
        return []
    if not shutil.which("npm"):
        return [{
            "rule": "DEP-01", "title": "npm audit could not run — npm not found",
            "severity": "INFORMATIONAL", "file": "package.json", "line": 1,
            "function": "<module-level>", "evidence": "npm not installed",
            "confidence_hint": "Install Node.js/npm and re-run.",
            "status": "INFORMATIONAL",
        }]

    code, out = _run(["npm", "audit", "--json"], root)
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        return []

    findings: list[dict[str, Any]] = []
    for name, vuln in (data.get("vulnerabilities") or {}).items():
        severity = vuln.get("severity", "unknown").upper()
        via = next((v for v in vuln.get("via", []) if isinstance(v, dict)), {})
        findings.append({
            "rule":     "DEP-NPM",
            "title":    via.get("title") or f"Vulnerability in {name}",
            "severity": severity,
            "file":     "package.json",
            "line":     1,
            "function": "<module-level>",
            "evidence": f"module={name} range={via.get('range','?')} fixAvailable={vuln.get('fixAvailable')}",
            "confidence_hint": "npm audit output; confirm fix version in package-lock.json.",
            # npm audit output is tool-confirmed — may be promoted after human review
            "status":   "NEEDS VERIFICATION",
        })
    return findings


def _pip_findings(root: str) -> list[dict[str, Any]]:
    has_req = os.path.exists(os.path.join(root, "requirements.txt"))
    has_pyproj = os.path.exists(os.path.join(root, "pyproject.toml"))
    if not (has_req or has_pyproj):
        return []
    if not shutil.which("pip-audit"):
        return [{
            "rule": "DEP-02", "title": "pip-audit could not run — not found",
            "severity": "INFORMATIONAL", "file": "requirements.txt", "line": 1,
            "function": "<module-level>", "evidence": "pip-audit not installed",
            "confidence_hint": "Install pip-audit (pip install pip-audit) and re-run.",
            "status": "INFORMATIONAL",
        }]

    args = ["pip-audit", "--format", "json"]
    if has_req:
        args += ["-r", "requirements.txt"]
    code, out = _run(args, root)
    try:
        rows = json.loads(out)
    except json.JSONDecodeError:
        return []

    findings: list[dict[str, Any]] = []
    for pkg in rows:
        for v in pkg.get("vulns", []):
            findings.append({
                "rule":     "DEP-PIP",
                "title":    v.get("description", "")[:120] or f"Vulnerability in {pkg['name']}",
                "severity": "HIGH",
                "file":     "requirements.txt",
                "line":     1,
                "function": "<module-level>",
                "evidence": f"package={pkg['name']} version={pkg.get('version','?')} id={v.get('id','?')} fix={v.get('fix_versions',[])}",
                "confidence_hint": "pip-audit output; confirm fix version in requirements.txt.",
                "status":   "NEEDS VERIFICATION",
            })
    return findings


def run(root: str) -> list[dict[str, Any]]:
    return _npm_findings(root) + _pip_findings(root)
