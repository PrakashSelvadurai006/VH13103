import React from 'react';
import { MetaData } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  meta: MetaData | undefined;
  onOffsetChange: (offset: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ meta, onOffsetChange }) => {
  if (!meta) return null;

  const { total, limit, offset } = meta;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/30 pt-4 mt-6 gap-3">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{offset + 1}</span> to{' '}
        <span className="font-semibold text-foreground">
          {Math.min(offset + limit, total)}
        </span>{' '}
        of <span className="font-semibold text-foreground">{total}</span> notifications
      </div>
      
      <div className="flex gap-2 items-center">
        <button
          disabled={currentPage === 1}
          onClick={() => onOffsetChange((currentPage - 2) * limit)}
          className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all duration-300"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <span className="text-xs text-muted-foreground">
          Page <strong className="text-foreground">{currentPage}</strong> of {totalPages}
        </span>
        
        <button
          disabled={currentPage === totalPages}
          onClick={() => onOffsetChange(currentPage * limit)}
          className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-all duration-300"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
