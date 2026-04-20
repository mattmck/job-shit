import type { TaskRecord } from '../api/client';

interface TailorTaskMetadata {
  frontendJobId: string;
  company?: string;
  jobTitle?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function getTailorTaskMetadata(task: Pick<TaskRecord, 'jobId' | 'inputJson'>): TailorTaskMetadata {
  const envelope = asRecord(JSON.parse(task.inputJson || '{}'));
  const input = asRecord(envelope.input);

  return {
    frontendJobId: asString(input._frontendJobId) ?? asString(envelope._frontendJobId) ?? task.jobId,
    company: asString(input.company) ?? asString(envelope.company),
    jobTitle: asString(input.jobTitle) ?? asString(envelope.jobTitle),
  };
}
