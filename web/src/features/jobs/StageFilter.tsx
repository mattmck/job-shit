import { useWorkspace } from '../../context';
import type { JobListFilter } from '../../types';
import { cn } from '@/components/ui/utils';

interface FilterPill {
  value: JobListFilter;
  label: string;
}

const FILTER_PILLS: FilterPill[] = [
  { value: 'all', label: 'All' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offer', label: 'Offer' },
];

export function StageFilter() {
  const { state, dispatch } = useWorkspace();

  function getCount(filter: JobListFilter): number {
    if (filter === 'all') return state.jobs.length;
    return state.jobs.filter(
      (job) => job.stage.toLowerCase() === filter.toLowerCase()
    ).length;
  }

  function handleClick(filter: JobListFilter) {
    dispatch({ type: 'SET_JOB_FILTER', filter });
  }

  return (
    <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-border shrink-0">
      {FILTER_PILLS.map((pill) => {
        const count = getCount(pill.value);
        const isActive = state.jobListFilter === pill.value;
        return (
          <button
            key={pill.value}
            onClick={() => handleClick(pill.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            <span>{pill.label}</span>
            <span
              className={cn(
                'rounded-full px-1 text-[10px] font-semibold',
                isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
