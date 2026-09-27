import React from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  Bot, 
  ShieldCheck, 
  FlaskConical, 
  GitCompare, 
  FolderGit2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Clock, 
  Terminal,
  Activity,
  Cpu,
  Layers,
  FileDown
} from 'lucide-react';

export default function DashboardView() {
  const { 
    activeRepo, 
    setActiveTab, 
    testSummary, 
    securityReport, 
    stagedChanges, 
    chatMessages, 
    activities, 
    analyzeRepository, 
    runSecurityReview, 
    runTestSuite,
    sendChatMessage,
    exportMarkdownDocumentation,
    isLoading 
  } = useRepoPilot();

  const aiTasksCount = chatMessages.filter(m => m.role === 'user').length;
  const analysis = activeRepo.analysis;

  const handleLaunchProtectedRoutes = () => {
    setActiveTab('assistant');
    sendChatMessage('Add protected routes to the dashboard.');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Hero Value Proposition Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Teammate for Real-World Codebases</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            RepoPilot understands your codebase, plans changes, generates implementation guidance, and helps validate your work.
          </h1>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Provide a code repository, request an engineering task, and get codebase-aware architecture analysis, strict implementation plans, verifiable code diffs, automated tests, and static security reviews.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleLaunchProtectedRoutes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Prompt: "Add protected routes to the dashboard."</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab('repository')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <span>Browse {activeRepo.files.length} Files</span>
            </button>

            <button
              onClick={() => runSecurityReview()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Run Security Audit</span>
            </button>

            <button
              onClick={() => exportMarkdownDocumentation()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer"
              title="Export repository analysis and security findings as Markdown"
            >
              <FileDown className="w-4 h-4 text-indigo-400" />
              <span>Export Report (.md)</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Dashboard Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Repo Card */}
        <div 
          onClick={() => setActiveTab('repository')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">Repository</span>
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="font-bold text-sm text-white truncate" title={activeRepo.name}>
            {activeRepo.name.split('—')[0].trim()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeRepo.isDemo ? 'Sample Project' : 'Custom Repo'}
          </span>
        </div>

        {/* Tech Stack Card */}
        <div 
          onClick={() => setActiveTab('repository')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">Tech Stack</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-bold text-sm text-white truncate">
            {activeRepo.techStack.slice(0, 2).join(', ')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            +{Math.max(0, activeRepo.techStack.length - 2)} more modules
          </span>
        </div>

        {/* Files Analyzed */}
        <div 
          onClick={() => setActiveTab('repository')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">Source Files</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <p className="font-bold text-xl text-white">{activeRepo.files.length}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {activeRepo.stats.codeLines} lines indexed
          </span>
        </div>

        {/* AI Tasks Completed */}
        <div 
          onClick={() => setActiveTab('assistant')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">AI Tasks</span>
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-bold text-xl text-white">{aiTasksCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stagedChanges.length} staged changes
          </span>
        </div>

        {/* Test Status */}
        <div 
          onClick={() => setActiveTab('tests')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">Test Status</span>
            <FlaskConical className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <p className={`font-bold text-xl ${testSummary.failed > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {testSummary.passed}/{testSummary.total}
            </p>
            {testSummary.failed > 0 && (
              <span className="text-[10px] text-rose-400 font-mono">({testSummary.failed} fail)</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {testSummary.isSimulated ? 'Demo Suite' : 'Executed'}
          </span>
        </div>

        {/* Security Status */}
        <div 
          onClick={() => setActiveTab('security')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase text-slate-500">Security Audit</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className={`font-bold text-xl ${securityReport ? 'text-amber-400' : 'text-slate-300'}`}>
            {securityReport ? `${securityReport.totalFindings} Findings` : 'Ready'}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {securityReport ? `${securityReport.highCount} high priority` : '8 Categories'}
          </span>
        </div>
      </div>

      {/* Codebase Analysis & Architecture Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Codebase Architecture & Intelligence</h3>
              </div>
              <button
                onClick={() => analyzeRepository()}
                disabled={isLoading}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Re-analyze'}
              </button>
            </div>

            {analysis ? (
              <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                <p className="text-slate-300">{analysis.overview}</p>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block font-mono">
                    System Architecture
                  </span>
                  <p className="text-slate-300">{analysis.architecture}</p>
                </div>

                {/* Important files */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono mb-2">
                    Key Architectural Modules
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.importantFiles.slice(0, 4).map((f, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveTab('repository')}
                        className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <span className="font-mono text-indigo-300 font-semibold block truncate">{f.path}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{f.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potential Issues */}
                {analysis.potentialIssues && analysis.potentialIssues.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block font-mono mb-2">
                      Identified Architectural Considerations
                    </span>
                    <div className="space-y-2">
                      {analysis.potentialIssues.map((issue, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{issue.title}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400">Codebase has not been analyzed yet.</p>
                <button
                  onClick={() => analyzeRepository()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Analyze Repository Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed & Quick Workflows */}
        <div className="space-y-6">
          {/* Quick Workflows */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/90 shadow-xl space-y-3">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Recommended Hackathon Tasks</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={handleLaunchProtectedRoutes}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors block">
                    Add Protected Routes
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Guard dashboard with token verification
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('assistant');
                  sendChatMessage('Fix the failing login test in TaskFlow');
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors block">
                    Fix Failing Test
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Debug dashboard unauthenticated view assertion
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={() => runSecurityReview()}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors block">
                    Security Vulnerability Audit
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Check JWT fallback secrets & wildcard CORS
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Activity Feed Snippet */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Recent Activity</span>
              </h3>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {activities.slice(0, 4).map(act => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
