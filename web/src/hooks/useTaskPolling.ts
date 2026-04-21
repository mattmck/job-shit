import { useEffect, useRef } from 'react';
import { listTasks, type TaskRecord } from '../api/client.js';
import { getTailorTaskMetadata } from '../lib/tasks.js';

interface TailorSyncSnapshot {
  pendingIds: string[];
  runningId: string | null;
  runningStartedAt: number;
}

interface UseTaskPollingOptions {
  workspaceId: string | null;
  onTaskCompleted: (task: TaskRecord) => void;
  onTaskFailed: (task: TaskRecord) => void;
  onActiveTask?: (task: TaskRecord) => void;
  onTailorSync?: (snapshot: TailorSyncSnapshot) => void;
  intervalMs?: number;
}

export function useTaskPolling({ workspaceId, onTaskCompleted, onTaskFailed, onActiveTask, onTailorSync, intervalMs = 2000 }: UseTaskPollingOptions) {
  const knownTasksRef = useRef<Map<string, TaskRecord>>(new Map());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;
    const observedSince = Date.now();
    knownTasksRef.current = new Map();

    function isNewTerminalTask(task: TaskRecord): boolean {
      if (task.status !== 'completed' && task.status !== 'failed') return false;
      const createdAt = Date.parse(task.createdAt);
      const updatedAt = Date.parse(task.updatedAt);
      return createdAt >= observedSince || updatedAt >= observedSince;
    }

    const schedulePoll = (delay: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(poll, delay);
    };

    async function poll() {
      if (cancelled) return;
      try {
        const { tasks } = await listTasks(workspaceId!);
        const known = knownTasksRef.current;

        for (const task of tasks) {
          const prev = known.get(task.id);
          if (!prev && (task.status === 'pending' || task.status === 'running')) {
            console.info('[workbench] Active task observed on poll', {
              taskId: task.id,
              type: task.type,
              status: task.status,
            });
            onActiveTask?.(task);
          }
          if (!prev && isNewTerminalTask(task)) {
            console.info('[workbench] New terminal task observed', {
              taskId: task.id,
              type: task.type,
              status: task.status,
            });
            if (task.status === 'completed') onTaskCompleted(task);
            if (task.status === 'failed') onTaskFailed(task);
          }
          if (prev && prev.status !== task.status) {
            console.info('[workbench] Task status changed', {
              taskId: task.id,
              type: task.type,
              from: prev.status,
              to: task.status,
            });
            if (task.status === 'completed') onTaskCompleted(task);
            if (task.status === 'failed') onTaskFailed(task);
          }
          known.set(task.id, task);
        }

        if (onTailorSync) {
          const tailorTasks = tasks.filter((t) => t.type === 'tailor');
          const pendingIds: string[] = [];
          let runningId: string | null = null;
          let runningStartedAt = 0;
          for (const task of tailorTasks) {
            if (task.status === 'pending') {
              pendingIds.push(getTailorTaskMetadata(task).frontendJobId);
            } else if (task.status === 'running' && runningId == null) {
              runningId = getTailorTaskMetadata(task).frontendJobId;
              runningStartedAt = Date.parse(task.updatedAt) || Date.parse(task.createdAt) || Date.now();
            }
          }
          onTailorSync({ pendingIds, runningId, runningStartedAt });
        }

        const hasActive = tasks.some(t => t.status === 'pending' || t.status === 'running');
        if (hasActive && !cancelled) {
          schedulePoll(intervalMs);
        } else if (!cancelled) {
          // slow poll when idle
          schedulePoll(intervalMs * 5);
        }
      } catch (err) {
        console.warn('[workbench] Task polling failed', err);
        if (!cancelled) schedulePoll(intervalMs * 5);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [workspaceId, onTaskCompleted, onTaskFailed, onActiveTask, onTailorSync, intervalMs]);
}
