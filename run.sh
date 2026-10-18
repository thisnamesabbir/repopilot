#!/usr/bin/env bash
# run.sh — RepoPilot security scanner orchestrator
#
# Usage:
#   export REPOPILOT_SRC=/path/to/your/source
#   bash run.sh
#
# Or inline:
#   REPOPILOT_SRC=/path/to/your/source bash run.sh
#
# Output:
#   report/findings.json   — raw findings (all NEEDS VERIFICATION until validated)
#   report/npm_audit.json  — npm audit output (if package.json present)
#   report/pip_audit.json  — pip-audit output (if requirements.txt present)
#
# Security: REPOPILOT_SRC must be set explicitly; the script refuses to run
# against an unset or empty path.

set -euo pipefail

ROOT="${REPOPILOT_SRC:?Set REPOPILOT_SRC to your authorized source tree}"

# Ensure output directory exists
mkdir -p report

python3 - <<'PYEOF'
import os
import json
import importlib
import sys

root = os.environ["REPOPILOT_SRC"]

MODULES = [
    "m01_secrets",
    "m02_env_handling",
    "m03_path_traversal",
    "m04_uploads",
    "m05_command_exec",
    "m06_sqli",
    "m07_xss_ssrf",
    "m08_authz",
    "m09_api_input",
    "m10_headers",
    "m11_deserialization",
    "m12_logging",
    "m13_prompt_injection",
    "m14_deps",
]

out = []
errors = []

for mod_name in MODULES:
    try:
        mod = importlib.import_module(f"modules.{mod_name}")
        findings = mod.run(root)
        out.extend(findings)
        print(f"  [+] {mod_name}: {len(findings)} finding(s)")
    except Exception as exc:
        msg = f"{mod_name}: {exc}"
        errors.append(msg)
        print(f"  [!] {msg}", file=sys.stderr)

with open("report/findings.json", "w") as fh:
    json.dump(out, fh, indent=2)

print(f"\n[+] {len(out)} raw finding(s) written to report/findings.json")
print(f"    All findings start as NEEDS VERIFICATION — none are CONFIRMED until validated.")

if errors:
    print(f"\n[!] {len(errors)} module error(s):")
    for e in errors:
        print(f"    {e}", file=sys.stderr)
    sys.exit(1)
PYEOF

# Dependency audits — run only when the manifest is present; failures are non-fatal
if [ -f package.json ]; then
    if command -v npm &>/dev/null; then
        echo "[+] Running npm audit..."
        npm audit --json > report/npm_audit.json 2>/dev/null || true
    else
        echo "[!] npm not found — skipping npm audit"
    fi
fi

if [ -f requirements.txt ]; then
    if command -v pip-audit &>/dev/null; then
        echo "[+] Running pip-audit..."
        pip-audit -r requirements.txt --format json > report/pip_audit.json 2>/dev/null || true
    else
        echo "[!] pip-audit not found — skipping (install with: pip install pip-audit)"
    fi
fi

echo "[+] Done. Review report/ for output."
