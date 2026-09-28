import React, { createContext, useContext, useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Repository, 
  RepoFile, 
  ActiveTab, 
  AIChatMessage, 
  CodeChange, 
  TestSuiteSummary, 
  TestErrorAnalysis,
  SecurityAuditReport, 
  ActivityItem,
  CodePlanResponse
} from '../../types';
import { TASKFLOW_REPO } from '../data/demoRepo';
import { generateUnifiedDiff } from '../utils/diffUtils';
import { generateRepositoryMarkdown, downloadMarkdownFile } from '../utils/markdownExport';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface RepoPilotContextType {
  activeRepo: Repository;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedFilePath: string | null;
  setSelectedFilePath: (path: string | null) => void;
  chatMessages: AIChatMessage[];
  stagedChanges: CodeChange[];
  activeDiffIndex: number;
  setActiveDiffIndex: (idx: number) => void;
  testSummary: TestSuiteSummary;
  testErrorDiagnostic: TestErrorAnalysis | null;
  securityReport: SecurityAuditReport | null;
  activities: ActivityItem[];
  toasts: Toast[];
  isLoading: boolean;
  loadingMessage: string;
  addToast: (title: string, type?: Toast['type'], message?: string) => void;
  removeToast: (id: string) => void;
  loadDemoRepo: () => void;
  analyzeRepository: () => Promise<void>;
  sendChatMessage: (content: string, taskType?: 'complex' | 'fast' | 'general') => Promise<void>;
  runTestSuite: () => Promise<void>;
  analyzeTestError: (errorLog: string) => Promise<void>;
  runSecurityReview: () => Promise<void>;
  applyCodeChange: (change: CodeChange) => void;
  revertCodeChange: (filePath: string) => void;
  downloadPatchFile: (change?: CodeChange) => void;
  exportMarkdownDocumentation: () => void;
  copyUnifiedPatch: (plan?: CodePlanResponse) => void;
  regenerateMessage: (prompt?: string) => Promise<void>;
  importZipFile: (file: File) => Promise<void>;
  importGitHubRepo: (repoSlug: string) => Promise<void>;
}

const RepoPilotContext = createContext<RepoPilotContextType | undefined>(undefined);

export function RepoPilotProvider({ children }: { children: React.ReactNode }) {
  const [activeRepo, setActiveRepo] = useState<Repository>(TASKFLOW_REPO);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>('src/App.tsx');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stagedChanges, setStagedChanges] = useState<CodeChange[]>([]);
  const [activeDiffIndex, setActiveDiffIndex] = useState<number>(0);

  // Initial demo chat message
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! I'm RepoPilot, your codebase-aware AI teammate. I've indexed **${TASKFLOW_REPO.name}** (${TASKFLOW_REPO.files.length} files). 
You can ask me to implement features, review security, fix test errors, or run:
👉 *"Add protected routes to the dashboard."*`,
      timestamp: Date.now() - 3600000,
    }
  ]);

  // Initial test status
  const [testSummary, setTestSummary] = useState<TestSuiteSummary>({
    total: 6,
    passed: 5,
    failed: 1,
    skipped: 0,
    lastRun: Date.now() - 1800000,
    isSimulated: true,
    tests: [
      {
        id: 't1',
        suite: 'Auth Suite',
        name: 'POST /api/auth/login validates email and password fields',
        status: 'passed',
        durationMs: 42,
        simulated: true,
      },
      {
        id: 't2',
        suite: 'Auth Suite',
        name: 'POST /api/auth/login returns JWT token for valid credentials',
        status: 'passed',
        durationMs: 118,
        simulated: true,
      },
      {
        id: 't3',
        suite: 'Middleware Suite',
        name: 'requireAuth rejects requests missing Bearer header with 401',
        status: 'passed',
        durationMs: 24,
        simulated: true,
      },
      {
        id: 't4',
        suite: 'Client Route Guard Suite',
        name: 'Dashboard route enforces authentication verification',
        status: 'failed',
        durationMs: 65,
        error: 'AssertionError: Expected ProtectedRoute redirect on unauthenticated user, but Dashboard rendered.',
        simulated: true,
      },
      {
        id: 't5',
        suite: 'Tasks API Suite',
        name: 'GET /api/tasks returns mock tasks for authenticated developer',
        status: 'passed',
        durationMs: 51,
        simulated: true,
      },
      {
        id: 't6',
        suite: 'Token Security Suite',
        name: 'Expired JWT token triggers 403 Forbidden with clean error message',
        status: 'passed',
        durationMs: 38,
        simulated: true,
      },
    ]
  });

  const [testErrorDiagnostic, setTestErrorDiagnostic] = useState<TestErrorAnalysis | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityAuditReport | null>(null);

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 'act_1',
      type: 'repo_imported',
      title: 'Repository Loaded',
      description: 'Loaded "TaskFlow — React + Node Task Manager" with 9 source files.',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'act_2',
      type: 'repo_analyzed',
      title: 'Repository Analyzed',
      description: 'Identified React 18, TypeScript, and Express full-stack architecture.',
      timestamp: Date.now() - 3500000,
    },
    {
      id: 'act_3',
      type: 'tests_run',
      title: 'Initial Test Suite Executed',
      description: '5 passed, 1 failed (Dashboard Route Guard).',
      timestamp: Date.now() - 1800000,
    }
  ]);

  const addToast = (title: string, type: Toast['type'] = 'info', message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, title, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logActivity = (type: ActivityItem['type'], title: string, description: string) => {
    const newAct: ActivityItem = {
      id: 'act_' + Date.now(),
      type,
      title,
      description,
      timestamp: Date.now(),
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const loadDemoRepo = () => {
    setActiveRepo(TASKFLOW_REPO);
    setSelectedFilePath('src/App.tsx');
    setStagedChanges([]);
    setSecurityReport(null);
    setTestErrorDiagnostic(null);
    logActivity('repo_imported', 'Reset to TaskFlow Demo', 'Reloaded clean TaskFlow project state.');
    addToast('Demo Repository Loaded', 'success', 'TaskFlow demo workspace is ready.');
  };

  const analyzeRepository = async () => {
    setIsLoading(true);
    setLoadingMessage('Analyzing repository structure and architecture...');
    try {
      const res = await fetch('/api/repo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: activeRepo.files,
          repoName: activeRepo.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed on server.');
      }

      const data = await res.json();
      setActiveRepo(prev => ({
        ...prev,
        analysis: data.analysis,
        lastAnalyzedAt: Date.now(),
      }));

      logActivity('repo_analyzed', 'Codebase Analysis Completed', `Analyzed ${activeRepo.files.length} files across ${data.analysis.techStack?.join(', ') || 'modules'}.`);
      addToast('Repository Analyzed', 'success', 'Architecture insights and file roles updated.');
    } catch (err: any) {
      addToast('Analysis Error', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const sendChatMessage = async (content: string, taskType?: 'complex' | 'fast' | 'general') => {
    if (!content.trim()) return;

    const userMsgId = 'msg_' + Date.now();
    const newMsg: AIChatMessage = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, newMsg]);
    setIsLoading(true);
    setLoadingMessage('Generating codebase-aware implementation plan...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          taskType,
          repoContext: {
            name: activeRepo.name,
            files: activeRepo.files,
          },
          history: chatMessages.slice(-6),
        }),
      });

      const responseBody = await res.text();
      let data: any;
      try {
        data = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const apiError = typeof data?.error === 'string' ? data.error : '';
        const bodyHint = !apiError && responseBody
          ? responseBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
          : '';
        throw new Error(apiError || `Chat API returned HTTP ${res.status}${bodyHint ? `: ${bodyHint}` : ` ${res.statusText}`}.`);
      }

      const responsePlan = data?.plan;
      if (
        !responsePlan ||
        typeof responsePlan !== 'object' ||
        typeof responsePlan.understanding !== 'string' ||
        !Array.isArray(responsePlan.filesAffected) ||
        !Array.isArray(responsePlan.plan) ||
        !Array.isArray(responsePlan.changes || responsePlan.codeChanges)
      ) {
        throw new Error(`Chat API returned an invalid response (HTTP ${res.status}); expected a structured plan.`);
      }

      const plan: CodePlanResponse = responsePlan;

      const isInsufficient = Boolean(
        plan.insufficientContext || 
        (plan.understanding && plan.understanding.toLowerCase().includes('insufficient repository context'))
      );

      const assistantMsg: AIChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: isInsufficient
          ? `⚠️ **Insufficient repository context.**\n${plan.missingContext || 'The repository does not contain enough information to safely fulfill this request without hallucinating.'}`
          : `I have analyzed the request and reasoned from the actual repository files. Here is the structured implementation package.`,
        timestamp: Date.now(),
        structuredPlan: plan,
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      const activeChanges = plan.changes || plan.codeChanges || [];
      if (activeChanges.length > 0) {
        setStagedChanges(activeChanges);
        setActiveDiffIndex(0);
        const fileNames = plan.filesAffected.map(f => typeof f === 'string' ? f : f.path).join(', ');
        logActivity('diff_generated', 'Code Changes Generated', `Proposed changes for: ${fileNames}`);
        addToast('Implementation Plan Ready', 'success', `${activeChanges.length} code diff${activeChanges.length > 1 ? 's' : ''} generated.`);
      } else if (isInsufficient) {
        addToast('Insufficient Context', 'warning', 'Required source files or context missing in repository.');
      }

      logActivity('ai_task', 'AI Assistant Task Completed', `Analyzed: "${content.slice(0, 40)}..."`);
    } catch (err: any) {
      addToast('AI Assistant Error', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const regenerateMessage = async (prompt?: string) => {
    let targetPrompt = prompt;
    if (!targetPrompt) {
      const lastUserMsg = [...chatMessages].reverse().find(m => m.role === 'user');
      targetPrompt = lastUserMsg?.content;
    }
    if (!targetPrompt) {
      addToast('Cannot Regenerate', 'info', 'No previous prompt to regenerate.');
      return;
    }
    await sendChatMessage(targetPrompt);
  };

  const copyUnifiedPatch = (plan?: CodePlanResponse) => {
    const changesToCopy = plan?.changes || plan?.codeChanges || stagedChanges;
    if (!changesToCopy || changesToCopy.length === 0) {
      addToast('No Patch', 'info', 'No code changes available to copy.');
      return;
    }

    let fullPatch = '';
    changesToCopy.forEach(c => {
      const diffText = c.diff || generateUnifiedDiff(c.filePath, c.oldCode, c.newCode);
      fullPatch += diffText.trim() + '\n\n';
    });

    navigator.clipboard.writeText(fullPatch.trim());
    addToast('Patch Copied', 'success', `Copied unified patch (${changesToCopy.length} file${changesToCopy.length > 1 ? 's' : ''}) to clipboard.`);
  };

  const runTestSuite = async () => {
    setIsLoading(true);
    setLoadingMessage('Executing test suite in isolated runner...');
    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: activeRepo.files }),
      });

      if (!res.ok) throw new Error('Test run failed.');

      const data = await res.json();
      setTestSummary(data.summary);
      logActivity(
        'tests_run',
        'Test Suite Executed',
        `${data.summary.passed} passed, ${data.summary.failed} failed out of ${data.summary.total} tests.`
      );
      addToast('Tests Completed', data.summary.failed === 0 ? 'success' : 'warning', `${data.summary.passed} passed, ${data.summary.failed} failed.`);
    } catch (err: any) {
      addToast('Test Runner Error', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const analyzeTestError = async (errorLog: string) => {
    setIsLoading(true);
    setLoadingMessage('AI Debugger analyzing stack trace and relevant files...');
    try {
      const res = await fetch('/api/tests/analyze-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorLog,
          files: activeRepo.files,
        }),
      });

      if (!res.ok) throw new Error('Error log diagnosis failed.');

      const data = await res.json();
      setTestErrorDiagnostic(data.diagnostic);
      addToast('Diagnostic Complete', 'info', 'Likely cause and recommended fix generated.');
    } catch (err: any) {
      addToast('Debugger Error', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const runSecurityReview = async () => {
    setIsLoading(true);
    setLoadingMessage('Running comprehensive static security review across 8 risk categories...');
    try {
      const res = await fetch('/api/security/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: activeRepo.files }),
      });

      if (!res.ok) throw new Error('Security review failed.');

      const data = await res.json();
      setSecurityReport(data.report);
      logActivity(
        'security_audit',
        'Security Review Completed',
        `Identified ${data.report.totalFindings} findings (${data.report.highCount} high, ${data.report.mediumCount} medium).`
      );
      addToast('Security Audit Finished', 'warning', `Found ${data.report.totalFindings} security considerations.`);
      setActiveTab('security');
    } catch (err: any) {
      addToast('Security Review Error', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const applyCodeChange = (change: CodeChange) => {
    setActiveRepo(prev => {
      const updatedFiles = prev.files.map(f => {
        if (f.path === change.filePath) {
          return { ...f, content: change.newCode };
        }
        return f;
      });

      // If file didn't exist before, add it
      if (!prev.files.some(f => f.path === change.filePath)) {
        updatedFiles.push({
          path: change.filePath,
          content: change.newCode,
          language: change.filePath.endsWith('.tsx') || change.filePath.endsWith('.ts') ? 'typescript' : 'text',
        });
      }

      return {
        ...prev,
        files: updatedFiles,
        stats: {
          ...prev.stats,
          codeLines: updatedFiles.reduce((acc, f) => acc + f.content.split('\n').length, 0),
        }
      };
    });

    // If applying protected route change to TaskFlow, simulate that the failing test now passes!
    if (change.filePath === 'src/App.tsx' && change.newCode.includes('ProtectedRoute')) {
      setTestSummary(prev => ({
        ...prev,
        passed: 6,
        failed: 0,
        tests: prev.tests.map(t => t.id === 't4' ? { ...t, status: 'passed' as const, error: undefined } : t),
      }));
    }

    logActivity('patch_applied', `Applied Changes to ${change.filePath}`, `Updated code (+${change.linesAdded}/-${change.linesRemoved} lines).`);
    addToast('Patch Applied', 'success', `Updated ${change.filePath} in active workspace.`);
  };

  const revertCodeChange = (filePath: string) => {
    const staged = stagedChanges.find(c => c.filePath === filePath);
    if (!staged) return;

    setActiveRepo(prev => {
      const updatedFiles = prev.files.map(f => {
        if (f.path === filePath) {
          return { ...f, content: staged.oldCode };
        }
        return f;
      });
      return { ...prev, files: updatedFiles };
    });

    logActivity('patch_applied', `Reverted ${filePath}`, 'Restored previous file state.');
    addToast('Changes Reverted', 'info', `Restored previous version of ${filePath}.`);
  };

  const downloadPatchFile = (change?: CodeChange) => {
    let patchContent = '';
    const changesToExport = change ? [change] : stagedChanges;

    if (changesToExport.length === 0) {
      addToast('No Changes', 'info', 'No staged code diffs to export.');
      return;
    }

    changesToExport.forEach(c => {
      patchContent += generateUnifiedDiff(c.filePath, c.oldCode, c.newCode) + '\n\n';
    });

    const blob = new Blob([patchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repopilot-${Date.now()}.patch`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('Patch Downloaded', 'success', 'Saved unified git diff patch file.');
  };

  const exportMarkdownDocumentation = () => {
    try {
      const markdown = generateRepositoryMarkdown(activeRepo, securityReport, testSummary, {
        includeArchitecture: true,
        includeSecurity: true,
        includeTests: true,
      });

      const sanitizedRepoName = activeRepo.name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      const filename = `${sanitizedRepoName}-audit-report-${new Date().toISOString().slice(0, 10)}.md`;

      downloadMarkdownFile(filename, markdown);
      logActivity(
        'security_audit',
        'Markdown Documentation Exported',
        `Exported full repository architecture & security report as "${filename}".`
      );
      addToast('Documentation Exported', 'success', `Saved ${filename} with architecture and security findings.`);
    } catch (err: any) {
      addToast('Export Error', 'error', err.message || 'Failed to export markdown documentation.');
    }
  };

  const importZipFile = async (file: File) => {
    if (!file) return;

    // Validate file size (max 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      addToast('File Too Large', 'error', 'ZIP file exceeds the 25MB maximum upload limit.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Extracting and analyzing "${file.name}"...`);

    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(file);
      const parsedFiles: RepoFile[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zipData.files)) {
        if (zipEntry.dir) continue;

        // Path Traversal (Zip Slip) Protection
        if (
          relativePath.includes('..') ||
          relativePath.startsWith('/') ||
          relativePath.startsWith('\\')
        ) {
          continue;
        }

        if (relativePath.includes('node_modules/') || relativePath.includes('.git/') || relativePath.includes('dist/')) {
          continue;
        }

        // Whitelist safe code and configuration extensions
        const isCode = /\.(ts|tsx|js|jsx|json|md|html|css|py|rs|go|yaml|yml|txt|sql)$/i.test(relativePath);
        if (!isCode) continue;

        const content = await zipEntry.async('string');
        const ext = relativePath.split('.').pop() || 'text';
        parsedFiles.push({
          path: relativePath,
          content: content.slice(0, 30000), // Cap file size safely
          language: ext,
        });

        // Limit total indexed files to 100 for browser memory safety
        if (parsedFiles.length >= 100) break;
      }

      if (parsedFiles.length === 0) {
        throw new Error('No valid source code files found in ZIP archive.');
      }

      const newRepo: Repository = {
        id: 'zip-' + Date.now(),
        name: file.name.replace(/\.zip$/i, ''),
        description: `Imported ZIP archive with ${parsedFiles.length} source files.`,
        isDemo: false,
        files: parsedFiles,
        techStack: Array.from(new Set(parsedFiles.map(f => f.language?.toUpperCase() || 'CODE'))),
        stats: {
          fileCount: parsedFiles.length,
          codeLines: parsedFiles.reduce((acc, f) => acc + f.content.split('\n').length, 0),
          languageDistribution: parsedFiles.reduce((acc: any, f) => {
            acc[f.language || 'text'] = (acc[f.language || 'text'] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      setActiveRepo(newRepo);
      setSelectedFilePath(parsedFiles[0]?.path || null);
      setStagedChanges([]);
      setSecurityReport(null);
      logActivity('repo_imported', 'ZIP Archive Imported', `Loaded ${parsedFiles.length} files from ${file.name}.`);
      addToast('Project Imported', 'success', `Successfully loaded ${parsedFiles.length} files.`);
      setActiveTab('repository');
    } catch (err: any) {
      addToast('Import Error', 'error', err.message || 'Failed to unpack ZIP file.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const importGitHubRepo = async (repoSlug: string) => {
    const slug = repoSlug.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    if (!slug || !slug.includes('/')) {
      addToast('Invalid Format', 'warning', 'Please enter "owner/repo" (e.g. facebook/react)');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Fetching ${slug} from GitHub API...`);

    try {
      const res = await fetch(`/api/github/fetch?repo=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub repository.');
      }

      setActiveRepo(data.repository);
      setSelectedFilePath(data.repository.files[0]?.path || null);
      setStagedChanges([]);
      setSecurityReport(null);
      logActivity('repo_imported', 'GitHub Repo Imported', `Imported ${data.repository.name} with ${data.repository.files.length} files.`);
      addToast('GitHub Repo Imported', 'success', `Loaded ${data.repository.name}`);
      setActiveTab('repository');
    } catch (err: any) {
      addToast('GitHub Import Failed', 'error', err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <RepoPilotContext.Provider
      value={{
        activeRepo,
        activeTab,
        setActiveTab,
        selectedFilePath,
        setSelectedFilePath,
        chatMessages,
        stagedChanges,
        activeDiffIndex,
        setActiveDiffIndex,
        testSummary,
        testErrorDiagnostic,
        securityReport,
        activities,
        toasts,
        isLoading,
        loadingMessage,
        addToast,
        removeToast,
        loadDemoRepo,
        analyzeRepository,
        sendChatMessage,
        runTestSuite,
        analyzeTestError,
        runSecurityReview,
        applyCodeChange,
        revertCodeChange,
        downloadPatchFile,
        exportMarkdownDocumentation,
        copyUnifiedPatch,
        regenerateMessage,
        importZipFile,
        importGitHubRepo,
      }}
    >
      {children}
    </RepoPilotContext.Provider>
  );
}

export function useRepoPilot() {
  const context = useContext(RepoPilotContext);
  if (!context) {
    throw new Error('useRepoPilot must be used within a RepoPilotProvider');
  }
  return context;
}
