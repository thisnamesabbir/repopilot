"""m04_uploads — Unrestricted file upload handling."""
from lib.scanner import scan

RULES = [
    {
        "id": "UPL-01",
        "title": "File upload stored without extension/MIME validation",
        "severity": "HIGH",
        "confidence_hint": "Confirm whether extension and MIME type are checked before the file is persisted or executed.",
        "patterns": [
            # Multer / busboy / formidable save without apparent filter
            r"multer\(\s*\{[^}]*storage",
            r"formidable\(\)|new\s+Formidable\(",
            r"request\.files\b",
            # Python Flask/Django upload
            r"request\.files\[",
            r"\.save\(\s*os\.path\.join",
        ],
    },
    {
        "id": "UPL-02",
        "title": "Uploaded filename used directly in filesystem path",
        "severity": "HIGH",
        "confidence_hint": "Original filenames are attacker-controlled; check for sanitisation before use.",
        "patterns": [
            r"\.filename\b",           # werkzeug / Flask filename attribute
            r"file\.originalname\b",   # multer originalname
            r"req\.file\.name\b",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
