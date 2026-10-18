"""
m10_headers — HTTP security-header checklist.

Scope: emits INFORMATIONAL findings pointing at header-setting code
only for the local dev server. Does NOT probe any live host.
Manual verification step: run the local server and check the response
headers with `curl -I http://localhost:<port>`.
"""
from lib.scanner import scan

RULES = [
    {
        "id": "HDR-01",
        "title": "Content-Security-Policy header may be absent or too permissive",
        "severity": "INFORMATIONAL",
        "confidence_hint": "Verify with: curl -sI http://localhost:<port> | grep -i content-security-policy",
        "patterns": [
            r"(?i)content.security.policy",          # any existing CSP reference
            r"helmet\s*\(",                          # helmet.js usage (may need config)
            r"res\.setHeader\s*\(",                  # generic header-setting for review
        ],
    },
    {
        "id": "HDR-02",
        "title": "Strict-Transport-Security (HSTS) header may be absent",
        "severity": "INFORMATIONAL",
        "confidence_hint": "Verify with: curl -sI http://localhost:<port> | grep -i strict-transport",
        "patterns": [
            r"(?i)strict.transport.security",
            r"hsts\s*[({]",
        ],
    },
    {
        "id": "HDR-03",
        "title": "X-Frame-Options or frame-ancestors CSP directive may be absent",
        "severity": "INFORMATIONAL",
        "confidence_hint": "Verify with: curl -sI http://localhost:<port> | grep -i x-frame-options",
        "patterns": [
            r"(?i)x.frame.options",
            r"(?i)frame.ancestors",
        ],
    },
]


def run(root):
    # Headers module is informational only — no severity escalation
    findings = scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
    for f in findings:
        f["status"] = "INFORMATIONAL"
    return findings
