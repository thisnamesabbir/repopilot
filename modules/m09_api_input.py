"""m09_api_input — Missing or weak API input validation."""
from lib.scanner import scan

RULES = [
    {
        "id": "API-01",
        "title": "Request body used directly without schema validation",
        "severity": "MEDIUM",
        "confidence_hint": "Confirm whether a validation schema (Joi, Zod, Pydantic, express-validator) guards this path.",
        "patterns": [
            # req.body spread directly into DB call / object creation
            r"(?:create|insert|update|save)\s*\(\s*(?:\.\.\.)?req\.body\s*\)",
            r"(?:Model|Collection)\.\w+\(\s*req\.body\s*\)",
            # Python: ** unpacking request JSON straight into ORM
            r"\*\*request\.(?:json|get_json)\s*\(\s*\)",
        ],
    },
    {
        "id": "API-02",
        "title": "Mass-assignment / prototype pollution risk",
        "severity": "MEDIUM",
        "confidence_hint": "Ensure only whitelisted fields are assigned from user-supplied data.",
        "patterns": [
            r"Object\.assign\s*\(\s*\w+\s*,\s*req\.body\s*\)",
            r"\bmerge\s*\(\s*\w+\s*,\s*req\.body\s*\)",
            r"_\.(merge|extend|assign)\s*\([^,]+,\s*req\.body\s*\)",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
