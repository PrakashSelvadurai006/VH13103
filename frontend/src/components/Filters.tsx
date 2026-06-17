import React from 'react';

interface FiltersProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedRead: string;
  onReadChange: (status: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  selectedType,
  onTypeChange,
  selectedRead,
  onReadChange,
}) => {
  const types = ['All', 'Placement', 'Result', 'Event'];
  const statuses = ['All', 'Unread', 'Read'];

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full justify-between items-start md:items-center">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filter by category</span>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                selectedType === type
                  ? 'bg-primary/15 text-primary border-primary glow-primary'
                  : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filter by status</span>
        <div className="flex gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => onReadChange(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                selectedRead === status
                  ? 'bg-secondary/15 text-secondary border-secondary glow-secondary'
                  : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
