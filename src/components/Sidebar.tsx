import React from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { ActiveTab } from '../../types';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Bot, 
  GitCompare, 
  FlaskConical, 
  ShieldCheck, 
  Clock, 
  Settings, 
  Terminal, 
  Sparkles,
  Github,
  Upload,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  onOpenImportModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onOpenImportModal, isOpenMobile, onCloseMobile }: SidebarProps) {
  const { 
    activeTab, 
    setActiveTab, 
    activeRepo, 
    stagedChanges, 
    testSummary, 
    securityReport,
    loadDemoRepo 
  } = useRepoPilot();

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'repository', label: 'Repository', icon: <FolderGit2 className="w-4 h-4" />, badge: activeRepo.files.length },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { 
      id: 'changes', 
      label: 'Code Changes', 
      icon: <GitCompare className="w-4 h-4" />, 
      badge: stagedChanges.length > 0 ? stagedChanges.length : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    { 
      id: 'tests', 
      label: 'Tests', 
      icon: <FlaskConical className="w-4 h-4" />,
      badge: testSummary.failed > 0 ? `${testSummary.failed} fail` : `${testSummary.passed} pass`,
      badgeColor: testSummary.failed > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: securityReport ? `${securityReport.totalFindings}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    },
    { id: 'activity', label: 'Activity', icon: <Clock className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside className={`
        w-64 bg-[#0d121c] border-r border-slate-800/80 flex flex-col shrink-0 select-none
        fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">RepoPilot</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[130px]">Codebase Teammate</p>
            </div>
          </div>
        </div>

        {/* Active Workspace Info */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-slate-900/80 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Active Workspace</span>
            {activeRepo.isDemo && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                DEMO
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-200 truncate">{activeRepo.name}</p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span>{activeRepo.files.length} files</span>
            <span>·</span>
            <span>{activeRepo.techStack[0] || 'TypeScript'}</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      item.badgeColor || 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Demo & Import Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              loadDemoRepo();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Reload clean TaskFlow sample repository"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset TaskFlow Demo</span>
          </button>

          <button
            onClick={() => {
              onOpenImportModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Repository</span>
          </button>
        </div>

        {/* Model & System Status */}
        <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>gemini-2.5-flash</span>
          </div>
          <span>Node Proxy</span>
        </div>
      </aside>
    </>
  );
}
