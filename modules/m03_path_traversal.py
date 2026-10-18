"""m03_path_traversal — Path traversal and Zip Slip."""
from lib.scanner import scan

RULES = [
    {
        "id": "PT-01",
        "title": "Unsanitized user input in filesystem path",
        "severity": "HIGH",
        "confidence_hint": "Confirm the variable originates from a request source and reaches open/read/write without path.normalize + boundary check.",
        "patterns": [
            r"(readFile|createReadStream|writeFile|fs\.(open|unlink|rmdir))\s*\([^)]*(req\.(params|query|body)|user_input)",
            r"open\s*\([^)]*(request\.(args|form|json)|params\[)",
            r"os\.path\.join\([^)]*(req\.|request\.|params)",
        ],
    },
    {
        "id": "ZS-01",
        "title": "ZIP extraction without member path validation (Zip Slip)",
        "severity": "HIGH",
        "confidence_hint": "Verify that member names are validated (no '../') before extraction target is resolved.",
        "patterns": [
            r"ZipFile\([^)]*\)\.extractall\(\s*[)\"]?",
            r"\.extractall\(",
            r"\b(?:unzip|adm-zip|unzipto)\b",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
