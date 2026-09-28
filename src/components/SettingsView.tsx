import React from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  FileJson, 
  Server,
  Layers,
  FileDown
} from 'lucide-react';

export default function SettingsView() {
  const { activeRepo, loadDemoRepo, exportMarkdownDocumentation, addToast } = useRepoPilot();

  const handleExportWorkspace = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeRepo, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeRepo.id}-workspace.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Workspace Exported', 'success', 'Saved JSON metadata and source archive.');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#0b0f17] overflow-hidden">
      {/* Sub Header */}
      <div className="h-12 border-b border-slate-800 bg-[#0e131f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">System & Workspace Configuration</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* AI Model Architecture Card */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">AI Engine & Gemini Integration</h3>
                <p className="text-xs text-slate-400">Server-side proxy configuration</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 font-mono text-[11px]">Selected Model:</span>
              <p className="font-mono text-indigo-300 font-semibold">gemini-2.5-flash</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 font-mono text-[11px]">API Key Boundary:</span>
              <p className="text-emerald-400 font-medium">Server Proxy (process.env.GEMINI_API_KEY)</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 font-mono text-[11px]">Client-side Exposure:</span>
              <p className="text-slate-300">0% (Strictly isolated in Node runtime)</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 font-mono text-[11px]">Telemetry Header:</span>
              <p className="font-mono text-slate-300">User-Agent: 'aistudio-build'</p>
            </div>
          </div>
        </div>

        {/* Security & Sandbox Policies */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Developer Sandbox & Safety Guarantees</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            RepoPilot is designed with strict boundaries to protect real-world engineering teams:
          </p>
          <ul className="space-y-2 text-slate-400 pt-1">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Automatic Code Execution:</strong> Uploaded source code is parsed in memory; arbitrary shell commands or untrusted scripts are never automatically executed.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Silent Modifications:</strong> All generated code modifications are staged as unified git diffs for explicit developer review and approval.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Unauthorized Network Probing:</strong> The Security Center inspects syntax AST patterns and supplied evidence without probing external URLs.</span>
            </li>
          </ul>
        </div>

        {/* Data & Export Controls */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Workspace Data Management</span>
          </h3>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportMarkdownDocumentation()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition-colors"
              title="Export repository analysis and security findings as Markdown"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Documentation (.md)</span>
            </button>

            <button
              onClick={handleExportWorkspace}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition-colors"
            >
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span>Export Workspace JSON</span>
            </button>

            <button
              onClick={loadDemoRepo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reset TaskFlow Demo Repository</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
