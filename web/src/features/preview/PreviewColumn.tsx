import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkspace } from '../../context';
import { DiffView } from './DiffView';
import { parseMarkdownSections, reconstructMarkdown } from '../../lib/markdown';
import * as api from '../../api/client';

export function PreviewColumn() {
  const { state, dispatch } = useWorkspace();
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const job = state.activeJobId
    ? state.jobs.find((j) => j.id === state.activeJobId)
    : null;

  // Derive the current markdown for the active document
  const activeMarkdown = (() => {
    if (!job?.result) return null;

    const rawMarkdown =
      state.activeDoc === 'resume'
        ? job.result.output.resume
        : job.result.output.coverLetter;

    // If there is editorData, reconstruct from the edited sections
    if (job._editorData) {
      return reconstructMarkdown(
        job._editorData.sections.map((s) => ({
          id: s.id,
          heading: s.heading,
          content: s.content,
        }))
      );
    }

    return rawMarkdown;
  })();

  // Derive the original markdown for diffing
  const originalMarkdown = (() => {
    if (state.activeDoc === 'resume') {
      return state.sourceResume;
    }
    // Cover letter: use the stored baseCoverLetter
    return state.sourceCoverLetter;
  })();

  // Render HTML preview when content or mode changes
  useEffect(() => {
    if (state.viewMode !== 'preview') return;
    if (!activeMarkdown) {
      setPreviewHtml('');
      return;
    }

    // Debounce to avoid hammering the API on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      api
        .renderHtml({ markdown: activeMarkdown })
        .then((res) => {
          setPreviewHtml(res.html);
        })
        .catch((err) => {
          console.error('PreviewColumn: renderHtml failed', err);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeMarkdown, state.viewMode]);

  const handleExportPdf = useCallback(async () => {
    if (!activeMarkdown || exportingPdf) return;
    setExportingPdf(true);
    try {
      const blob = await api.exportPdf({ markdown: activeMarkdown });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = job
        ? `${job.company}-${job.title}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : 'document';
      a.download = `${state.activeDoc === 'resume' ? 'resume' : 'cover-letter'}-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PreviewColumn: exportPdf failed', err);
    } finally {
      setExportingPdf(false);
    }
  }, [activeMarkdown, exportingPdf, job, state.activeDoc]);

  const handleSetViewMode = useCallback(
    (mode: 'preview' | 'diff') => {
      dispatch({ type: 'SET_VIEW_MODE', mode });
    },
    [dispatch]
  );

  // Empty / no-result states
  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a job to preview
      </div>
    );
  }

  if (!job.result) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {job.status === 'tailoring' ? 'Tailoring in progress…' : 'Run tailoring to generate a preview'}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        {/* Preview / Diff toggle */}
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => handleSetViewMode('preview')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              state.viewMode === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-secondary/60'
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('diff')}
            className={`px-3 py-1 text-xs font-medium transition-colors border-l border-border ${
              state.viewMode === 'diff'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-secondary/60'
            }`}
          >
            Diff
          </button>
        </div>

        <div className="flex-1" />

        {/* Export PDF button */}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={exportingPdf || !activeMarkdown}
          title="Export as PDF"
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exportingPdf ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {state.viewMode === 'preview' ? (
          previewLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Rendering preview…
            </div>
          ) : previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-none"
              title="Document preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No content to preview
            </div>
          )
        ) : (
          <DiffView
            original={originalMarkdown}
            modified={activeMarkdown ?? ''}
          />
        )}
      </div>
    </div>
  );
}
