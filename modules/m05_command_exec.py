"""m05_command_exec — Child-process / command injection."""
from lib.scanner import scan

RULES = [{
    "id": "CMD-01",
    "title": "User-controlled input reaches process execution",
    "severity": "HIGH",
    "confidence_hint": "Trace the data-flow from the matched source to this sink. shell:false with a literal argv array is safe; string interpolation is not.",
    "patterns": [
        # Node child_process with request-derived argument
        r"(?:child_process\.)?(?:exec|execSync|spawn|spawnSync)\s*\([^;]*\b(?:req\.(?:body|params|query)|process\.argv|request\.|user_input)",
        # Python subprocess with shell=True (always dangerous with user data)
        r"subprocess\.(?:run|call|Popen|check_output)\s*\([^)]*shell\s*=\s*True",
        # Python os.system / os.popen (always shell-interpreted)
        r"os\.(?:system|popen)\s*\(",
        # JavaScript eval with non-literal argument
        r"eval\s*\(\s*(?!(?:typeof|['\"`]))",
    ],
}]


def run(root):
    return scan(root, RULES, include_ext=[".py", ".js", ".ts", ".jsx", ".tsx", ".sh"])
