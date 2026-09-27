"""
repopilot/__main__.py -- CLI entry point.

Usage:
    python -m repopilot --repo /path/to/repo run
    python -m repopilot --repo /path/to/repo inspect src/auth/session.py
    python -m repopilot --repo /path/to/repo index
    python -m repopilot --repo /path/to/repo report
    python -m repopilot --repo /path/to/repo koro          # full combined pipeline

Environment:
    REPOPILOT_SRC  -- alternative to --repo flag

Security: --repo / REPOPILOT_SRC must be set explicitly; the CLI refuses
to infer the repo path from cwd to prevent accidental runs on the wrong tree.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

from repopilot.agent import InsufficientContext, Session, Stage
from repopilot.gates import apply_patch, build_approval_card, diff_policy_gate, post_apply_validate
from repopilot.planner import Plan, FilePlan, build_symbol_index, validate_plan
from repopilot.report import render_report

# Scanner modules (lib/ + modules/) may not be on sys.path when the package
# is installed from a different cwd; add the repo root dynamically in cmd_koro.


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_repo(args: argparse.Namespace) -> Path:
    raw = getattr(args, "repo", None) or os.environ.get("REPOPILOT_SRC")
    if not raw:
        print(
            "ERROR: --repo or REPOPILOT_SRC must be set to the authorized source tree.",
            file=sys.stderr,
        )
        sys.exit(1)
    p = Path(raw).resolve()
    if not p.is_dir():
        print(f"ERROR: {p} is not a directory.", file=sys.stderr)
        sys.exit(1)
    return p


def _tool_available(name: str) -> bool:
    return shutil.which(name) is not None


# ---------------------------------------------------------------------------
# Sub-commands
# ---------------------------------------------------------------------------

def cmd_inspect(args: argparse.Namespace) -> None:
    """Read one or more files and print evidence (sha256 + line count)."""
    repo = _resolve_repo(args)
    session = Session(repo=repo)
    for rel in args.files:
        try:
            ev = session.read_file(rel)
            lines = ev.content.count("\n") + 1
            print(f"  {rel}  sha256={ev.sha256[:16]}  lines={lines}")
        except FileNotFoundError as exc:
            print(f"  NOT FOUND: {exc}", file=sys.stderr)


def cmd_index(args: argparse.Namespace) -> None:
    """Build and print the symbol index for the repo."""
    repo = _resolve_repo(args)
    session = Session(repo=repo)

    for p in repo.rglob("*.py"):
        rel = str(p.relative_to(repo))
        try:
            session.read_file(rel)
        except Exception:
            pass
    for ext in ("*.ts", "*.tsx", "*.js", "*.jsx"):
        for p in repo.rglob(ext):
            rel = str(p.relative_to(repo))
            try:
                session.read_file(rel)
            except Exception:
                pass

    index = build_symbol_index(session)
    for rel, syms in sorted(index.symbols.items()):
        if syms:
            print(f"  {rel}: {', '.join(sorted(syms))}")


def cmd_run(args: argparse.Namespace) -> None:
    """
    Full pipeline run: inspect -> discover -> test -> security -> report.

    Runs analysis end-to-end and emits a report.
    Does NOT apply patches -- that requires a plan + approval step.
    """
    repo = _resolve_repo(args)
    session = Session(repo=repo)

    # 1. Inspect -- confirm git repo
    rec = session.run(Stage.INSPECT, ["git", "rev-parse", "--show-toplevel"])
    if rec.exit_code != 0:
        print("[!] Not a git repo or git unavailable -- some gates will be skipped.", file=sys.stderr)

    # 2. Discover -- list tracked files
    session.run(Stage.DISCOVER, ["git", "ls-files"])

    # 3. Test stage
    pkg_json = repo / "package.json"
    pytest_ini = repo / "pytest.ini"
    pyproject = repo / "pyproject.toml"

    if pkg_json.exists():
        if _tool_available("npm"):
            session.run(Stage.TEST, ["npm", "run", "test", "--silent"], timeout=300)
        else:
            print("[!] npm not found -- test stage skipped.", file=sys.stderr)
    elif pytest_ini.exists() or pyproject.exists():
        if _tool_available("python"):
            session.run(Stage.TEST, ["python", "-m", "pytest", "-q"])
        else:
            print("[!] python not found -- test stage skipped.", file=sys.stderr)

    # 4. Security stage -- only what is installed; never fabricate results
    target = str(repo)
    if _tool_available("bandit"):
        session.run(Stage.SECURITY, ["bandit", "-r", target, "-q"])
    else:
        print("[!] bandit not installed -- security/bandit: not run.", file=sys.stderr)

    if _tool_available("semgrep"):
        session.run(Stage.SECURITY, ["semgrep", "--config", "auto", target, "--quiet"])
    else:
        print("[!] semgrep not installed -- security/semgrep: not run.", file=sys.stderr)

    # 5. Report
    print(render_report(session))


def cmd_report(args: argparse.Namespace) -> None:
    """Print a report from a previously-saved report/findings.json."""
    findings_path = Path("report") / "findings.json"
    if not findings_path.exists():
        print("No report/findings.json found -- run the scanner first.", file=sys.stderr)
        sys.exit(1)
    with open(findings_path) as fh:
        findings = json.load(fh)

    from lib.report import emit, render_text
    buckets = emit(findings)
    print(render_text(buckets))


# ---------------------------------------------------------------------------
# koro -- full combined pipeline
# ---------------------------------------------------------------------------

_SCANNER_MODULES = [
    "m01_secrets", "m02_env_handling", "m03_path_traversal", "m04_uploads",
    "m05_command_exec", "m06_sqli", "m07_xss_ssrf", "m08_authz",
    "m09_api_input", "m10_headers", "m11_deserialization", "m12_logging",
    "m13_prompt_injection", "m14_deps",
]


def cmd_koro(args: argparse.Namespace) -> None:
    """
    koro -- full combined pipeline in one command.

    Stages (in order):
      1. git inspect + ls-files
      2. All 14 scanner modules  (lib/ + modules/)
      3. npm audit / pip-audit   (if manifests present)
      4. Test suite              (if runner discovered)
      5. Security tools          (bandit, semgrep -- if installed)
      6. Merged report           (scanner buckets + agent session report)

    Output files written to report/:
      findings.json    -- raw scanner findings
      npm_audit.json   -- npm audit output (if applicable)
      pip_audit.json   -- pip-audit output (if applicable)
      koro_report.txt  -- merged plain-text report

    Nothing is applied to disk; the pipeline is analysis-only.
    """
    repo = _resolve_repo(args)

    # Ensure lib/ and modules/ are importable regardless of invocation cwd
    repo_str = str(repo)
    if repo_str not in sys.path:
        sys.path.insert(0, repo_str)
    # Also add the directory containing this package (project root)
    pkg_root = str(Path(__file__).resolve().parent.parent)
    if pkg_root not in sys.path:
        sys.path.insert(0, pkg_root)

    (repo / "report").mkdir(exist_ok=True)

    # ── Stage 1: git inspect ────────────────────────────────────────────────
    session = Session(repo=repo)
    print(f"[koro] session={session.session_id}  branch={session.branch}")

    rec = session.run(Stage.INSPECT, ["git", "rev-parse", "--show-toplevel"])
    if rec.exit_code != 0:
        print("[!] Not a git repo -- git gates will be skipped.", file=sys.stderr)

    session.run(Stage.DISCOVER, ["git", "ls-files"])

    # ── Stage 2: scanner modules ────────────────────────────────────────────
    print("[koro] running scanner modules...")
    import importlib
    all_findings: list[dict] = []
    scan_errors: list[str] = []

    for mod_name in _SCANNER_MODULES:
        try:
            mod = importlib.import_module(f"modules.{mod_name}")
            findings = mod.run(repo_str)
            all_findings.extend(findings)
            print(f"  [+] {mod_name}: {len(findings)} finding(s)")
        except Exception as exc:
            msg = f"{mod_name}: {exc}"
            scan_errors.append(msg)
            print(f"  [!] {msg}", file=sys.stderr)

    findings_path = repo / "report" / "findings.json"
    with open(findings_path, "w", encoding="utf-8") as fh:
        json.dump(all_findings, fh, indent=2)
    print(f"[koro] {len(all_findings)} raw finding(s) -> {findings_path}")

    # ── Stage 3: dependency audits ──────────────────────────────────────────
    if (repo / "package.json").exists():
        if _tool_available("npm"):
            r = session.run(Stage.SECURITY, ["npm", "audit", "--json"])
            if r.stdout:
                (repo / "report" / "npm_audit.json").write_text(r.stdout, encoding="utf-8")
                print("[koro] npm audit -> report/npm_audit.json")
        else:
            print("[!] npm not found -- npm audit skipped.", file=sys.stderr)

    if (repo / "requirements.txt").exists():
        if _tool_available("pip-audit"):
            r = session.run(Stage.SECURITY, ["pip-audit", "-r", "requirements.txt", "--format", "json"])
            if r.stdout:
                (repo / "report" / "pip_audit.json").write_text(r.stdout, encoding="utf-8")
                print("[koro] pip-audit -> report/pip_audit.json")
        else:
            print("[!] pip-audit not found -- pip audit skipped.", file=sys.stderr)

    # ── Stage 4: test suite ─────────────────────────────────────────────────
    print("[koro] running tests...")
    pkg_json  = repo / "package.json"
    pytest_ini = repo / "pytest.ini"
    pyproject  = repo / "pyproject.toml"

    if pkg_json.exists():
        if _tool_available("npm"):
            session.run(Stage.TEST, ["npm", "run", "test", "--silent"], timeout=300)
        else:
            print("[!] npm not found -- test stage skipped.", file=sys.stderr)
    elif pytest_ini.exists() or pyproject.exists():
        if _tool_available("python"):
            session.run(Stage.TEST, ["python", "-m", "pytest", "-q"])
        else:
            print("[!] python not found -- test stage skipped.", file=sys.stderr)

    # ── Stage 5: security tools ─────────────────────────────────────────────
    print("[koro] running security tools...")
    target = str(repo)
    if _tool_available("bandit"):
        session.run(Stage.SECURITY, ["bandit", "-r", target, "-q"])
    else:
        print("[!] bandit not installed -- not run.", file=sys.stderr)
    if _tool_available("semgrep"):
        session.run(Stage.SECURITY, ["semgrep", "--config", "auto", target, "--quiet"])
    else:
        print("[!] semgrep not installed -- not run.", file=sys.stderr)

    # ── Stage 6: merged report ──────────────────────────────────────────────
    print("[koro] generating merged report...")

    # Scanner bucket section
    from lib.report import emit, render_text
    buckets = emit(all_findings)
    scanner_section = render_text(buckets)

    # Agent session section
    agent_section = render_report(session)

    # Scan-error summary (if any modules failed to import/run)
    error_section = ""
    if scan_errors:
        error_section = (
            "\n" + "=" * 72 + "\n"
            "  SCANNER MODULE ERRORS\n"
            + "=" * 72 + "\n"
            + "\n".join(f"  [!] {e}" for e in scan_errors)
        )

    merged = "\n\n".join(filter(None, [scanner_section, agent_section, error_section]))

    report_path = repo / "report" / "koro_report.txt"
    report_path.write_text(merged, encoding="utf-8")

    print(f"[koro] report written -> {report_path}")
    print()
    print(merged)

    if scan_errors:
        sys.exit(1)


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="repopilot",
        description="Evidence-gated security and code analysis pipeline.",
    )
    parser.add_argument(
        "--repo",
        metavar="PATH",
        help="Path to the authorized source tree (overrides REPOPILOT_SRC).",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    p_inspect = sub.add_parser("inspect", help="Read files and record evidence.")
    p_inspect.add_argument("files", nargs="+", metavar="FILE")
    p_inspect.set_defaults(func=cmd_inspect)

    sub.add_parser("index",  help="Build and print the symbol index.").set_defaults(func=cmd_index)
    sub.add_parser("run",    help="Full pipeline: inspect -> test -> security -> report.").set_defaults(func=cmd_run)
    sub.add_parser("report", help="Print report from saved findings.json.").set_defaults(func=cmd_report)
    sub.add_parser(
        "koro",
        help="Full combined pipeline: scanner + tests + security + merged report.",
    ).set_defaults(func=cmd_koro)

    args = parser.parse_args()
    try:
        args.func(args)
    except InsufficientContext as exc:
        print("INSUFFICIENT CONTEXT:", file=sys.stderr)
        for m in exc.missing:
            print(f"  * {m}", file=sys.stderr)
        sys.exit(2)
    except KeyboardInterrupt:
        sys.exit(130)


if __name__ == "__main__":
    main()
