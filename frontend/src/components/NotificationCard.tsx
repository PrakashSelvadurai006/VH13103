import React from 'react';
import { Notification } from '../types';
import { CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string, isRead: boolean) => void;
  onDelete: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
  onDelete,
}) => {
  const { id, type, message, isRead, createdAt } = notification;

  // Custom badges depending on notification category
  const getBadgeStyle = () => {
    switch (type) {
      case 'Placement':
        return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30 glow-secondary';
      case 'Result':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30 glow-primary';
      case 'Event':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formattedDate = new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`relative p-5 rounded-xl border transition-all duration-300 glass flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group ${
        !isRead ? 'border-primary/30 bg-primary/[0.02]' : 'border-border'
      } hover:border-muted-foreground/30 hover:scale-[1.01]`}
    >
      <div className="flex gap-4 items-start flex-1">
        {/* Glow status dot */}
        <button
          onClick={() => onMarkRead(id, !isRead)}
          className="mt-1 flex-shrink-0 transition-colors"
          title={isRead ? 'Mark as Unread' : 'Mark as Read'}
        >
          {!isRead ? (
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <Circle className="relative inline-flex rounded-full h-4 w-4 text-emerald-400 fill-emerald-400/20 stroke-[2.5]" />
            </div>
          ) : (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/50 hover:text-primary transition-colors stroke-[2]" />
          )}
        </button>

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
          <p className={`text-sm ${!isRead ? 'text-foreground font-medium' : 'text-muted-foreground/80'}`}>
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => onMarkRead(id, !isRead)}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            !isRead
              ? 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
              : 'bg-card border-border hover:bg-muted text-muted-foreground'
          }`}
        >
          {isRead ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors duration-200"
          title="Delete Notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
