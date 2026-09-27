import React, { useState } from 'react';
import { RepoPilotProvider, useRepoPilot } from './context/RepoPilotContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import RepositoryView from './components/RepositoryView';
import AIAssistantView from './components/AIAssistantView';
import CodeDiffView from './components/CodeDiffView';
import TestDebugCenter from './components/TestDebugCenter';
import SecurityCenter from './components/SecurityCenter';
import ActivityTimeline from './components/ActivityTimeline';
import SettingsView from './components/SettingsView';
import ImportModal from './components/ImportModal';
import ToastContainer from './components/ToastContainer';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { activeTab, isLoading, loadingMessage } = useRepoPilot();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'repository':
        return <RepositoryView onOpenImportModal={() => setIsImportModalOpen(true)} />;
      case 'assistant':
        return <AIAssistantView />;
      case 'changes':
        return <CodeDiffView />;
      case 'tests':
        return <TestDebugCenter />;
      case 'security':
        return <SecurityCenter />;
      case 'activity':
        return <ActivityTimeline />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Left Navigation Sidebar */}
      <Sidebar 
        onOpenImportModal={() => setIsImportModalOpen(true)} 
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          onOpenImportModal={() => setIsImportModalOpen(true)} 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {renderActiveView()}
        </main>
      </div>

      {/* Repository Importer Modal */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />

      {/* Toast Alert Notifications */}
      <ToastContainer />

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <div>
              <p className="text-xs font-semibold text-white">RepoPilot is thinking...</p>
              <p className="text-[11px] text-slate-400 mt-1">{loadingMessage || 'Processing codebase request'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RepoPilotProvider>
      <MainApp />
    </RepoPilotProvider>
  );
}
