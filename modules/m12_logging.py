"""m12_logging — Sensitive data leakage via logging."""
from lib.scanner import scan

RULES = [
    {
        "id": "LOG-01",
        "title": "Potentially sensitive field written to log",
        "severity": "MEDIUM",
        "confidence_hint": "Confirm whether the logged value contains credentials, PII, or session tokens at runtime.",
        "patterns": [
            r"(?i)(?:console\.\w+|logger\.\w+|log(?:ging)?\.(?:info|debug|warn|error|critical))\s*\([^)]*(?:password|passwd|secret|token|api[_-]?key|authorization|auth)",
            r"(?i)print\s*\([^)]*(?:password|secret|token)\s*[=:]",
        ],
    },
    {
        "id": "LOG-02",
        "title": "Full request/response object logged (may contain sensitive headers)",
        "severity": "LOW",
        "confidence_hint": "Check whether the logged object includes Authorization, Cookie, or Set-Cookie headers.",
        "patterns": [
            r"(?:console\.\w+|logger\.\w+)\s*\(\s*req\s*[,)]",
            r"(?:console\.\w+|logger\.\w+)\s*\(\s*request\s*[,)]",
            r"(?:console\.\w+|logger\.\w+)\s*\(\s*res\s*[,)]",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
