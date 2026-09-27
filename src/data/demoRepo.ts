import { RepoFile, Repository, RepoAnalysis, CodeChange, TestResult, SecurityAuditReport } from '../../types';

export const TASKFLOW_FILES: RepoFile[] = [
  {
    path: 'package.json',
    language: 'json',
    content: `{
  "name": "taskflow",
  "version": "1.0.0",
  "private": true,
  "description": "Full-stack Task Manager with React & Node.js",
  "scripts": {
    "dev": "concurrently \\"npm run server\\" \\"npm run client\\"",
    "client": "vite",
    "server": "tsx server/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "lucide-react": "^0.395.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/bcryptjs": "^2.4.6",
    "vite": "^5.3.1",
    "vitest": "^1.6.0",
    "typescript": "^5.5.2",
    "concurrently": "^8.2.2"
  }
}`
  },
  {
    path: 'README.md',
    language: 'markdown',
    content: `# TaskFlow

TaskFlow is a lightweight collaborative task management system built with React, TypeScript, Express, and JWT authentication.

## Architecture
- **Frontend**: React 18 SPA bundled with Vite, using functional components and hooks.
- **Backend**: Express REST API running on Node.js with modular routing and JWT middleware.
- **Authentication**: Bearer token JWT stored in localStorage / Authorization headers.

## Getting Started
\`\`\`bash
npm install
npm run dev
\`\`\`

## Key Modules
- \`src/App.tsx\`: Main client router and application state holder.
- \`src/components/Dashboard.tsx\`: Task boards, filter controls, and project metrics.
- \`server/middleware/auth.ts\`: Express middleware verifying incoming Bearer tokens.
`
  },
  {
    path: 'src/App.tsx',
    language: 'typescript',
    content: `import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export interface User {
  id: string;
  email: string;
  name: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'login' | 'dashboard'>('login');

  useEffect(() => {
    const token = localStorage.getItem('taskflow_token');
    const storedUser = localStorage.getItem('taskflow_user');
    if (token && storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
        setActiveView('dashboard');
      } catch (err) {
        console.error('Failed to parse cached session', err);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_user', JSON.stringify(user));
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setCurrentUser(null);
    setActiveView('login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar 
        user={currentUser} 
        onLogout={handleLogout} 
        onNavigate={(view) => setActiveView(view)} 
      />

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeView === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Notice: Dashboard is rendered directly when activeView is 'dashboard' without protected route validation */
          <Dashboard user={currentUser} />
        )}
      </main>
    </div>
  );
}`
  },
  {
    path: 'src/components/Navbar.tsx',
    language: 'typescript',
    content: `import React from 'react';
import { User } from '../App';
import { CheckSquare, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: 'login' | 'dashboard') => void;
}

export default function Navbar({ user, onLogout, onNavigate }: NavbarProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer font-bold text-lg text-indigo-400"
        onClick={() => onNavigate(user ? 'dashboard' : 'login')}
      >
        <CheckSquare className="w-5 h-5 text-indigo-400" />
        <span>TaskFlow</span>
      </div>

      <nav className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors px-3 py-1.5 rounded border border-rose-900/50 hover:bg-rose-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
}`
  },
  {
    path: 'src/components/Login.tsx',
    language: 'typescript',
    content: `import React, { useState } from 'react';
import { User } from '../App';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
      <p className="text-sm text-slate-400 mb-6">Enter credentials to access your task workspace</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="developer@taskflow.dev"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}`
  },
  {
    path: 'src/components/Dashboard.tsx',
    language: 'typescript',
    content: `import React, { useState, useEffect } from 'react';
import { User } from '../App';
import { Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
}

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    // Note: If user is null, this may cause subtle errors or load data without credentials
    const token = localStorage.getItem('taskflow_token');
    fetch('/api/tasks', {
      headers: {
        Authorization: \`Bearer \${token || ''}\`
      }
    })
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tasks', err);
        setLoading(false);
      });
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      status: 'pending',
      priority: 'medium',
      assignedTo: user?.name || 'Unassigned'
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Dashboard</h1>
          <p className="text-sm text-slate-400">Track and assign team engineering milestones</p>
        </div>

        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New sprint task..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 w-64"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Tasks</span>
          <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold">Pending</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {tasks.filter(t => t.status === 'pending').length}
          </p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-500 uppercase font-semibold">Completed</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {tasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No tasks created yet.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-200">{task.title}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{task.assignedTo}</span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300">{task.priority}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}`
  },
  {
    path: 'server/index.ts',
    language: 'typescript',
    content: `import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// Security Warning: Permissive CORS configuration with credentials
app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected tasks mock store
const MOCK_TASKS = [
  { id: '1', title: 'Implement RBAC middleware', status: 'in_progress', priority: 'high', assignedTo: 'Alex' },
  { id: '2', title: 'Setup database migrations', status: 'completed', priority: 'medium', assignedTo: 'Sam' },
  { id: '3', title: 'Integrate OAuth provider', status: 'pending', priority: 'low', assignedTo: 'Jordan' }
];

app.get('/api/tasks', requireAuth, (req, res) => {
  res.json({ tasks: MOCK_TASKS, user: (req as any).user });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(\`TaskFlow server listening on port \${PORT}\`);
  });
}

export default app;`
  },
  {
    path: 'server/routes/auth.ts',
    language: 'typescript',
    content: `import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = Router();

// In-memory demo user database
const USERS = [
  {
    id: 'usr_1',
    email: 'developer@taskflow.dev',
    // bcrypt hash of "password123"
    passwordHash: '$2a$10$wT0E8u0z8Nn91YcIom1mmeoO14Z3f3v0t4mK2M4hXnFkG3uXhYfKi',
    name: 'Dev Lead'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = USERS.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export default router;`
  },
  {
    path: 'server/middleware/auth.ts',
    language: 'typescript',
    content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Security Warning: Fallback hardcoded secret in middleware
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No Bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
}`
  },
  {
    path: 'src/db/schema.ts',
    language: 'typescript',
    content: `import { pgTable, text, timestamp, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

// PostgreSQL Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// PostgreSQL Tasks Table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  completed: boolean('completed').default(false).notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// PostgreSQL Projects Table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});`
  },
  {
    path: 'src/components/ProtectedRoute.tsx',
    language: 'typescript',
    content: `import React, { useEffect } from 'react';
import { User } from '../App';

interface ProtectedRouteProps {
  user: User | null;
  onRedirect: () => void;
  children: React.ReactNode;
}

export default function ProtectedRoute({ user, onRedirect, children }: ProtectedRouteProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('taskflow_token') : null;

  useEffect(() => {
    if (!user || !token) {
      onRedirect();
    }
  }, [user, token, onRedirect]);

  if (!user || !token) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  return <>{children}</>;
}`
  }
];

export const TASKFLOW_REPO: Repository = {
  id: 'taskflow-demo',
  name: 'TaskFlow — AI Task Management Platform',
  description: 'AI Task Management Platform with React + TypeScript frontend, Node.js backend, PostgreSQL database, and JWT authentication.',
  isDemo: true,
  files: TASKFLOW_FILES,
  techStack: ['React + TypeScript', 'Node.js', 'PostgreSQL', 'JWT', 'Express', 'Drizzle ORM', 'Tailwind CSS', 'Vitest'],
  stats: {
    fileCount: 42,
    codeLines: 4120,
    languageDistribution: {
      TypeScript: 28,
      SQL: 4,
      JSON: 6,
      Markdown: 4
    }
  },
  metadata: {
    framework: 'React + TypeScript',
    backend: 'Node.js',
    database: 'PostgreSQL',
    authentication: 'JWT',
    fileCount: 42
  },
  analysis: {
    overview: 'TaskFlow is an AI Task Management Platform structured as a modern full-stack TypeScript workspace. It features a React SPA client, an Express Node.js API tier, a PostgreSQL database for persistent task and project storage, and JWT Bearer token authentication.',
    techStack: ['React + TypeScript', 'Node.js', 'PostgreSQL', 'JWT', 'Express', 'Drizzle ORM', 'Tailwind CSS', 'Vitest'],
    architecture: 'Full-stack Client-Server: React 18 + TypeScript SPA with Vite, Express REST API on Node.js, PostgreSQL relational database with Drizzle connection pooling, and stateless JWT Bearer token authentication.',
    importantFiles: [
      {
        path: 'src/App.tsx',
        role: 'Client Router & Session State',
        notes: 'Main application entry point handling navigation routing and user session caching.'
      },
      {
        path: 'server/middleware/auth.ts',
        role: 'Authentication Middleware',
        notes: 'Validates JWT Bearer headers, checks signature integrity, and attaches req.user context.'
      },
      {
        path: 'src/components/ProtectedRoute.tsx',
        role: 'Dashboard Route Protection',
        notes: 'Client guard verifying localStorage token presence before mounting protected view.'
      },
      {
        path: 'src/components/Dashboard.tsx',
        role: 'Task Management Interface',
        notes: 'Displays sprint metrics, task boards, and dispatches authenticated API calls.'
      },
      {
        path: 'src/db/schema.ts',
        role: 'PostgreSQL Relational Schema',
        notes: 'Drizzle ORM table definitions for users, tasks, and team projects.'
      },
      {
        path: 'server/routes/auth.ts',
        role: 'Auth Endpoints',
        notes: 'Handles user registration, bcrypt password hashing, and token issuance.'
      }
    ],
    potentialIssues: [
      {
        title: 'Unprotected Dashboard Client Route',
        description: 'Dashboard is toggled through basic state without a formal ProtectedRoute guard or token validity check on initial render.',
        severity: 'high'
      },
      {
        title: 'Fallback JWT Secret',
        description: 'Both server/routes/auth.ts and server/middleware/auth.ts fall back to "dev-secret-key-change-me" if process.env.JWT_SECRET is missing.',
        severity: 'high'
      },
      {
        title: 'Permissive Wildcard CORS with Credentials',
        description: 'server/index.ts enables CORS origin: "*" with credentials: true, which is rejected by modern browsers and exposes endpoints to cross-origin abuse.',
        severity: 'medium'
      }
    ],
    suggestedImprovements: [
      'Implement a dedicated <ProtectedRoute> wrapper component with token decoding and redirect logic.',
      'Enforce mandatory process.env.JWT_SECRET startup validation to halt startup if missing in production.',
      'Restrict CORS to allowed origin whitelist instead of wildcard asterisks.',
      'Add refresh token rotation to shorten access token lifespan from 8 hours to 15 minutes.'
    ]
  },
  lastAnalyzedAt: Date.now() - 3600000
};

// DEMO CODE CHANGES: 3 Realistic Diffs requested for Step 4
export const DEMO_CODE_CHANGES: CodeChange[] = [
  {
    filePath: 'server/middleware/auth.ts',
    description: 'Enforce strict JWT Bearer token validation and reject expired signatures',
    oldCode: `export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(); // Warning: Insecure pass-through
  }
  const token = authHeader.split(' ')[1];
  req.user = jwt.decode(token);
  next();
}`,
    newCode: `export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required. No Bearer token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid or expired authentication token.' 
    });
  }
}`,
    linesAdded: 16,
    linesRemoved: 6,
    diff: `--- a/server/middleware/auth.ts
+++ b/server/middleware/auth.ts
@@ -1,8 +1,18 @@
 export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
   const authHeader = req.headers.authorization;
-  if (!authHeader) {
-    return next(); // Warning: Insecure pass-through
-  }
-  const token = authHeader.split(' ')[1];
-  req.user = jwt.decode(token);
-  next();
+  if (!authHeader || !authHeader.startsWith('Bearer ')) {
+    return res.status(401).json({ 
+      error: 'Unauthorized', 
+      message: 'Authentication required. No Bearer token provided.' 
+    });
+  }
+  const token = authHeader.split(' ')[1];
+  try {
+    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
+    req.user = decoded;
+    next();
+  } catch (err: any) {
+    return res.status(403).json({ 
+      error: 'Forbidden', 
+      message: 'Invalid or expired authentication token.' 
+    });
+  }
 }`,
    explanation: 'Replaces insecure unverified token decode with cryptographic jwt.verify signature checks. Returns strict 401 Unauthorized for missing headers and 403 Forbidden for forged or expired tokens.'
  },
  {
    filePath: 'src/App.tsx',
    description: 'Add route configuration wrapping /dashboard inside ProtectedRoute guard',
    oldCode: `      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeView === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Dashboard user={currentUser} />
        )}
      </main>`,
    newCode: `      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {activeView === 'login' ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <ProtectedRoute user={currentUser} onRedirect={() => setActiveView('login')}>
            <Dashboard user={currentUser} />
          </ProtectedRoute>
        )}
      </main>`,
    linesAdded: 5,
    linesRemoved: 3,
    diff: `--- a/src/App.tsx
+++ b/src/App.tsx
@@ -118,5 +118,7 @@
         {activeView === 'login' ? (
           <Login onLoginSuccess={handleLoginSuccess} />
         ) : (
-          <Dashboard user={currentUser} />
+          <ProtectedRoute user={currentUser} onRedirect={() => setActiveView('login')}>
+            <Dashboard user={currentUser} />
+          </ProtectedRoute>
         )}`,
    explanation: 'Enforces route-level access control on the /dashboard route by wrapping the Dashboard component in ProtectedRoute. Unauthenticated navigation requests trigger an instant state redirect to /login.'
  },
  {
    filePath: 'src/components/ProtectedRoute.tsx',
    description: 'Implement ProtectedRoute component with session verification and unauthenticated redirect',
    oldCode: `// New component file`,
    newCode: `import React, { useEffect } from 'react';
import { User } from '../App';

interface ProtectedRouteProps {
  user: User | null;
  onRedirect: () => void;
  children: React.ReactNode;
}

export default function ProtectedRoute({ user, onRedirect, children }: ProtectedRouteProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('taskflow_token') : null;

  useEffect(() => {
    if (!user || !token) {
      onRedirect();
    }
  }, [user, token, onRedirect]);

  if (!user || !token) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  return <>{children}</>;
}`,
    linesAdded: 27,
    linesRemoved: 1,
    diff: `--- /dev/null
+++ b/src/components/ProtectedRoute.tsx
@@ -0,0 +1,27 @@
+import React, { useEffect } from 'react';
+import { User } from '../App';
+
+interface ProtectedRouteProps {
+  user: User | null;
+  onRedirect: () => void;
+  children: React.ReactNode;
+}
+
+export default function ProtectedRoute({ user, onRedirect, children }: ProtectedRouteProps) {
+  const token = typeof window !== 'undefined' ? localStorage.getItem('taskflow_token') : null;
+  useEffect(() => {
+    if (!user || !token) {
+      onRedirect();
+    }
+  }, [user, token, onRedirect]);
+
+  if (!user || !token) {
+    return (
+      <div className="p-8 text-center text-slate-400">
+        <p>Verifying authentication session...</p>
+      </div>
+    );
+  }
+  return <>{children}</>;
+}`,
    explanation: 'Encapsulates authentication state validation into a reusable wrapper component. Halts child DOM rendering until localStorage credentials and currentUser state are actively confirmed.'
  }
];

// DEMO STEP 5: 12 tests, 10 passed, 2 initially failed
export const DEMO_INITIAL_TESTS: TestResult[] = [
  {
    id: 'dt-1',
    suite: 'Auth API',
    name: 'POST /api/auth/login validates required email and password fields',
    status: 'passed',
    durationMs: 38,
    simulated: true
  },
  {
    id: 'dt-2',
    suite: 'Auth API',
    name: 'POST /api/auth/login issues valid signed JWT on valid credentials',
    status: 'passed',
    durationMs: 64,
    simulated: true
  },
  {
    id: 'dt-3',
    suite: 'Auth API',
    name: 'POST /api/auth/register hashes passwords with bcrypt salt before persistence',
    status: 'passed',
    durationMs: 112,
    simulated: true
  },
  {
    id: 'dt-4',
    suite: 'Database & ORM',
    name: 'PostgreSQL client connection pool initializes cleanly via Drizzle',
    status: 'passed',
    durationMs: 29,
    simulated: true
  },
  {
    id: 'dt-5',
    suite: 'Database & ORM',
    name: 'PostgreSQL tasks table returns expected columns (id, user_id, title, status)',
    status: 'passed',
    durationMs: 22,
    simulated: true
  },
  {
    id: 'dt-6',
    suite: 'Task API',
    name: 'GET /api/tasks retrieves task list filtered by authenticated user id',
    status: 'passed',
    durationMs: 46,
    simulated: true
  },
  {
    id: 'dt-7',
    suite: 'Task API',
    name: 'POST /api/tasks rejects payloads missing required title string',
    status: 'passed',
    durationMs: 27,
    simulated: true
  },
  {
    id: 'dt-8',
    suite: 'Task API',
    name: 'PATCH /api/tasks/:id toggles completed flag and sets updatedAt timestamp',
    status: 'passed',
    durationMs: 39,
    simulated: true
  },
  {
    id: 'dt-9',
    suite: 'Client Components',
    name: 'Navbar renders active user profile badge and triggers sign-out handler',
    status: 'passed',
    durationMs: 18,
    simulated: true
  },
  {
    id: 'dt-10',
    suite: 'Client Components',
    name: 'Login component binds inputs and manages in-flight submission state',
    status: 'passed',
    durationMs: 16,
    simulated: true
  },
  // INITIALLY FAILED TEST 1
  {
    id: 'dt-11',
    suite: 'Auth Middleware',
    name: 'GET /api/dashboard/metrics requires valid Bearer token',
    status: 'failed',
    durationMs: 54,
    simulated: true,
    error: `AssertionError: Expected 401 Unauthorized for unauthenticated request, received 200 OK.
    at /taskflow/tests/auth.test.ts:74:11
    at async runTest (/node_modules/vitest/dist/runner.js:142:9)
    Cause: Endpoint /api/dashboard/metrics lacked requireAuth middleware guard.`
  },
  // INITIALLY FAILED TEST 2
  {
    id: 'dt-12',
    suite: 'Route Protection',
    name: 'ProtectedRoute halts component render without valid localStorage taskflow_token',
    status: 'failed',
    durationMs: 48,
    simulated: true,
    error: `AssertionError: Expected immediate redirect to /login when token is null, but Dashboard view rendered children.
    at /taskflow/tests/routes.test.ts:52:15
    at renderWithHooks (/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    Cause: Initial render lifecycle mounted <Dashboard /> before checking auth session.`
  }
];

// RESOLVED TESTS AFTER AI FIX (12/12 passed)
export const DEMO_RESOLVED_TESTS: TestResult[] = DEMO_INITIAL_TESTS.map(t => {
  if (t.id === 'dt-11') {
    return {
      ...t,
      status: 'passed',
      durationMs: 24,
      error: undefined
    };
  }
  if (t.id === 'dt-12') {
    return {
      ...t,
      status: 'passed',
      durationMs: 19,
      error: undefined
    };
  }
  return t;
});

// DEMO STEP 6: Clearly labeled demo security findings
export const DEMO_SECURITY_REPORT: SecurityAuditReport = {
  timestamp: Date.now() - 1800000,
  totalFindings: 4,
  criticalCount: 0,
  highCount: 2,
  mediumCount: 2,
  lowCount: 0,
  scannerType: 'Static AST & Code Intelligence (Demo Dataset)',
  findings: [
    {
      id: 'demo-sec-1',
      category: 'Authorization',
      finding: '[DEMO DATA] Missing Route-Level Authorization Check on /api/dashboard/metrics',
      severity: 'high',
      affectedFile: 'server/routes/dashboard.ts',
      evidence: 'app.get("/api/dashboard/metrics", (req, res) => { ... }) without requireAuth middleware',
      whyItMatters: 'Allows unauthenticated external actors to retrieve internal task velocity metrics, project counts, and team performance indicators without providing a valid JWT.',
      recommendedFix: 'Attach the requireAuth middleware to the /api/dashboard/metrics route definition before the request handler.',
      validationSteps: [
        'Send curl GET http://localhost:3000/api/dashboard/metrics without Authorization header',
        'Verify response returns HTTP 401 Unauthorized with JSON error payload'
      ]
    },
    {
      id: 'demo-sec-2',
      category: 'Secrets',
      finding: '[DEMO DATA] Hardcoded Fallback JWT Secret in Authentication Middleware',
      severity: 'high',
      affectedFile: 'server/middleware/auth.ts',
      evidence: 'const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-me";',
      whyItMatters: 'If deployed with missing environment variables, the system falls back to a publicly known secret, enabling attackers to forge valid admin JWTs.',
      recommendedFix: 'Throw a fatal Error during server initialization if process.env.JWT_SECRET is unset or shorter than 32 characters in production.',
      validationSteps: [
        'Start server with unset JWT_SECRET and confirm process exits with code 1',
        'Verify test environment loads isolated test secret'
      ]
    },
    {
      id: 'demo-sec-3',
      category: 'Authentication',
      finding: '[DEMO DATA] LocalStorage JWT Token Persistence Susceptible to XSS Exfiltration',
      severity: 'medium',
      affectedFile: 'src/App.tsx',
      evidence: 'localStorage.setItem("taskflow_token", token);',
      whyItMatters: 'Tokens stored in window.localStorage are accessible to any JavaScript running in the origin, exposing sessions to Cross-Site Scripting (XSS) compromise.',
      recommendedFix: 'Migrate session tokens to HttpOnly, SameSite=Strict cookies with Secure flags in production.',
      validationSteps: [
        'Inspect document.cookie in browser console; confirm session token cannot be read via client scripts',
        'Verify CSRF protection headers accompany state-modifying requests'
      ]
    },
    {
      id: 'demo-sec-4',
      category: 'Configuration',
      finding: '[DEMO DATA] Permissive Wildcard CORS with Credentials Enabled',
      severity: 'medium',
      affectedFile: 'server/index.ts',
      evidence: 'app.use(cors({ origin: "*", credentials: true }));',
      whyItMatters: 'Using wildcard asterisks with credentials violates browser security specifications and exposes endpoints to cross-origin credential misuse.',
      recommendedFix: 'Replace origin: "*" with an explicit whitelist of trusted frontend domains (e.g. process.env.CLIENT_ORIGIN).',
      validationSteps: [
        'Send preflight OPTIONS request with Origin: http://malicious-site.com',
        'Verify server returns 403 Forbidden or omits Access-Control-Allow-Origin'
      ]
    }
  ]
};
