"""m01_secrets — Hardcoded credential detection."""
from lib.scanner import scan

RULES = [{
    "id": "SEC-01",
    "title": "Hardcoded credential pattern in source",
    "severity": "CRITICAL",
    "confidence_hint": "Check git history; credential may have been committed and rotated already.",
    "patterns": [
        r"(?i)(api[_-]?key|apikey|secret|token|password|passwd|pwd)\s*[:=]\s*['\"][A-Za-z0-9_\-\/+]{12,}['\"]",
        r"sk_(live|test)_[A-Za-z0-9]{16,}",
        r"(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}",
        r"AKIA[0-9A-Z]{16}",
        r"xox[baprs]-[A-Za-z0-9\-]{10,}",
        r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----",
    ],
}]


def run(root):
    return scan(root, RULES)
