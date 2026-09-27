import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { parseDiffLines, generateUnifiedDiff } from '../utils/diffUtils';
import { 
  GitCompare, 
  Download, 
  Copy, 
  Check, 
  CheckCircle2, 
  FileCode, 
  RotateCcw, 
  ArrowRight,
  Columns,
  AlignJustify
} from 'lucide-react';

export default function CodeDiffView() {
  const { 
    stagedChanges, 
    activeDiffIndex, 
    setActiveDiffIndex, 
    applyCodeChange, 
    revertCodeChange, 
    downloadPatchFile, 
    setActiveTab, 
    addToast 
  } = useRepoPilot();

  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copiedDiff, setCopiedDiff] = useState(false);

  const activeChange = stagedChanges[activeDiffIndex] || stagedChanges[0];

  const handleCopyDiff = () => {
    if (!activeChange) return;
    const diff = activeChange.diff || generateUnifiedDiff(activeChange.filePath, activeChange.oldCode, activeChange.newCode);
    navigator.clipboard.writeText(diff);
    setCopiedDiff(true);
    addToast('Diff Copied', 'info', `Copied git diff for ${activeChange.filePath}`);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  if (stagedChanges.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b0f17]">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <GitCompare className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">No Staged Code Changes</h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
          RepoPilot hasn't generated code diffs yet. Ask the AI assistant to implement a feature or plan changes to inspect syntax-highlighted diffs and export patches.
        </p>
        <button
          onClick={() => setActiveTab('assistant')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all"
        >
          <span>Ask AI Assistant: "Add protected routes"</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const diffLines = activeChange
    ? parseDiffLines(activeChange.filePath, activeChange.oldCode, activeChange.newCode)
    : [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17] overflow-hidden">
      {/* Top Diff Control Bar */}
      <div className="h-14 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* File Selector Tabs if multiple files */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md">
            {stagedChanges.map((change, idx) => {
              const isSelected = idx === activeDiffIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveDiffIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]">{change.filePath}</span>
                  <span className="text-[10px] text-emerald-300">+{change.linesAdded}</span>
                  <span className="text-[10px] text-rose-300">-{change.linesRemoved}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View mode toggle & action buttons */}
        <div className="flex items-center gap-2">
          {/* Unified vs Split Toggle */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'unified' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Unified View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Side-by-Side Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          <button
            onClick={handleCopyDiff}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
          >
            {copiedDiff ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Diff</span>
              </>
            )}
          </button>

          <button
            onClick={() => downloadPatchFile(activeChange)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .patch</span>
          </button>

          <button
            onClick={() => applyCodeChange(activeChange)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply to Workspace</span>
          </button>

          <button
            onClick={() => revertCodeChange(activeChange.filePath)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            title="Revert to original file version"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diff Meta Banner */}
      <div className="px-6 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 font-semibold">{activeChange.filePath}</span>
          <span className="text-slate-500">·</span>
          <span className="text-emerald-400">+{activeChange.linesAdded} additions</span>
          <span className="text-rose-400">-{activeChange.linesRemoved} deletions</span>
        </div>
        <span className="text-slate-400 text-[11px] truncate max-w-sm">
          {activeChange.description}
        </span>
      </div>

      {/* Main Diff Display Area */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        {viewMode === 'unified' ? (
          /* UNIFIED DIFF VIEW */
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60 divide-y divide-slate-850">
            {diffLines.map((line, idx) => {
              let bg = 'hover:bg-slate-900/40';
              let textClass = 'text-slate-300';
              let prefix = ' ';

              if (line.type === 'added') {
                bg = 'bg-emerald-950/30 hover:bg-emerald-950/50';
                textClass = 'text-emerald-300';
                prefix = '+';
              } else if (line.type === 'removed') {
                bg = 'bg-rose-950/30 hover:bg-rose-950/50';
                textClass = 'text-rose-300';
                prefix = '-';
              }

              return (
                <div key={idx} className={`flex items-stretch font-mono ${bg} transition-colors select-text`}>
                  {/* Old line number */}
                  <span className="w-12 text-right pr-2 py-0.5 text-[10px] text-slate-600 select-none bg-slate-950/80 shrink-0">
                    {line.oldLineNumber || ''}
                  </span>
                  {/* New line number */}
                  <span className="w-12 text-right pr-2 py-0.5 text-[10px] text-slate-600 select-none bg-slate-950/80 border-r border-slate-850 shrink-0">
                    {line.newLineNumber || ''}
                  </span>
                  {/* Prefix marker */}
                  <span className={`w-6 text-center py-0.5 select-none font-bold shrink-0 ${textClass}`}>
                    {prefix}
                  </span>
                  {/* Code Line */}
                  <span className={`flex-1 py-0.5 px-2 whitespace-pre overflow-x-auto ${textClass}`}>
                    {line.text || ' '}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* SPLIT SIDE-BY-SIDE DIFF VIEW */
          <div className="grid grid-cols-2 gap-2 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
            {/* Left: Original Code */}
            <div className="border-r border-slate-850 flex flex-col">
              <div className="p-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-rose-300 font-semibold flex items-center justify-between">
                <span>Original ({activeChange.filePath})</span>
                <span className="text-[10px] text-slate-500">Before</span>
              </div>
              <div className="p-3 overflow-auto max-h-[calc(100vh-14rem)] space-y-0.5 font-mono text-xs">
                {activeChange.oldCode.split('\n').map((line, i) => (
                  <div key={i} className="flex hover:bg-slate-900/40">
                    <span className="w-8 text-right pr-2 text-slate-600 select-none text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre overflow-x-auto text-slate-300">{line || ' '}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Modified Code */}
            <div className="flex flex-col">
              <div className="p-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-emerald-300 font-semibold flex items-center justify-between">
                <span>Proposed Changes</span>
                <span className="text-[10px] text-slate-500">After</span>
              </div>
              <div className="p-3 overflow-auto max-h-[calc(100vh-14rem)] space-y-0.5 font-mono text-xs">
                {activeChange.newCode.split('\n').map((line, i) => (
                  <div key={i} className="flex hover:bg-slate-900/40">
                    <span className="w-8 text-right pr-2 text-slate-600 select-none text-[10px] shrink-0">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre overflow-x-auto text-emerald-300">{line || ' '}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
