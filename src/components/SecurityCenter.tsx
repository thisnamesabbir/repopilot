import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { SecurityFinding, SecuritySeverity } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Key, 
  Lock, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Filter, 
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  FileDown
} from 'lucide-react';

export default function SecurityCenter() {
  const { 
    securityReport, 
    runSecurityReview, 
    exportMarkdownDocumentation,
    activeRepo, 
    setSelectedFilePath, 
    setActiveTab, 
    isLoading 
  } = useRepoPilot();

  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { name: 'Authentication', icon: <Key className="w-4 h-4" /> },
    { name: 'Authorization', icon: <Lock className="w-4 h-4" /> },
    { name: 'Secrets', icon: <ShieldAlert className="w-4 h-4" /> },
    { name: 'Input Validation', icon: <CheckCircle2 className="w-4 h-4" /> },
    { name: 'Dependencies', icon: <Layers className="w-4 h-4" /> },
    { name: 'API Security', icon: <Shield className="w-4 h-4" /> },
    { name: 'Configuration', icon: <AlertTriangle className="w-4 h-4" /> },
    { name: 'Common Web Security Risks', icon: <AlertCircle className="w-4 h-4" /> },
  ];

  const findings = securityReport?.findings || [];

  const filteredFindings = findings.filter(f => {
    const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSeverity && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17] overflow-hidden">
      {/* Top Security Subheader */}
      <div className="h-12 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-slate-200">Security Center & Code Vulnerability Audit</span>
          <span className="text-slate-500 font-mono">({findings.length} findings identified)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMarkdownDocumentation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/80 text-xs font-medium transition-colors"
            title="Export repository analysis and security findings as Markdown"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Export .md</span>
          </button>

          <button
            onClick={() => runSecurityReview()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Scanning Codebase...' : 'Run Security Review'}</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Security Policy & Boundary Disclosure Banner */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs leading-relaxed text-slate-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-100">Security Boundary Disclosure:</strong> RepoPilot evaluates repository source contents and developer-supplied evidence in memory using static AST heuristics and Google Gemini models. It does not perform unauthorized external network scanning, active penetration testing, or third-party infrastructure probing.
          </div>
        </div>

        {/* 8 Security Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              8 Core Project Security Domains
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">OWASP / NIST Guidelines</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => {
              const count = findings.filter(f => f.category === cat.name).length;
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={isSelected ? 'text-indigo-400' : 'text-slate-400'}>
                      {cat.icon}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      count > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </div>
                  <p className="text-xs font-semibold truncate">{cat.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 font-mono text-[11px]">Severity:</span>
            {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-indigo-400 hover:underline"
            >
              Reset Category ({selectedCategory})
            </button>
          )}
        </div>

        {/* Security Findings List */}
        {filteredFindings.length > 0 ? (
          <div className="space-y-4">
            {filteredFindings.map(finding => {
              let badgeColor = 'bg-blue-950 text-blue-300 border-blue-800/60';
              if (finding.severity === 'critical') badgeColor = 'bg-rose-950 text-rose-300 border-rose-800/60';
              else if (finding.severity === 'high') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800/60';
              else if (finding.severity === 'medium') badgeColor = 'bg-yellow-950 text-yellow-300 border-yellow-800/60';

              return (
                <div
                  key={finding.id}
                  className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-xl hover:border-slate-700 transition-colors"
                >
                  {/* Finding Title & Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${badgeColor}`}>
                        {finding.severity}
                      </span>
                      <h4 className="text-sm font-bold text-white">{finding.finding}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {finding.category}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedFilePath(finding.affectedFile);
                          setActiveTab('repository');
                        }}
                        className="flex items-center gap-1 text-[11px] font-mono text-indigo-300 hover:text-indigo-200 bg-slate-950 px-2 py-1 rounded border border-slate-800"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{finding.affectedFile}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Evidence Snippet */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                      Security Evidence in Codebase:
                    </span>
                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-850 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre">
                      {finding.evidence}
                    </pre>
                  </div>

                  {/* Why It Matters */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold">
                      Why It Matters (Threat Impact):
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                      {finding.whyItMatters}
                    </p>
                  </div>

                  {/* Recommended Fix */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">
                      Recommended Remediation:
                    </span>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {finding.recommendedFix}
                    </div>
                  </div>

                  {/* Validation Steps */}
                  {finding.validationSteps && finding.validationSteps.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold">
                        Verification & Validation Steps:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {finding.validationSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40 space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">No Security Issues In Current View</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {securityReport 
                ? 'No findings match the current severity or category filters.' 
                : 'Click "Run Security Review" to inspect repository secrets, authorization logic, input sanitization, and CORS headers.'}
            </p>
            {!securityReport && (
              <button
                onClick={() => runSecurityReview()}
                disabled={isLoading}
                className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow"
              >
                Run Codebase Security Review Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
