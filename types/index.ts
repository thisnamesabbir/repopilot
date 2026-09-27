export interface RepoFile {
  path: string;
  content: string;
  size?: number;
  language?: string;
}

export interface RepoAnalysis {
  overview: string;
  techStack: string[];
  architecture: string;
  importantFiles: {
    path: string;
    role: string;
    notes?: string;
  }[];
  potentialIssues: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  suggestedImprovements: string[];
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  isDemo: boolean;
  files: RepoFile[];
  techStack: string[];
  stats: {
    fileCount: number;
    codeLines: number;
    languageDistribution: Record<string, number>;
  };
  metadata?: {
    framework: string;
    backend: string;
    database: string;
    authentication: string;
    fileCount: number;
  };
  analysis?: RepoAnalysis;
  lastAnalyzedAt?: number;
}

export interface CodeChange {
  filePath: string;
  description: string;
  oldCode: string;
  newCode: string;
  diff?: string;
  linesAdded: number;
  linesRemoved: number;
  explanation?: string;
}

export interface WorkflowStep {
  step: 
    | 'USER REQUEST'
    | 'UNDERSTAND REQUEST'
    | 'SEARCH REPOSITORY CONTEXT'
    | 'IDENTIFY RELEVANT FILES'
    | 'CREATE IMPLEMENTATION PLAN'
    | 'GENERATE PATCH/DIFF'
    | 'CREATE TEST PLAN'
    | 'SECURITY REVIEW'
    | 'FINAL SUMMARY';
  status: 'completed' | 'in_progress' | 'warning' | 'skipped' | 'failed';
  summary?: string;
}

export interface CodePlanResponse {
  understanding: string;
  filesAffected: {
    path: string;
    reason: string;
  }[];
  plan: string[];
  changes: CodeChange[];
  tests: string[];
  security: string[];
  limitations: string[];
  // Backwards compatibility aliases
  implementationPlan?: string[];
  codeChanges?: CodeChange[];
  testingPlan?: string[];
  securityConsiderations?: string[];
  // Workflow & confidence additions
  confidence?: 'high' | 'medium' | 'low';
  confidenceScore?: number;
  confidenceReason?: string;
  insufficientContext?: boolean;
  missingContext?: string;
  workflowSteps?: WorkflowStep[];
  userPrompt?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  structuredPlan?: CodePlanResponse;
  isLoading?: boolean;
}

export interface TestResult {
  id: string;
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
  simulated: boolean;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  lastRun?: number;
  tests: TestResult[];
  isSimulated: boolean;
}

export interface TestErrorAnalysis {
  problem: string;
  likelyCause: string;
  relevantFiles: string[];
  recommendedFix: string;
  testPlan: string[];
}

export type SecuritySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityFinding {
  id: string;
  category: 
    | 'Authentication'
    | 'Authorization'
    | 'Secrets'
    | 'Input Validation'
    | 'Dependencies'
    | 'API Security'
    | 'Configuration'
    | 'Common Web Security Risks';
  finding: string;
  severity: SecuritySeverity;
  affectedFile: string;
  evidence: string;
  whyItMatters: string;
  recommendedFix: string;
  validationSteps: string[];
}

export interface SecurityAuditReport {
  timestamp: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: SecurityFinding[];
  scannerType: string;
}

export interface ActivityItem {
  id: string;
  type: 
    | 'repo_imported'
    | 'repo_analyzed'
    | 'ai_task'
    | 'diff_generated'
    | 'tests_run'
    | 'security_audit'
    | 'patch_applied';
  title: string;
  description: string;
  timestamp: number;
  meta?: Record<string, any>;
}

export type ActiveTab = 
  | 'dashboard'
  | 'repository'
  | 'assistant'
  | 'changes'
  | 'tests'
  | 'security'
  | 'activity'
  | 'settings';
