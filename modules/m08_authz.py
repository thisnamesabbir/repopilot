"""m08_authz — Authorisation / access-control patterns."""
from lib.scanner import scan

RULES = [
    {
        "id": "AUTHZ-01",
        "title": "Route handler missing authentication middleware",
        "severity": "HIGH",
        "confidence_hint": "Confirm this route is intentionally public, or add authentication middleware.",
        "patterns": [
            # Express routes defined without apparent auth guard before handler
            r"app\.(?:get|post|put|patch|delete)\s*\(\s*['\"][^'\"]+['\"](?:\s*,\s*(?!(?:auth|requireAuth|isAuthenticated|passport|verifyToken|checkToken|middleware))\w+)*\s*,\s*(?:async\s+)?\(",
            # FastAPI route without Depends(get_current_user) or similar
            r"@(?:app|router)\.(?:get|post|put|patch|delete)\s*\([^)]*\)\s*\n[^#\n]*async\s+def\s+\w+\s*\(\s*(?!\s*\w+\s*:\s*\w+\s*=\s*Depends)",
        ],
    },
    {
        "id": "AUTHZ-02",
        "title": "User role/permission derived from client-supplied value",
        "severity": "HIGH",
        "confidence_hint": "Roles must be resolved from a server-side session or token, never from the request body/params.",
        "patterns": [
            r"req\.body\.(?:role|admin|isAdmin|permission|scope)",
            r"request\.(?:json|form|args)\.get\s*\(\s*['\"](?:role|admin|permission|scope)['\"]",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
