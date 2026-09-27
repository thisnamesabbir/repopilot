"""m02_env_handling — Insecure environment variable usage."""
from lib.scanner import scan

RULES = [
    {
        "id": "ENV-01",
        "title": "Environment variable used directly in dangerous context without validation",
        "severity": "MEDIUM",
        "confidence_hint": "Trace whether the env var is user-influenced (e.g. set via request header).",
        "patterns": [
            # process.env.* fed directly into exec/eval/require
            r"(?:exec|execSync|eval|require)\s*\(\s*process\.env\.",
            # os.environ value directly interpolated into shell command
            r"os\.(?:system|popen)\s*\([^)]*os\.environ",
            r"subprocess\.\w+\s*\([^)]*os\.environ",
        ],
    },
    {
        "id": "ENV-02",
        "title": "Secret written to log or stdout",
        "severity": "MEDIUM",
        "confidence_hint": "Check whether the variable name resolves to an actual secret at runtime.",
        "patterns": [
            r"(?i)(?:console\.\w+|print|logger\.\w+)\s*\([^)]*(?:password|secret|token|api[_-]?key)",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx", ".sh", ".env"])
