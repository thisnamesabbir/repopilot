"""m07_xss_ssrf — Cross-site scripting and Server-side request forgery."""
from lib.scanner import scan

RULES = [
    {
        "id": "XSS-01",
        "title": "Unsanitized value rendered as raw HTML",
        "severity": "HIGH",
        "confidence_hint": "Confirm the value originates from user input and reaches innerHTML / dangerouslySetInnerHTML without escaping.",
        "patterns": [
            r"dangerouslySetInnerHTML\s*=\s*\{",
            r"innerHTML\s*=\s*(?!(?:\"[^\"]*\"|'[^']*'))",
            r"document\.write\s*\(",
            r"\.html\s*\(\s*(?!(?:\"[^\"]*\"|'[^']*'))",   # jQuery .html(variable)
            # Server-side: Python template without escaping
            r"Markup\s*\(",
            r"jinja2\.Template\(",
        ],
    },
    {
        "id": "SSRF-01",
        "title": "User-controlled URL in outbound HTTP request",
        "severity": "HIGH",
        "confidence_hint": "Check whether the URL is validated against an allowlist before the request is made.",
        "patterns": [
            r"(?:axios|fetch|got|node-fetch|requests\.get|requests\.post|urllib\.request\.urlopen)\s*\([^)]*(?:req\.(body|params|query)|request\.(args|json|form)|user_input)",
            r"https?\.(?:get|request)\s*\([^)]*(?:req\.|params\[)",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
