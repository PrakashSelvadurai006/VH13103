import React from 'react';
import { Notification } from '../types';
import { Sparkles, Calendar } from 'lucide-react';

interface PriorityCardProps {
  notification: Notification;
}

export const PriorityCard: React.FC<PriorityCardProps> = ({ notification }) => {
  const { type, message, isRead, createdAt, score } = notification;

  const getBadgeStyle = () => {
    switch (type) {
      case 'Placement':
        return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30';
      case 'Result':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Event':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Compute breakdown points text for the tooltip/description
  const getBreakdown = () => {
    const basePoints = type === 'Placement' ? 20 : type === 'Result' ? 10 : 5;
    const unreadPoints = !isRead ? 10 : 0;
    return `${type} Base (${basePoints} pts) + ${!isRead ? 'Unread' : 'Read'} (${unreadPoints} pts)`;
  };

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative p-5 rounded-xl border border-secondary/20 bg-secondary/[0.01] hover:border-secondary/40 transition-all duration-300 glass flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group glow-secondary">
      <div className="flex gap-4 items-start flex-1">
        <div className="mt-1 flex-shrink-0 p-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle()}`}
            >
              {type}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <p className="text-sm text-foreground/95 font-medium leading-relaxed">
            {message}
          </p>
          <span className="text-[11px] text-muted-foreground/50 italic select-none">
            Breakdown: {getBreakdown()}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 self-start md:self-center">
        <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30 text-secondary font-bold text-xs flex items-center gap-1 glow-secondary select-none">
          <span>{score} PTS</span>
        </div>
      </div>
    </div>
  );
};
