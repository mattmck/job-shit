import { describe, it, expect, vi } from 'vitest';
import { createWorker } from '../src/worker.js';
import { createSqliteAdapter } from '../src/db/sqlite.js';
import { runMigrations } from '../src/db/migrations.js';
import { WorkspaceRepo } from '../src/repositories/workspaces.js';
import { JobRepo } from '../src/repositories/jobs.js';
import { TaskRepo } from '../src/repositories/tasks.js';
import { DocumentRepo } from '../src/repositories/documents.js';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';

function makeTempDb() {
  const dir = mkdtempSync(join(tmpdir(), 'wt-worker-'));
  const db = createSqliteAdapter(join(dir, 'test.db'));
  runMigrations(db);
  return { db, cleanup: () => { db.close(); rmSync(dir, { recursive: true }); } };
}

describe('createWorker', () => {
  it('processes a tailor task and marks it completed', async () => {
    const { db, cleanup } = makeTempDb();
    try {
      const ws = new WorkspaceRepo(db).create({ name: 'WS', sourceResume: '# Matt', sourceBio: 'bio' });
      const job = new JobRepo(db).create({ workspaceId: ws.id, company: 'Acme', jd: 'Build things' });
      const taskRepo = new TaskRepo(db);
      const task = taskRepo.create({
        workspaceId: ws.id, jobId: job.id, type: 'tailor',
        inputJson: JSON.stringify({ resume: '# Matt', bio: 'bio', company: 'Acme', jobDescription: 'Build things' }),
      });

      const mockRun = vi.fn().mockResolvedValue({
        output: { resume: '# Tailored Matt', coverLetter: 'Dear Hiring Manager' },
      });

      const worker = createWorker(db, { runTailor: mockRun });
      await worker.processOne();

      expect(mockRun).toHaveBeenCalledOnce();
      const updated = taskRepo.findById(task.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.resultJson).toBeTruthy();

      const docRepo = new DocumentRepo(db);
      expect(docRepo.findLatest(job.id, 'resume')?.markdown).toBe('# Tailored Matt');
      expect(docRepo.findLatest(job.id, 'cover')?.markdown).toBe('Dear Hiring Manager');
    } finally {
      cleanup();
    }
  });

  it('marks task failed when runTailor throws', async () => {
    const { db, cleanup } = makeTempDb();
    try {
      const ws = new WorkspaceRepo(db).create({ name: 'WS' });
      const job = new JobRepo(db).create({ workspaceId: ws.id, company: 'X' });
      const taskRepo = new TaskRepo(db);
      const task = taskRepo.create({
        workspaceId: ws.id, jobId: job.id, type: 'tailor',
        inputJson: JSON.stringify({}),
      });

      const worker = createWorker(db, {
        runTailor: vi.fn().mockRejectedValue(new Error('API timeout')),
      });
      await worker.processOne();

      const updated = taskRepo.findById(task.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error).toContain('API timeout');
    } finally {
      cleanup();
    }
  });

  it('returns false from processOne when queue is empty', async () => {
    const { db, cleanup } = makeTempDb();
    try {
      const worker = createWorker(db, { runTailor: vi.fn() });
      const result = await worker.processOne();
      expect(result).toBe(false);
    } finally {
      cleanup();
    }
  });
});
