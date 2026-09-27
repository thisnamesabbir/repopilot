import { describe, it, expect } from 'vitest';
import { TASKFLOW_REPO } from '../src/data/demoRepo';

describe('Demo Repository Structure', () => {
  it('should include required TaskFlow files', () => {
    const requiredFiles = [
      'src/App.tsx',
      'src/components/Navbar.tsx',
      'src/components/Login.tsx',
      'src/components/Dashboard.tsx',
      'server/index.ts',
      'server/routes/auth.ts',
      'server/middleware/auth.ts',
      'package.json',
      'README.md'
    ];

    const filePaths = TASKFLOW_REPO.files.map(f => f.path);
    for (const reqFile of requiredFiles) {
      expect(filePaths).toContain(reqFile);
    }
  });

  it('should have realistic non-empty source code for App and server', () => {
    const appFile = TASKFLOW_REPO.files.find(f => f.path === 'src/App.tsx');
    const serverFile = TASKFLOW_REPO.files.find(f => f.path === 'server/index.ts');
    const navbarFile = TASKFLOW_REPO.files.find(f => f.path === 'src/components/Navbar.tsx');

    expect(appFile).toBeDefined();
    expect(appFile?.content).toContain('taskflow_token');
    expect(navbarFile?.content).toContain('TaskFlow');
    expect(serverFile).toBeDefined();
    expect(serverFile?.content).toContain('express');
  });

  it('should contain initial security and architecture issues for audit', () => {
    const authFile = TASKFLOW_REPO.files.find(f => f.path === 'server/middleware/auth.ts');
    expect(authFile?.content).toContain('dev-secret-key-change-me');
  });
});
