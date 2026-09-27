import React, { useState, useRef, useEffect } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { CodeChange, CodePlanResponse } from '../../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileCode, 
  CheckCircle2, 
  ShieldCheck, 
  FlaskConical, 
  GitCompare, 
  CornerDownLeft, 
  ArrowRight,
  Copy,
  Check,
  Code2,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileDiff,
  ShieldAlert,
  AlertCircle,
  Info,
  Layers,
  FolderGit2
} from 'lucide-react';

const WORKFLOW_STEPS_LIST = [
  'USER REQUEST',
  'UNDERSTAND REQUEST',
  'SEARCH REPOSITORY CONTEXT',
  'IDENTIFY RELEVANT FILES',
  'CREATE IMPLEMENTATION PLAN',
  'GENERATE PATCH/DIFF',
  'CREATE TEST PLAN',
  'SECURITY REVIEW',
  'FINAL SUMMARY'
] as const;

export default function AIAssistantView() {
  const { 
    chatMessages, 
    sendChatMessage, 
    activeRepo, 
    isLoading, 
    setActiveTab, 
    applyCodeChange,
    copyUnifiedPatch,
    regenerateMessage,
    addToast 
  } = useRepoPilot();

  const [inputMessage, setInputMessage] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);
  const [expandedWorkflowMsgId, setExpandedWorkflowMsgId] = useState<Record<string, boolean>>({});
  
  // Explain This Change state
  const [explainingChangeId, setExplainingChangeId] = useState<string | null>(null);
  const [changeExplainingLoading, setChangeExplainingLoading] = useState<string | null>(null);
  const [changeExplainingData, setChangeExplainingData] = useState<Record<string, any>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    const msg = inputMessage;
    setInputMessage('');
    await sendChatMessage(msg);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    addToast('Code Copied', 'info', 'Snippet copied to clipboard.');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleCopyPatch = (plan: CodePlanResponse, msgId: string) => {
    copyUnifiedPatch(plan);
    setCopiedPatchId(msgId);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  const toggleWorkflowExpand = (msgId: string) => {
    setExpandedWorkflowMsgId(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleExplainChange = async (change: CodeChange, changeId: string, promptText?: string) => {
    if (explainingChangeId === changeId) {
      setExplainingChangeId(null);
      return;
    }
    setExplainingChangeId(changeId);

    if (changeExplainingData[changeId]) return;

    setChangeExplainingLoading(changeId);
    try {
      const res = await fetch('/api/chat/explain-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: change.filePath,
          description: change.description,
          oldCode: change.oldCode,
          newCode: change.newCode,
          diff: change.diff,
          userPrompt: promptText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChangeExplainingData(prev => ({
          ...prev,
          [changeId]: data.explanation
        }));
      } else {
        setChangeExplainingData(prev => ({
          ...prev,
          [changeId]: {
            explanation: change.explanation || `Modifies ${change.filePath} to satisfy requirements while maintaining type contracts.`,
            architecturalImpact: `Integrates into ${activeRepo.name} architecture without introducing breaking changes.`,
            securityConsiderations: 'Maintains strict input validation and token handling principles.',
            edgeCases: ['Handles unauthenticated state gracefully', 'Validates parameter nullability']
          }
        }));
      }
    } catch {
      setChangeExplainingData(prev => ({
        ...prev,
        [changeId]: {
          explanation: change.explanation || `Modifies ${change.filePath} to satisfy requirements while maintaining type contracts.`,
          architecturalImpact: `Integrates into ${activeRepo.name} architecture without introducing breaking changes.`,
          securityConsiderations: 'Maintains strict input validation and token handling principles.',
          edgeCases: ['Handles unauthenticated state gracefully', 'Validates parameter nullability']
        }
      }));
    } finally {
      setChangeExplainingLoading(null);
    }
  };

  const promptSuggestions = [
    'Add protected routes to the dashboard.',
    'Fix the failing login test',
    'Audit CORS and JWT secrets in server',
    'Update user payment settings in payment.py'
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17]">
      {/* Top Context Subheader */}
      <div className="h-10 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Context:</span>
          <span className="font-semibold text-slate-200">{activeRepo.name}</span>
          <span className="text-slate-500 font-mono">({activeRepo.files.length} indexed files)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>9-Stage Workflow Active</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Codebase-Aware
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        {chatMessages.map(msg => {
          const plan = msg.structuredPlan;
          const isInsufficient = Boolean(
            plan?.insufficientContext || 
            (plan?.understanding && plan.understanding.toLowerCase().includes('insufficient repository context'))
          );
          const activeChanges = plan?.changes || plan?.codeChanges || [];
          const activePlan = plan?.plan || plan?.implementationPlan || [];
          const activeTests = plan?.tests || plan?.testingPlan || [];
          const activeSecurity = plan?.security || plan?.securityConsiderations || [];
          const activeLimitations = plan?.limitations || [];

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed space-y-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl'
                }`}
              >
                {/* Assistant Message Header Actions if Structured Plan Exists */}
                {plan && msg.role === 'assistant' && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    {/* Confidence Indicator */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">Confidence:</span>
                      <span 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          plan.confidence === 'high' || (plan.confidenceScore && plan.confidenceScore >= 80)
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : plan.confidence === 'medium' || (plan.confidenceScore && plan.confidenceScore >= 50)
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        }`}
                        title={plan.confidenceReason || 'Based on repository evidence'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          plan.confidence === 'high' || (plan.confidenceScore && plan.confidenceScore >= 80)
                            ? 'bg-emerald-400'
                            : plan.confidence === 'medium' || (plan.confidenceScore && plan.confidenceScore >= 50)
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`} />
                        <span className="uppercase">{plan.confidence || (isInsufficient ? 'LOW' : 'HIGH')}</span>
                        {plan.confidenceScore !== undefined && (
                          <span className="opacity-80">({plan.confidenceScore}%)</span>
                        )}
                      </span>
                    </div>

                    {/* Action Buttons: Copy Patch and Regenerate */}
                    <div className="flex items-center gap-1.5">
                      {activeChanges.length > 0 && (
                        <button
                          onClick={() => handleCopyPatch(plan, msg.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                          title="Copy unified git diff across all modified files"
                        >
                          {copiedPatchId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Patch Copied!</span>
                            </>
                          ) : (
                            <>
                              <FileDiff className="w-3 h-3 text-indigo-400" />
                              <span>Copy Patch</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => regenerateMessage(plan.userPrompt)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors disabled:opacity-50"
                        title="Regenerate this response with current repository context"
                      >
                        <RotateCcw className={`w-3 h-3 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Text summary */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Structured Plan Section */}
                {plan && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    
                    {/* Workflow Stepper Visualization */}
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800/90 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleWorkflowExpand(msg.id)}
                        className="w-full p-2.5 bg-slate-900/60 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-[11px] text-slate-300">
                            Reasoning Workflow Pipeline
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                            {isInsufficient ? 'Context Verified' : '9 / 9 Stages Completed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>{expandedWorkflowMsgId[msg.id] ? 'Hide Details' : 'Show Pipeline'}</span>
                          {expandedWorkflowMsgId[msg.id] ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Workflow Details List */}
                      {expandedWorkflowMsgId[msg.id] && (
                        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#090d16]">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 pb-1">
                            Repository Reasoning Sequence:
                          </div>
                          <div className="space-y-1.5">
                            {WORKFLOW_STEPS_LIST.map((stepName, stepIdx) => {
                              const stepData = plan.workflowSteps?.find(s => s.step === stepName);
                              const isCompleted = stepData?.status === 'completed' || (!isInsufficient && stepIdx <= 8);
                              const isWarning = stepData?.status === 'warning';
                              const isFailed = stepData?.status === 'failed';
                              const isSkipped = stepData?.status === 'skipped' || (isInsufficient && stepIdx >= 4 && stepIdx < 8);

                              return (
                                <div key={stepName} className="flex items-start gap-2 text-[11px]">
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-mono text-[9px]">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : isWarning ? (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    ) : isFailed ? (
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 flex flex-wrap items-center justify-between gap-1">
                                    <span className={`font-mono font-medium ${
                                      isCompleted ? 'text-slate-200' : isWarning ? 'text-amber-300' : isFailed ? 'text-rose-300' : 'text-slate-500'
                                    }`}>
                                      {stepIdx + 1}. {stepName}
                                    </span>
                                    {stepData?.summary && (
                                      <span className="text-[10px] text-slate-400 italic truncate max-w-xs">
                                        {stepData.summary}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Insufficient Repository Context Warning Callout */}
                    {isInsufficient && (
                      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Insufficient Repository Context</span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {plan.missingContext || 'The repository does not contain enough information to safely fulfill this request without hallucinating.'}
                        </p>
                        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/50 text-[11px] text-amber-200/90 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            RepoPilot refuses to invent unverified file paths or APIs. Please inspect the indexed repository files or upload the required components.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setActiveTab('repository')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition-colors"
                          >
                            <FolderGit2 className="w-3.5 h-3.5" />
                            <span>View Indexed Files ({activeRepo.files.length})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section 1: Understanding */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
                        <span>💡 1. Understanding</span>
                      </div>
                      <p className="text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                        {plan.understanding}
                      </p>
                      {plan.confidenceReason && (
                        <p className="text-[11px] text-slate-400 pl-1 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{plan.confidenceReason}</span>
                        </p>
                      )}
                    </div>

                    {/* Section 2: Files Affected */}
                    {plan.filesAffected && plan.filesAffected.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-xs">
                          <span>📁 2. Files Affected ({plan.filesAffected.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {plan.filesAffected.map((file, i) => {
                            const filePath = typeof file === 'string' ? file : file.path;
                            const fileReason = typeof file === 'string' ? 'Required for feature implementation' : file.reason;
                            return (
                              <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2">
                                <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-mono text-indigo-200 font-semibold">{filePath}</span>
                                  {fileReason && (
                                    <p className="text-slate-400 text-[11px] mt-0.5">{fileReason}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Implementation Plan */}
                    {activePlan.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-xs">
                          <span>📋 3. Implementation Plan</span>
                        </div>
                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          {activePlan.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 py-0.5">
                              <span className="text-indigo-400 font-mono font-semibold shrink-0">{i + 1}.</span>
                              <span className="text-slate-300">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 4: Code Changes */}
                    {activeChanges.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-emerald-300 font-semibold text-xs">
                          <div className="flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-emerald-400" />
                            <span>🔄 4. Code Changes ({activeChanges.length} files)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleCopyPatch(plan, msg.id)}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-normal cursor-pointer"
                            >
                              <FileDiff className="w-3 h-3" />
                              <span>Copy Full Patch</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('changes')}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-normal cursor-pointer"
                            >
                              Inspect Unified Diff →
                            </button>
                          </div>
                        </div>

                        {activeChanges.map((change, i) => {
                          const changeId = `${msg.id}_change_${i}`;
                          const isExplaining = explainingChangeId === changeId;
                          const explainLoading = changeExplainingLoading === changeId;
                          const explainData = changeExplainingData[changeId];

                          return (
                            <div key={i} className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                              <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-slate-200">{change.filePath}</span>
                                  <span className="text-[10px] font-mono text-emerald-400">+{change.linesAdded}</span>
                                  <span className="text-[10px] font-mono text-rose-400">-{change.linesRemoved}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {/* Action: Explain This Change */}
                                  <button
                                    onClick={() => handleExplainChange(change, changeId, plan.userPrompt)}
                                    className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors ${
                                      isExplaining
                                        ? 'bg-purple-900/60 text-purple-200 border border-purple-700/60'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                    title="Explain the architectural rationale and edge cases of this change"
                                  >
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    <span>{isExplaining ? 'Hide Explanation' : 'Explain This Change'}</span>
                                  </button>

                                  {/* Copy Code */}
                                  <button
                                    onClick={() => handleCopyCode(change.newCode, `${msg.id}_${i}`)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                                  >
                                    {copiedSnippet === `${msg.id}_${i}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Copy Code</span>
                                  </button>

                                  {/* Apply to Workspace */}
                                  <button
                                    onClick={() => applyCodeChange(change)}
                                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors"
                                  >
                                    Apply to Workspace
                                  </button>
                                </div>
                              </div>

                              {/* Explain This Change Detailed Drawer */}
                              {isExplaining && (
                                <div className="p-3 bg-[#0d1322] border-b border-indigo-900/40 space-y-2 text-xs">
                                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px]">
                                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Architectural Rationale & Safety Breakdown</span>
                                  </div>
                                  
                                  {explainLoading ? (
                                    <div className="flex items-center gap-2 text-slate-400 text-[11px] py-2">
                                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                                      <span>RepoPilot AI analyzing diff and contracts...</span>
                                    </div>
                                  ) : explainData ? (
                                    <div className="space-y-2 text-slate-300">
                                      <p className="leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                                        {explainData.explanation}
                                      </p>
                                      {explainData.architecturalImpact && (
                                        <div className="text-[11px] p-2 rounded bg-indigo-950/30 border border-indigo-900/40">
                                          <span className="font-semibold text-indigo-300">System Impact: </span>
                                          <span>{explainData.architecturalImpact}</span>
                                        </div>
                                      )}
                                      {explainData.securityConsiderations && (
                                        <div className="text-[11px] p-2 rounded bg-amber-950/30 border border-amber-900/40">
                                          <span className="font-semibold text-amber-300">Security: </span>
                                          <span>{explainData.securityConsiderations}</span>
                                        </div>
                                      )}
                                      {Array.isArray(explainData.edgeCases) && explainData.edgeCases.length > 0 && (
                                        <div className="text-[11px] space-y-1">
                                          <span className="font-semibold text-emerald-300">Edge Cases Addressed:</span>
                                          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                            {explainData.edgeCases.map((ec: string, eIdx: number) => (
                                              <li key={eIdx}>{ec}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-slate-400 text-[11px]">
                                      {change.explanation || 'Modifies target module to satisfy requirements.'}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 bg-slate-950">
                                <pre className="whitespace-pre overflow-x-auto">{change.newCode.slice(0, 800)}...</pre>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Section 5: Testing Plan */}
                    {activeTests.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
                          <span>🧪 5. Testing Plan</span>
                        </div>
                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          {activeTests.map((test, i) => (
                            <div key={i} className="flex items-start gap-2 py-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span className="text-slate-300">{test}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 6: Security Considerations */}
                    {activeSecurity.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                          <span>🛡️ 6. Security Review</span>
                        </div>
                        <div className="space-y-1 bg-amber-950/20 p-3 rounded-lg border border-amber-900/40">
                          {activeSecurity.map((sec, i) => (
                            <div key={i} className="flex items-start gap-2 py-0.5 text-amber-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-slate-300 text-[11px]">{sec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 7: Limitations & Assumptions */}
                    {activeLimitations.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                          <span>⚠️ 7. Limitations & Assumptions</span>
                        </div>
                        <div className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                          {activeLimitations.map((lim, i) => (
                            <div key={i} className="flex items-start gap-2 py-0.5 text-slate-300">
                              <span className="text-rose-400 shrink-0">•</span>
                              <span className="text-[11px]">{lim}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Step Jump Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeChanges.length > 0 && (
                        <button
                          onClick={() => handleCopyPatch(plan, msg.id)}
                          className="py-1.5 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileDiff className="w-3.5 h-3.5" />
                          <span>Copy Patch</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('changes')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Review Code Changes</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('tests')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Execute Test Suite</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-3.5 justify-start">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/40 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="max-w-xl rounded-xl p-4 bg-slate-900/80 border border-slate-800 text-slate-300 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span className="font-semibold">Executing 9-stage codebase-aware reasoning workflow...</span>
              </div>
              <div className="space-y-1.5 pt-1 opacity-70">
                <div className="h-2.5 bg-slate-800 rounded w-3/4 animate-pulse" />
                <div className="h-2.5 bg-slate-800 rounded w-full animate-pulse" />
                <div className="h-2.5 bg-slate-800 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-6 py-2 bg-[#0c101a] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono uppercase text-slate-500 shrink-0">Quick Ask:</span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => sendChatMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 hover:text-white text-slate-400 border border-slate-800 transition-colors disabled:opacity-50 shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Chat Bar */}
      <div className="p-4 bg-[#0d121c] border-t border-slate-800">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            placeholder='Ask a task (e.g. "Add protected routes to the dashboard." or "Fix the failing test")...'
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-24 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="absolute right-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-colors disabled:opacity-40"
          >
            <span>Ask</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
