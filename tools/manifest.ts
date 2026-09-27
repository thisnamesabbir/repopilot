import fs from "node:fs";
import path from "node:path";
import { Boundary } from "../core/boundary.ts";
import { ToolResult, makeResult } from "../core/result.ts";
import { run } from "../core/runner.ts";

export interface Advisory {
  id: string;
  module: string;
  severity: string;
  title: string;
  range: string;
  fixAvailable: string | boolean;
}

export interface ManifestInfo {
  ecosystem: "node" | "python" | "rust";
  manifestFile: string;
  advisories: Advisory[];
}

// ── Node / npm ────────────────────────────────────────────────────────────────

function parseNpmAudit(raw: string): Advisory[] {
  try {
    const json = JSON.parse(raw) as {
      vulnerabilities?: Record<
        string,
        {
          severity: string;
          via: Array<string | { title?: string; url?: string; range?: string }>;
          fixAvailable: boolean | { name: string };
        }
      >;
    };
    const vulns = json.vulnerabilities ?? {};
    return Object.entries(vulns).map(([name, v]) => {
      const via = v.via.find((x): x is { title?: string; range?: string } => typeof x === "object");
      return {
        id: name,
        module: name,
        severity: v.severity,
        title: via?.title ?? name,
        range: via?.range ?? "unknown",
        fixAvailable:
          typeof v.fixAvailable === "object" ? v.fixAvailable.name : v.fixAvailable,
      };
    });
  } catch {
    return [];
  }
}

async function analyzeNode(b: Boundary): Promise<ToolResult<ManifestInfo>> {
  const r = makeResult<ManifestInfo>("manifest", "npm-audit");
  const manifestFile = "package.json";

  if (!fs.existsSync(path.join(b.root, manifestFile))) {
    r.status = "not_verified";
    r.limitations.push("No package.json found.");
    return r;
  }

  const auditResult = await run(b, {
    tool: "manifest",
    operation: "npm-audit",
    binary: "npm",
    args: ["audit", "--json"],
  });

  if (auditResult.status === "failed" && !auditResult.stdout) {
    r.status = "not_verified";
    r.limitations.push("npm audit not available or failed to produce output.");
    r.evidence.push(...auditResult.evidence);
    return r;
  }

  const advisories = parseNpmAudit(auditResult.stdout ?? "");
  r.result = { ecosystem: "node", manifestFile, advisories };
  r.status = "success";
  r.evidence.push(...auditResult.evidence);
  return r;
}

// ── Python / pip-audit ────────────────────────────────────────────────────────

function parsePipAudit(raw: string): Advisory[] {
  try {
    const json = JSON.parse(raw) as Array<{
      name: string;
      version: string;
      vulns: Array<{ id: string; fix_versions: string[]; description: string }>;
    }>;
    const results: Advisory[] = [];
    for (const pkg of json) {
      for (const v of pkg.vulns) {
        results.push({
          id: v.id,
          module: pkg.name,
          severity: "unknown",
          title: v.description.slice(0, 100),
          range: pkg.version,
          fixAvailable: v.fix_versions.join(", ") || false,
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function analyzePython(b: Boundary): Promise<ToolResult<ManifestInfo>> {
  const r = makeResult<ManifestInfo>("manifest", "pip-audit");
  const manifestFile = fs.existsSync(path.join(b.root, "pyproject.toml"))
    ? "pyproject.toml"
    : "requirements.txt";

  if (!fs.existsSync(path.join(b.root, manifestFile))) {
    r.status = "not_verified";
    r.limitations.push("No requirements.txt or pyproject.toml found.");
    return r;
  }

  const auditResult = await run(b, {
    tool: "manifest",
    operation: "pip-audit",
    binary: "pip-audit",
    args: ["--format=json"],
  });

  if (auditResult.status === "failed" && !auditResult.stdout) {
    r.status = "not_verified";
    r.limitations.push("pip-audit not installed or failed to produce output.");
    r.evidence.push(...auditResult.evidence);
    return r;
  }

  const advisories = parsePipAudit(auditResult.stdout ?? "");
  r.result = { ecosystem: "python", manifestFile, advisories };
  r.status = "success";
  r.evidence.push(...auditResult.evidence);
  return r;
}

// ── Rust / cargo audit ───────────────────────────────────────────────────────

function parseCargoAudit(raw: string): Advisory[] {
  try {
    const json = JSON.parse(raw) as {
      vulnerabilities?: {
        list: Array<{
          advisory: { id: string; title: string; patched_versions: string[] };
          package: { name: string; version: string };
          versions: { patched: string[] };
        }>;
      };
    };
    return (json.vulnerabilities?.list ?? []).map((v) => ({
      id: v.advisory.id,
      module: v.package.name,
      severity: "unknown",
      title: v.advisory.title,
      range: v.package.version,
      fixAvailable: v.versions.patched.join(", ") || false,
    }));
  } catch {
    return [];
  }
}

async function analyzeRust(b: Boundary): Promise<ToolResult<ManifestInfo>> {
  const r = makeResult<ManifestInfo>("manifest", "cargo-audit");
  const manifestFile = "Cargo.toml";

  if (!fs.existsSync(path.join(b.root, manifestFile))) {
    r.status = "not_verified";
    r.limitations.push("No Cargo.toml found.");
    return r;
  }

  const auditResult = await run(b, {
    tool: "manifest",
    operation: "cargo-audit",
    binary: "cargo",
    args: ["audit", "--json"],
  });

  if (auditResult.status === "failed" && !auditResult.stdout) {
    r.status = "not_verified";
    r.limitations.push("cargo-audit not installed or failed to produce output.");
    r.evidence.push(...auditResult.evidence);
    return r;
  }

  const advisories = parseCargoAudit(auditResult.stdout ?? "");
  r.result = { ecosystem: "rust", manifestFile, advisories };
  r.status = "success";
  r.evidence.push(...auditResult.evidence);
  return r;
}

// ── Public entry point ───────────────────────────────────────────────────────

/** Runs all applicable manifest audits and returns one result per discovered ecosystem. */
export async function analyzeManifests(
  b: Boundary,
): Promise<Array<ToolResult<ManifestInfo>>> {
  const results: Array<ToolResult<ManifestInfo>> = [];

  const nodePresent =
    fs.existsSync(path.join(b.root, "package.json")) ||
    fs.existsSync(path.join(b.root, "package-lock.json"));
  const pythonPresent =
    fs.existsSync(path.join(b.root, "requirements.txt")) ||
    fs.existsSync(path.join(b.root, "pyproject.toml"));
  const rustPresent = fs.existsSync(path.join(b.root, "Cargo.toml"));

  if (nodePresent)   results.push(await analyzeNode(b));
  if (pythonPresent) results.push(await analyzePython(b));
  if (rustPresent)   results.push(await analyzeRust(b));

  if (results.length === 0) {
    const r = makeResult<ManifestInfo>("manifest", "analyze-manifests");
    r.status = "not_verified";
    r.limitations.push("No supported manifest file found (package.json, requirements.txt, pyproject.toml, Cargo.toml).");
    results.push(r);
  }

  return results;
}
