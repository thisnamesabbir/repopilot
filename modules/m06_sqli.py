"""m06_sqli — SQL injection."""
from lib.scanner import scan

RULES = [{
    "id": "SQLI-01",
    "title": "User-controlled input concatenated into SQL query",
    "severity": "CRITICAL",
    "confidence_hint": "Confirm the interpolated value derives from req/request/user_input and is not parameterised.",
    "patterns": [
        # String interpolation / concatenation directly in query call
        r"(?:db|conn|cursor|connection|pool)\.(?:query|execute|run)\s*\(\s*[`\"'].*\$\{",
        r"(?:db|conn|cursor|connection|pool)\.(?:query|execute|run)\s*\(\s*[\"'].*\+\s*(?:req\.|request\.|params\[|user_input)",
        r"cursor\.execute\s*\(\s*(?:f[\"']|[\"'].*%\s*(?:req\.|request\.))",
        # Raw ORM queries with interpolated input
        r"\.raw\s*\(\s*[`\"'].*\$\{",
        r"knex\.raw\s*\(",
        r"sequelize\.query\s*\([^,)]*\+",
    ],
}]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
