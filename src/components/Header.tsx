import React from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  Play, 
  ShieldCheck, 
  FlaskConical, 
  Sparkles, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle,
  FolderGit2,
  FileDown,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  onOpenImportModal: () => void;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export default function Header({ 
  onOpenImportModal, 
  onToggleMobileSidebar, 
  isMobileSidebarOpen 
}: HeaderProps) {
  const { 
    activeRepo, 
    activeTab, 
    analyzeRepository, 
    runSecurityReview, 
    runTestSuite,
    exportMarkdownDocumentation,
    isLoading 
  } = useRepoPilot();

  const tabTitles: Record<string, string> = {
    dashboard: 'Workspace Dashboard',
    repository: 'Repository File Explorer',
    assistant: 'AI Development Assistant',
    changes: 'Code Changes & Diff Inspector',
    tests: 'Test & Debug Center',
    security: 'Security Center & Audit',
    activity: 'Audit Activity Timeline',
    settings: 'Environment & Configuration',
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10">
      {/* Breadcrumb / Title & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FolderGit2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-xs">{activeRepo.name}</span>
          <span className="hidden sm:inline">/</span>
          <span className="text-slate-100 font-medium hidden sm:inline">{tabTitles[activeTab] || activeTab}</span>
        </div>

        {activeRepo.isDemo && (
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
            DEMO REPOSITORY
          </span>
        )}
      </div>

      {/* Header Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => exportMarkdownDocumentation()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-700/80 transition-colors"
          title="Export architecture and security report as Markdown (.md)"
        >
          <FileDown className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Export .md</span>
        </button>

        <button
          onClick={() => analyzeRepository()}
          disabled={isLoading}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50"
          title="Analyze codebase architecture, files and dependencies"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Analyze Codebase</span>
        </button>

        <button
          onClick={() => runSecurityReview()}
          disabled={isLoading}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50"
          title="Run static security review across 8 risk categories"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Security Review</span>
        </button>

        <button
          onClick={() => runTestSuite()}
          disabled={isLoading}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-700/80 transition-colors disabled:opacity-50"
          title="Run test suite in isolated runner"
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
          <span>Run Tests</span>
        </button>

        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
}
