import type { ActiveDoc, EditorData, Job } from '../types.js';
import { reconstructEditorData } from './markdown.js';

export function editorDataMatchesDoc(
  editorData: EditorData | null,
  doc: ActiveDoc,
): editorData is EditorData {
  if (!editorData) return false;
  return doc === 'resume' ? editorData.kind === 'resume' : editorData.kind !== 'resume';
}

export function getJobDocumentMarkdown(
  job: Job | null | undefined,
  doc: ActiveDoc,
): string | null {
  if (!job?.result) return null;

  if (editorDataMatchesDoc(job._editorData, doc)) {
    return reconstructEditorData(job._editorData);
  }

  return doc === 'resume'
    ? job.result.output.resume
    : job.result.output.coverLetter;
}

export function getJobDocumentsForRegrade(
  job: Job | null | undefined,
): { resume: string; coverLetter: string } | null {
  if (!job?.result) return null;

  return {
    resume: getJobDocumentMarkdown(job, 'resume')!,
    coverLetter: getJobDocumentMarkdown(job, 'cover')!,
  };
}
