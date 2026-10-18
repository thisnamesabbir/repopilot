import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  Folder, 
  FileCode, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  FolderGit2, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  FileText,
  Code2,
  Cpu,
  Info,
  FileDown
} from 'lucide-react';

interface RepositoryViewProps {
  onOpenImportModal: () => void;
}

export default function RepositoryView({ onOpenImportModal }: RepositoryViewProps) {
  const { 
    activeRepo, 
    selectedFilePath, 
    setSelectedFilePath, 
    analyzeRepository, 
    exportMarkdownDocumentation,
    addToast,
    isLoading 
  } = useRepoPilot();

  const [activeSubTab, setActiveSubTab] = useState<'code' | 'analysis'>('code');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const selectedFile = activeRepo.files.find(f => f.path === selectedFilePath) || activeRepo.files[0];

  const filteredFiles = activeRepo.files.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setHasCopied(true);
    addToast('Code Copied', 'info', `Copied ${selectedFile.path} to clipboard.`);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const analysis = activeRepo.analysis;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sub Header / Bar */}
      <div className="h-12 border-b border-slate-800 bg-slate-950/60 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Source Explorer
            </button>
            <button
              onClick={() => setActiveSubTab('analysis')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'analysis' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Architecture Analysis</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400 font-mono">
            {activeRepo.files.length} Files · {activeRepo.stats.codeLines} Lines of Code
          </span>
          <button
            onClick={() => exportMarkdownDocumentation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
            title="Export repository analysis and security findings as Markdown"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export .md</span>
          </button>
          <button
            onClick={() => analyzeRepository()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-slate-800 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{analysis ? 'Re-Analyze Codebase' : 'Analyze Codebase'}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'code' ? (
        /* Source Explorer Split View */
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Left Column */}
          <div className="w-72 border-r border-slate-800 bg-[#0c1018] flex flex-col shrink-0">
            {/* Search Files */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter files..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                Workspace Files
              </div>
              {filteredFiles.map(file => {
                const isSelected = selectedFile?.path === file.path;
                const isTs = file.path.endsWith('.ts') || file.path.endsWith('.tsx');
                const isJson = file.path.endsWith('.json');
                const isMd = file.path.endsWith('.md');

                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                      isTs ? 'text-blue-400' : isJson ? 'text-amber-400' : isMd ? 'text-emerald-400' : 'text-slate-400'
                    }`} />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Import Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center">
              <button
                onClick={onOpenImportModal}
                className="text-xs text-slate-400 hover:text-indigo-300 font-medium transition-colors"
              >
                + Import ZIP or GitHub Repo
              </button>
            </div>
          </div>

          {/* File Content Right Column */}
          <div className="flex-1 flex flex-col bg-[#0b0f17] overflow-hidden">
            {selectedFile ? (
              <>
                {/* File Header */}
                <div className="h-10 border-b border-slate-800 bg-[#0e131f] px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-mono text-slate-200">{selectedFile.path}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {selectedFile.language?.toUpperCase() || 'CODE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedFile.content.split('\n').length} lines
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Body with Line Numbers */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                  <div className="flex">
                    {/* Line numbers column */}
                    <div className="select-none text-slate-600 text-right pr-4 shrink-0 font-mono">
                      {selectedFile.content.split('\n').map((_, idx) => (
                        <div key={idx} className="leading-6">{idx + 1}</div>
                      ))}
                    </div>

                    {/* Code lines */}
                    <pre className="text-slate-300 font-mono overflow-x-auto">
                      {selectedFile.content.split('\n').map((line, idx) => (
                        <div key={idx} className="leading-6 whitespace-pre hover:bg-slate-900/40">
                          {line || '\n'}
                        </div>
                      ))}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a file from the explorer to view contents
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Architecture Analysis View */
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-6">
          {analysis ? (
            <>
              {/* Section 1: Project Overview */}
              <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Layers className="w-4 h-4" />
                  <h3 className="font-semibold text-white text-sm">Project Overview</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.overview}</p>
              </div>

              {/* Section 2: Tech Stack */}
              <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Code2 className="w-4 h-4" />
                  <h3 className="font-semibold text-white text-sm">Detected Tech Stack & Frameworks</h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.techStack.map((tech, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 3: High-Level Architecture */}
              <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-purple-400">
                  <Cpu className="w-4 h-4" />
                  <h3 className="font-semibold text-white text-sm">High-Level System Architecture</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.architecture}</p>
              </div>

              {/* Section 4: Important Files */}
              <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <FileCode className="w-4 h-4" />
                  <h3 className="font-semibold text-white text-sm">Important Files & Responsibilities</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {analysis.importantFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedFilePath(file.path);
                        setActiveSubTab('code');
                      }}
                      className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-semibold text-indigo-300 truncate">{file.path}</span>
                        <span className="text-[10px] text-slate-500 font-mono">View →</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">{file.role}</p>
                      {file.notes && (
                        <p className="text-[11px] text-slate-400 mt-1">{file.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Potential Issues */}
              {analysis.potentialIssues && analysis.potentialIssues.length > 0 && (
                <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="font-semibold text-white text-sm">Potential Architectural Issues</h3>
                  </div>
                  <div className="space-y-2 pt-1">
                    {analysis.potentialIssues.map((issue, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-amber-300">{issue.title}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            issue.severity === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: Suggested Improvements */}
              {analysis.suggestedImprovements && analysis.suggestedImprovements.length > 0 && (
                <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3 className="font-semibold text-white text-sm">Suggested Engineering Improvements</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300 pt-1">
                    {analysis.suggestedImprovements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-mono">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">Repository Not Yet Analyzed</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Run the RepoPilot codebase analyzer to extract high-level architecture, module responsibilities, tech stack, and potential pitfalls.
              </p>
              <button
                onClick={() => analyzeRepository()}
                disabled={isLoading}
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
              >
                {isLoading ? 'Analyzing...' : 'Run Repository Analyzer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
