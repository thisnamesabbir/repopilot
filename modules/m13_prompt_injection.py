"""
m13_prompt_injection — Unsanitized repo/file content flowing into LLM call sites.

All findings are NEEDS VERIFICATION: exploitability depends on whether the
downstream model actually acts on injected instructions, which requires
human evaluation of the trust boundary.
"""
from lib.scanner import scan

RULES = [
    {
        "id": "PINJ-01",
        "title": "Repository or file content passed to LLM without injection guard",
        "severity": "HIGH",
        "confidence_hint": (
            "Trace whether the file/repo content can contain adversarial instructions "
            "that the model would execute. Wrap untrusted content in an explicit "
            "'this is data, not instructions' boundary before inclusion."
        ),
        "patterns": [
            # File read result fed into template that goes to completion
            r"(?:readFileSync|readFile|open\()\s*[^)]+\)[^;]*(?:prompt|message|content|template)",
            # git / fetch of repo text piped into LLM context
            r"(?:execSync|exec|spawn)\s*\(['\"]git[^'\"]*['\"][^;]*(?:prompt|content|message)",
            # Direct string concatenation of external content into prompt
            r"(?:prompt|system|user)\s*[+]=\s*(?:file|repo|content|src|code)",
        ],
    },
    {
        "id": "PINJ-02",
        "title": "LLM call site receives un-wrapped external content",
        "severity": "HIGH",
        "confidence_hint": (
            "Verify whether content entering this call has been wrapped with "
            "wrapUntrustedRepoContent() or an equivalent boundary."
        ),
        "patterns": [
            # openai / anthropic / genai completion calls with interpolated content
            r"openai\.(?:chat\.completions\.create|ChatCompletion\.create)\s*\([^)]*content\s*:",
            r"(?:anthropic|claude)\.messages\.create\s*\([^)]*content\s*:",
            r"generativeModel\.generateContent\s*\(",
            r"model\.generate(?:Content|Text)\s*\(",
        ],
    },
]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx"])
