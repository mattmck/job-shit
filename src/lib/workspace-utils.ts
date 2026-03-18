import { listSavedWorkspaces, loadSavedWorkspace } from '../services/workspace-store.js';
import { SavedWorkspace } from '../types/index.js';

export function parseVersionIndex(raw: string | undefined, fallback: number): number {
  const value = raw === undefined ? fallback : Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid version index: ${raw ?? fallback}`);
  }
  return value;
}

export function resolveWorkspaceForJob(jobId: string, requestedWorkspaceId?: string): SavedWorkspace {
  if (requestedWorkspaceId) {
    const workspace = loadSavedWorkspace(requestedWorkspaceId);
    if (!workspace.snapshot.jobResults?.[jobId]?.length) {
      throw new Error(`Workspace "${requestedWorkspaceId}" has no saved versions for job "${jobId}".`);
    }
    return workspace;
  }

  for (const summary of listSavedWorkspaces()) {
    const workspace = loadSavedWorkspace(summary.id);
    if (workspace.snapshot.jobResults?.[jobId]?.length) {
      return workspace;
    }
  }

  throw new Error(`No saved workspace versions found for job "${jobId}".`);
}
