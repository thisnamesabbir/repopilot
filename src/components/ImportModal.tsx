import React, { useState } from 'react';
import { useRepoPilot } from '../context/RepoPilotContext';
import { 
  X, 
  Upload, 
  Github, 
  FileArchive, 
  Sparkles, 
  AlertCircle, 
  Check, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { importZipFile, importGitHubRepo, loadDemoRepo, isLoading } = useRepoPilot();
  const [activeTab, setActiveTab] = useState<'zip' | 'github' | 'demo'>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleZipUpload = async () => {
    if (!selectedFile) return;
    await importZipFile(selectedFile);
    onClose();
  };

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    await importGitHubRepo(githubUrl);
    onClose();
  };

  const handleDemoSelect = () => {
    loadDemoRepo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Import Repository into RepoPilot</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'zip'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileArchive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload ZIP</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'github'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5 text-purple-400" />
            <span>Public GitHub</span>
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'demo'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>TaskFlow Demo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : selectedFile
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <input
                  type="file"
                  id="zip-upload"
                  accept=".zip"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <label htmlFor="zip-upload" className="cursor-pointer block">
                  <FileArchive className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Ready to analyze
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Drop your project .ZIP archive here, or <span className="text-indigo-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5">
                        Supports React, Node, TypeScript, Python, Go codebases (max 25MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Code is analyzed in memory; never executed without permission.
                </span>
                <button
                  onClick={handleZipUpload}
                  disabled={!selectedFile || isLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Unpacking...' : 'Load & Analyze'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <form onSubmit={handleGitHubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Public GitHub Repository URL or Owner/Repo
                </label>
                <div className="relative">
                  <Github className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="e.g. facebook/react or https://github.com/expressjs/express"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Fetches tree and source files via GitHub REST API without requiring user OAuth.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1 text-slate-400">
                <span className="font-semibold text-slate-300">Quick Test Repos:</span>
                <div className="flex gap-2 flex-wrap pt-1">
                  {['expressjs/cors', 'vercel/next.js', 'remix-run/react-router'].map(sample => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setGithubUrl(sample)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!githubUrl.trim() || isLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <span>Import from GitHub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/40 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                    HACKATHON GOLD STANDARD
                  </span>
                  <span className="font-semibold text-white">TaskFlow — React + Node Task Manager</span>
                </div>
                <p className="text-slate-400">
                  Pre-populated with 9 realistic full-stack files (React 18 SPA, Express backend, JWT auth middleware, vitest suite, and README).
                </p>
                <div className="text-[11px] text-slate-500 pt-1 space-y-0.5">
                  <p>✓ Ready for prompt: <span className="text-indigo-300 font-mono">"Add protected routes to the dashboard."</span></p>
                  <p>✓ Realistic failing test for unauthenticated dashboard access</p>
                  <p>✓ Embedded security vulnerabilities ready for the Security Center</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleDemoSelect}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load TaskFlow Demo Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
