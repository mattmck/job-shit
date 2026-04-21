import { describe, expect, it } from 'vitest';
import { initialState, reducer } from '../web/src/state.js';
import type { Job, WorkspaceState } from '../web/src/types.js';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    company: 'Acme',
    title: 'Staff Engineer',
    jd: 'Build reliable systems',
    stage: 'wishlist',
    status: 'tailored',
    checked: false,
    scoresStale: false,
    result: null,
    error: null,
    _editorData: null,
    ...overrides,
  };
}

function makeState(overrides: Partial<WorkspaceState> = {}): WorkspaceState {
  return {
    ...initialState,
    jobs: [makeJob()],
    ...overrides,
  };
}

describe('web state reducer', () => {
  it('marks scores stale on a single job', () => {
    const state = makeState();
    const next = reducer(state, { type: 'SET_JOB_SCORES_STALE', id: 'job-1', stale: true });

    expect(next.jobs[0]?.scoresStale).toBe(true);
  });

  it('tracks regrade queue totals and resets them when drained', () => {
    const state = makeState();
    const queued = reducer(state, {
      type: 'SET_REGRADE_QUEUE',
      queue: ['job-1', 'job-2'],
      total: 2,
    });
    const drained = reducer(queued, {
      type: 'SET_REGRADE_QUEUE',
      queue: [],
    });

    expect(queued.regradeQueue).toEqual(['job-1', 'job-2']);
    expect(queued.regradeQueueTotal).toBe(2);
    expect(drained.regradeQueueTotal).toBe(0);
  });

  it('keeps the current configured providers when loading a workspace', () => {
    const state = makeState({
      tailorProvider: 'openai',
      tailorModel: 'gpt-4o-mini',
      scoreProvider: 'openai',
      scoreModel: 'gpt-4o-mini',
    });

    const next = reducer(state, {
      type: 'LOAD_WORKSPACE',
      state: {
        workspaceName: 'Saved with old config',
        tailorProvider: 'gemini',
        tailorModel: 'gemini-2.0-flash-lite',
        scoreProvider: 'gemini',
        scoreModel: 'gemini-2.0-flash-lite',
      },
    });

    expect(next.tailorProvider).toBe('openai');
    expect(next.tailorModel).toBe('gpt-4o-mini');
    expect(next.scoreProvider).toBe('openai');
    expect(next.scoreModel).toBe('gpt-4o-mini');
  });

  it('merges Huntr refreshes by Huntr id while preserving saved tailoring state', () => {
    const state = makeState({
      jobs: [
        makeJob({
          id: 'db-job-1',
          dbJobId: 'db-job-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'wishlist',
          source: 'huntr',
          huntrId: 'huntr-1',
          listAddedAt: '2026-04-18T12:00:00.000Z',
          status: 'reviewed',
          checked: true,
          result: { output: { resume: 'Resume', coverLetter: 'Cover' } },
        }),
        makeJob({
          id: 'manual-1',
          company: 'Manual Co',
          stage: 'manual',
          source: 'manual',
          huntrId: null,
        }),
      ],
    });

    const next = reducer(state, {
      type: 'MERGE_JOBS',
      jobs: [
        makeJob({
          id: 'huntr-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'interview',
          source: 'huntr',
          huntrId: 'huntr-1',
          listAddedAt: '2026-04-19T12:00:00.000Z',
        }),
      ],
    });

    expect(next.jobs).toHaveLength(2);
    expect(next.jobs[0]?.id).toBe('db-job-1');
    expect(next.jobs[0]?.dbJobId).toBe('db-job-1');
    expect(next.jobs[0]?.stage).toBe('interview');
    expect(next.jobs[0]?.listAddedAt).toBe('2026-04-19T12:00:00.000Z');
    expect(next.jobs[0]?.status).toBe('reviewed');
    expect(next.jobs[0]?.result?.output.resume).toBe('Resume');
    expect(next.jobs[1]?.id).toBe('manual-1');
  });

  it('reconciles legacy saved Huntr jobs that do not have Huntr ids yet', () => {
    const state = makeState({
      jobs: [
        makeJob({
          id: 'db-job-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'other',
          source: 'huntr',
          huntrId: null,
          status: 'reviewed',
          checked: true,
          result: { output: { resume: 'Resume', coverLetter: 'Cover' } },
        }),
      ],
    });

    const next = reducer(state, {
      type: 'MERGE_JOBS',
      jobs: [
        makeJob({
          id: 'huntr-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'applied',
          source: 'huntr',
          huntrId: 'huntr-1',
        }),
      ],
    });

    expect(next.jobs).toHaveLength(1);
    expect(next.jobs[0]?.id).toBe('db-job-1');
    expect(next.jobs[0]?.huntrId).toBe('huntr-1');
    expect(next.jobs[0]?.stage).toBe('applied');
    expect(next.jobs[0]?.status).toBe('reviewed');
  });

  it('drops duplicate legacy rows once a matching Huntr-backed row exists', () => {
    const state = makeState({
      activeJobId: 'db-job-1',
      jobs: [
        makeJob({
          id: 'huntr-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'applied',
          source: 'huntr',
          huntrId: 'huntr-1',
        }),
        makeJob({
          id: 'db-job-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'other',
          source: 'huntr',
          huntrId: null,
        }),
      ],
    });

    const next = reducer(state, {
      type: 'MERGE_JOBS',
      jobs: [
        makeJob({
          id: 'huntr-1',
          company: 'Acme',
          title: 'Engineer',
          stage: 'interview',
          source: 'huntr',
          huntrId: 'huntr-1',
        }),
      ],
    });

    expect(next.jobs).toHaveLength(1);
    expect(next.jobs[0]?.id).toBe('huntr-1');
    expect(next.jobs[0]?.stage).toBe('interview');
    expect(next.activeJobId).toBe('huntr-1');
  });

  describe('SYNC_TAILOR_FROM_TASKS', () => {
    it('rehydrates tailor queue and running job from backend task state', () => {
      const state = makeState({ tailorQueue: [], tailorQueueTotal: 0, tailorRunning: null });
      const next = reducer(state, {
        type: 'SYNC_TAILOR_FROM_TASKS',
        pendingIds: ['job-2', 'job-3', 'job-4'],
        runningId: 'job-1',
        runningStartedAt: 1_700_000_000_000,
      });

      expect(next.tailorQueue).toEqual(['job-2', 'job-3', 'job-4']);
      expect(next.tailorRunning).toBe('job-1');
      expect(next.tailorRunningStartedAt).toBe(1_700_000_000_000);
      // Total includes the currently-running job so progress reflects all in-flight work.
      expect(next.tailorQueueTotal).toBe(4);
    });

    it('preserves an existing startedAt when the running job is unchanged', () => {
      const state = makeState({
        tailorQueue: ['job-2'],
        tailorQueueTotal: 2,
        tailorRunning: 'job-1',
        tailorRunningStartedAt: 1_699_999_999_000,
      });
      const next = reducer(state, {
        type: 'SYNC_TAILOR_FROM_TASKS',
        pendingIds: ['job-2'],
        runningId: 'job-1',
        runningStartedAt: 1_700_000_000_000,
      });

      expect(next.tailorRunningStartedAt).toBe(1_699_999_999_000);
    });

    it('clears state when no tailor tasks remain', () => {
      const state = makeState({
        tailorQueue: ['job-2'],
        tailorQueueTotal: 3,
        tailorRunning: 'job-1',
        tailorRunningStartedAt: 1_700_000_000_000,
      });
      const next = reducer(state, {
        type: 'SYNC_TAILOR_FROM_TASKS',
        pendingIds: [],
        runningId: null,
      });

      expect(next.tailorQueue).toEqual([]);
      expect(next.tailorQueueTotal).toBe(0);
      expect(next.tailorRunning).toBeNull();
      expect(next.tailorRunningStartedAt).toBe(0);
    });

    it('keeps prior total when it exceeds current in-flight (so progress bar reflects overall batch)', () => {
      const state = makeState({
        tailorQueue: ['job-2', 'job-3'],
        tailorQueueTotal: 5,
        tailorRunning: 'job-1',
        tailorRunningStartedAt: 1_700_000_000_000,
      });
      const next = reducer(state, {
        type: 'SYNC_TAILOR_FROM_TASKS',
        pendingIds: ['job-3'],
        runningId: 'job-2',
      });

      expect(next.tailorQueueTotal).toBe(5);
      expect(next.tailorQueue).toEqual(['job-3']);
      expect(next.tailorRunning).toBe('job-2');
    });
  });
});
