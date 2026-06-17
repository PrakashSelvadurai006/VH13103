import React, { useState } from 'react';
import { usePriorityInbox } from '../hooks/useNotifications';
import { PriorityCard } from '../components/PriorityCard';
import { Sparkles, ShieldAlert, ArrowUpDown, RefreshCw } from 'lucide-react';

interface PriorityPageProps {
  studentId: number;
}

export const PriorityPage: React.FC<PriorityPageProps> = ({ studentId }) => {
  const { notifications, isLoading, isError, error, refetch } = usePriorityInbox(studentId);
  const [sortOption, setSortOption] = useState<'score' | 'recency'>('score');

  // Handle client-side sorting toggles
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (sortOption === 'score') {
      // Primary score descending, break ties by date
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Recency descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-secondary animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Priority Inbox</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-normal">
            Your top 10 most critical alerts computed dynamically in real-time. Placement drives and unread status get high precedence.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => refetch()}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all duration-300"
            title="Refresh Priority List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Sorting Dropdown/Toggle */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as 'score' | 'recency')}
              className="bg-transparent border-none text-foreground outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="score">Priority Score</option>
              <option value="recency">Recency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading and Error states */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl border border-border bg-card/40 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Failed to load priority inbox:</span>{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          {sortedNotifications.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/20 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-muted-foreground/30" />
              <span>Priority inbox is empty. We will list critical updates here when they arrive.</span>
            </div>
          ) : (
            sortedNotifications.map((notif) => (
              <PriorityCard key={notif.id} notification={notif} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
