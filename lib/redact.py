import re

# Ordered from most-specific to least-specific so earlier subs don't clobber later ones.
PATTERNS = [
    # Stripe-style live/test secret keys and GitHub tokens
    (r'(sk_live_|sk_test_|ghp_|gho_|github_pat_)[A-Za-z0-9_\-]{8,}', r'\1****************'),
    # AWS access key — keep 4-char prefix for identification
    (r'(AKIA[0-9A-Z]{4})[0-9A-Z]{12}', r'\1****************'),
    # PEM private key block (single-line match; scanner feeds individual lines)
    (r'(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----).*', r'\1[REDACTED]'),
    # Generic key/secret/token/password assignment
    (r'(?i)(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["\']?[^"\',\s]{4,}',
     r'\1: [REDACTED]'),
]


def redact(text: str) -> str:
    """Apply all redaction patterns to text; returns sanitised copy."""
    for pat, rep in PATTERNS:
        text = re.sub(pat, rep, text)
    return text
