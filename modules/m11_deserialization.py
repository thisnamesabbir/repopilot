"""m11_deserialization — Unsafe deserialization patterns."""
from lib.scanner import scan

RULES = [{
    "id": "DSER-01",
    "title": "Unsafe deserialization of untrusted data",
    "severity": "HIGH",
    "confidence_hint": "Confirm whether the serialised data originates from an untrusted source (network, file upload, user-supplied string).",
    "patterns": [
        # Python pickle (always dangerous with untrusted input)
        r"pickle\.(?:load|loads)\s*\(",
        # PyYAML without safe Loader
        r"yaml\.load\s*\([^)]*(?!\bLoader\s*=\s*yaml\.(?:Safe|Base)Loader)",
        # JavaScript eval of JSON (should use JSON.parse; eval is dangerous)
        r"eval\s*\(\s*(?!typeof)[^)]*(?:JSON|json|response|data)",
        # PHP-style unserialize (in .php or mixed codebases)
        r"\bunserialize\s*\(",
        # Node.js serialize-javascript / node-serialize (known RCE gadget)
        r"(?:serialize|unserialize)\s*\([^)]*require",
    ],
}]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx", ".php"])
