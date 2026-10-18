import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  FlaskConical, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Bug, 
  Sparkles, 
  ArrowRight, 
  FileCode, 
  Terminal,
  RotateCw,
  Info
} from 'lucide-react';

export default function TestDebugCenter() {
  const { 
    testSummary, 
    runTestSuite, 
    analyzeTestError, 
    testErrorDiagnostic, 
    setSelectedFilePath, 
    setActiveTab, 
    isLoading 
  } = useRepoPilot();

  const [activeSubTab, setActiveSubTab] = useState<'suite' | 'debugger'>('suite');
  const [errorLogInput, setErrorLogInput] = useState('');

  const sampleErrors = [
    {
      title: 'Dashboard Route Guard Failure (TaskFlow Demo)',
      snippet: `AssertionError: Expected ProtectedRoute redirect on unauthenticated user, but Dashboard rendered.
    at /taskflow/tests/routes.test.ts:48:15
    at async runTest (/node_modules/vitest/dist/runner.js:120:9)
    at Dashboard (/taskflow/src/components/Dashboard.tsx:32:11)`
    },
    {
      title: 'TypeError: Cannot read properties of null (reading "name")',
      snippet: `TypeError: Cannot read properties of null (reading 'name')
    at Navbar (/src/components/Navbar.tsx:28:34)
    at renderWithHooks (/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/node_modules/react-dom/cjs/react-dom.development.js:20103:13)`
    },
    {
      title: '401 Unauthorized Token Verification Failure',
      snippet: `JsonWebTokenError: jwt must be provided
    at module.exports (/node_modules/jsonwebtoken/verify.js:38:17)
    at requireAuth (/server/middleware/auth.ts:24:20)
    at Layer.handle [as handle_request] (/node_modules/express/lib/router/layer.js:95:5)`
    }
  ];

  const handleAnalyzeError = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorLogInput.trim()) return;
    await analyzeTestError(errorLogInput);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17] overflow-hidden">
      {/* Test Center Subheader */}
      <div className="h-12 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('suite')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === 'suite' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Test Runner</span>
            </button>
            <button
              onClick={() => setActiveSubTab('debugger')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === 'debugger' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Stack Trace Debugger</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => runTestSuite()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Running Suite...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Environment Distinction Banner (Required by prompt) */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {testSummary.isSimulated ? (
                <>
                  <strong className="text-white">DEMO ENVIRONMENT NOTICE:</strong> Test results shown in this dashboard are executed inside the isolated TaskFlow simulation sandbox to demonstrate pass/fail diagnostics without requiring live deployment infrastructure.
                </>
              ) : (
                <>
                  <strong className="text-white">LIVE ENVIRONMENT:</strong> Tests executed against provided repository sources.
                </>
              )}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
            {testSummary.isSimulated ? 'Simulated Runner' : 'Executed'}
          </span>
        </div>

        {activeSubTab === 'suite' ? (
          <>
            {/* Test Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-500">Total Tests</span>
                <p className="text-2xl font-bold text-white mt-1">{testSummary.total}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-500">Passed</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{testSummary.passed}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-500">Failed</span>
                <p className={`text-2xl font-bold mt-1 ${testSummary.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {testSummary.failed}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-500">Last Executed</span>
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  {testSummary.lastRun ? new Date(testSummary.lastRun).toLocaleTimeString() : 'Not run yet'}
                </p>
              </div>
            </div>

            {/* Test Items Table */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
              <div className="p-3 bg-slate-950/60 px-4 text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Test Specification</span>
                <span>Execution Result</span>
              </div>

              {testSummary.tests.map(test => (
                <div key={test.id} className="p-4 flex flex-col space-y-2 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {test.status === 'passed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : test.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] font-mono uppercase text-indigo-400 block">{test.suite}</span>
                        <p className="text-xs font-medium text-slate-200">{test.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-500">{test.durationMs}ms</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        test.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                  </div>

                  {/* Failure Trace Snippet & Quick AI Debug Trigger */}
                  {test.error && (
                    <div className="mt-2 p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-rose-300 text-[11px] font-semibold">Failure Details:</span>
                        <button
                          onClick={() => {
                            setErrorLogInput(test.error!);
                            setActiveSubTab('debugger');
                            analyzeTestError(test.error!);
                          }}
                          className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Diagnose with AI Debugger →</span>
                        </button>
                      </div>
                      <pre className="font-mono text-[11px] text-rose-200 whitespace-pre-wrap">{test.error}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          /* AI STACK TRACE DEBUGGER TAB */
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bug className="w-4 h-4 text-amber-400" />
                  <span>Analyze Error Log or Failing Stack Trace</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste any runtime error, failing Vitest/Jest output, or select a pre-populated TaskFlow sample to receive an AI root-cause analysis and code fix plan.
                </p>
              </div>

              {/* Sample Quick-Picks */}
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="text-[11px] text-slate-500 font-mono py-1">Quick Samples:</span>
                {sampleErrors.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setErrorLogInput(sample.snippet);
                      analyzeTestError(sample.snippet);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-left"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleAnalyzeError} className="space-y-3">
                <textarea
                  rows={6}
                  value={errorLogInput}
                  onChange={(e) => setErrorLogInput(e.target.value)}
                  placeholder="Paste terminal error log or test failure stack trace here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!errorLogInput.trim() || isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'Analyzing Trace...' : 'Analyze Error with AI'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* AI Diagnostic Output */}
            {testErrorDiagnostic && (
              <div className="p-6 rounded-xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-bold text-white">AI Diagnostic Report</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Codebase-Aware
                  </span>
                </div>

                {/* 1. Problem */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-rose-400 uppercase font-mono tracking-wider">
                    Identified Problem
                  </span>
                  <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {testErrorDiagnostic.problem}
                  </p>
                </div>

                {/* 2. Likely Cause */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase font-mono tracking-wider">
                    Likely Root Cause
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {testErrorDiagnostic.likelyCause}
                  </p>
                </div>

                {/* 3. Relevant Files */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase font-mono tracking-wider">
                    Relevant Files
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {testErrorDiagnostic.relevantFiles.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedFilePath(file);
                          setActiveTab('repository');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-indigo-300 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{file}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Recommended Fix */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase font-mono tracking-wider">
                    Recommended Fix
                  </span>
                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {testErrorDiagnostic.recommendedFix}
                  </div>
                </div>

                {/* 5. Test Plan */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase font-mono tracking-wider">
                    Verification Test Plan
                  </span>
                  <ul className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-xs text-slate-300">
                    {testErrorDiagnostic.testPlan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
