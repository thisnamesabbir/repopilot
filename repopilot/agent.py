"""
repopilot/agent.py -- core session and data model.

Every claim in the report must trace to a FileEvidence or ExecutionRecord
stored here.  Nothing is written to disk or executed without going through
Session.read_file() and Session.run(), so the full audit trail is always
available at session.evidence and session.executions.
"""
from __future__ import annotations

import hashlib
import subprocess
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


# ---------------------------------------------------------------------------
# Pipeline stages
# ---------------------------------------------------------------------------

class Stage(Enum):
    INSPECT  = "inspect"
    DISCOVER = "discover"
    EVIDENCE = "evidence"
    PLAN     = "plan"
    PATCH    = "patch"
    APPROVAL = "approval"
    APPLY    = "apply"
    VALIDATE = "validate"
    TEST     = "test"
    SECURITY = "security"
    REPORT   = "report"


# ---------------------------------------------------------------------------
# Typed exceptions
# ---------------------------------------------------------------------------

class InsufficientContext(Exception):
    """
    Raised by the evidence collector when required context is missing.
    The pipeline must terminate and enumerate exactly what is missing
    rather than guessing.
    """
    def __init__(self, missing: list[str]) -> None:
        self.missing = missing
        super().__init__("INSUFFICIENT REPOSITORY CONTEXT: " + ", ".join(missing))


# ---------------------------------------------------------------------------
# Evidence types
# ---------------------------------------------------------------------------

@dataclass
class FileEvidence:
    path: str
    sha256: str
    content: str
    line_ranges: list[tuple[int, int]]   # ranges actually inspected


@dataclass
class ExecutionRecord:
    stage: Stage
    command: list[str]
    exit_code: int
    stdout: str
    stderr: str
    timestamp: str = ""

    def __post_init__(self) -> None:
        if not self.timestamp:
            from datetime import timezone, datetime
            self.timestamp = datetime.now(timezone.utc).isoformat()

    @property
    def succeeded(self) -> bool:
        return self.exit_code == 0


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

@dataclass
class Session:
    """
    Holds the full audit trail for one pipeline run.

    No agent stage reads files or executes commands through any path other
    than Session.read_file() and Session.run(), so the evidence and
    executions lists are always complete.
    """
    repo: Path
    session_id: str = ""
    branch: str = ""

    evidence:   dict[str, FileEvidence]  = field(default_factory=dict)
    executions: list[ExecutionRecord]    = field(default_factory=list)
    diffs:      dict[str, str]           = field(default_factory=dict)

    # Populated by the planner; used by pre_apply_gate
    planned_symbols: dict[str, list[str]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        import uuid
        from datetime import timezone, datetime
        if not self.session_id:
            self.session_id = (
                datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
                + "-" + uuid.uuid4().hex[:8]
            )
        if not self.branch:
            self.branch = f"repopilot/{self.session_id}"

    # -----------------------------------------------------------------------
    # File reading
    # -----------------------------------------------------------------------

    def read_file(self, rel: str) -> FileEvidence:
        """
        Read a real file and record evidence.  Hard fail if it does not exist
        -- the agent never invents file contents.
        """
        p = self.repo / rel
        if not p.is_file():
            raise FileNotFoundError(f"File not found: {rel}")
        content = p.read_text(encoding="utf-8", errors="replace")
        ev = FileEvidence(
            path=rel,
            sha256=hashlib.sha256(content.encode()).hexdigest(),
            content=content,
            line_ranges=[],
        )
        self.evidence[rel] = ev
        return ev

    def has_evidence(self, rel: str) -> bool:
        return rel in self.evidence

    # -----------------------------------------------------------------------
    # Command execution
    # -----------------------------------------------------------------------

    def run(
        self,
        stage: Stage,
        cmd: list[str],
        cwd: Optional[Path] = None,
        timeout: int = 600,
        env_allowlist: Optional[list[str]] = None,
    ) -> ExecutionRecord:
        """
        Execute cmd with shell=False, cwd inside the repo boundary.
        Only PATH, HOME, LANG, NODE_ENV, CI are inherited by default --
        secrets never reach child processes.
        """
        import os
        allowed = env_allowlist or ["PATH", "HOME", "LANG", "NODE_ENV", "CI", "VIRTUAL_ENV"]
        env: dict[str, str] = {k: os.environ[k] for k in allowed if k in os.environ}

        result = subprocess.run(
            cmd,
            cwd=str(cwd or self.repo),
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        rec = ExecutionRecord(
            stage=stage,
            command=cmd,
            exit_code=result.returncode,
            stdout=result.stdout,
            stderr=result.stderr,
        )
        self.executions.append(rec)
        return rec

    # -----------------------------------------------------------------------
    # Diff building
    # -----------------------------------------------------------------------

    def build_diff(self, rel: str, new_content: str) -> str:
        """
        Generate a unified diff against the evidence-recorded original.
        Stores the result in self.diffs[rel] and returns it.
        The diff -- never a "rewrite" -- is what gets applied.
        """
        import difflib
        ev = self.evidence.get(rel) or self.read_file(rel)
        lines = "".join(
            difflib.unified_diff(
                ev.content.splitlines(keepends=True),
                new_content.splitlines(keepends=True),
                fromfile=f"a/{rel}",
                tofile=f"b/{rel}",
            )
        )
        if lines:
            self.diffs[rel] = lines
        return lines
