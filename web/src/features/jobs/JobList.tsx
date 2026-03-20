import { useWorkspace } from '../../context';
import type { Job } from '../../types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/components/ui/utils';

function getStatusIndicator(status: Job['status']): string {
  switch (status) {
    case 'loaded':
      return '○';
    case 'tailoring':
      return '⟳';
    case 'tailored':
      return '●';
    case 'reviewed':
      return '✓';
    case 'error':
      return '✕';
    default:
      return '○';
  }
}

function getStageBadgeClass(stage: string): string {
  const lower = stage.toLowerCase();
  if (lower === 'wishlist') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (lower === 'applied') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (lower === 'interviewing') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (lower === 'offer') return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-secondary text-muted-foreground border-border';
}

function JobItem({ job }: { job: Job }) {
  const { state, dispatch } = useWorkspace();
  const isSelected = state.activeJobId === job.id;

  function handleClick() {
    dispatch({ type: 'SET_ACTIVE_JOB', id: job.id });
  }

  function handleCheckChange(checked: boolean | 'indeterminate') {
    dispatch({ type: 'UPDATE_JOB', id: job.id, patch: { checked: checked === true } });
  }

  const statusChar = getStatusIndicator(job.status);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer border-b border-border/50 hover:bg-secondary/30 transition-colors',
        isSelected && 'bg-secondary border-l-2 border-l-primary pl-[6px]'
      )}
    >
      {/* Checkbox */}
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={job.checked}
          onCheckedChange={handleCheckChange}
          className="shrink-0"
        />
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[13px] font-semibold text-foreground truncate leading-tight">
            {job.company}
          </span>
          <span
            className={cn(
              'shrink-0 inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
              getStageBadgeClass(job.stage)
            )}
          >
            {job.stage}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate leading-tight">
            {job.title}
          </span>
          <span
            className={cn(
              'shrink-0 text-[11px] font-mono',
              job.status === 'error' && 'text-destructive',
              job.status === 'reviewed' && 'text-green-600',
              job.status === 'tailored' && 'text-primary',
              job.status === 'tailoring' && 'text-yellow-600',
              job.status === 'loaded' && 'text-muted-foreground'
            )}
          >
            {statusChar}
          </span>
        </div>
      </div>
    </div>
  );
}

export function JobList() {
  const { state } = useWorkspace();

  const filteredJobs =
    state.jobListFilter === 'all'
      ? state.jobs
      : state.jobs.filter(
          (job) => job.stage.toLowerCase() === state.jobListFilter.toLowerCase()
        );

  if (filteredJobs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          {state.jobs.length === 0
            ? 'No jobs loaded. Click "Load Huntr" to import jobs.'
            : 'No jobs match the current filter.'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div>
        {filteredJobs.map((job) => (
          <JobItem key={job.id} job={job} />
        ))}
      </div>
    </ScrollArea>
  );
}
