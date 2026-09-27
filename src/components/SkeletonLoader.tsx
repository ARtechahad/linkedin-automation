import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-slate-800/80 rounded-md animate-shimmer ${className}`} />
);

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl glass-card animate-shimmer space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="h-4 w-28 bg-slate-800/90 rounded-md" />
      <div className="h-4 w-12 bg-slate-800/70 rounded-full" />
    </div>
    <div className="h-3 w-4/5 bg-slate-800/70 rounded-md" />
    <div className="h-3 w-2/3 bg-slate-800/50 rounded-md" />
    <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
      <div className="h-5 w-16 bg-slate-800/70 rounded-md" />
      <div className="w-6 h-6 rounded-full bg-slate-800/80" />
    </div>
  </div>
);

export const SkeletonKanban: React.FC<{ columnsCount?: number; cardsPerCol?: number }> = ({
  columnsCount = 5,
  cardsPerCol = 3
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start w-full">
      {Array.from({ length: columnsCount }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="glass-card rounded-2xl p-3 space-y-3 min-h-[480px] border border-white/5"
        >
          {/* Column Header Skeleton */}
          <div className="pb-2.5 border-b border-white/5 flex items-center justify-between animate-shimmer">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="h-4 w-24 bg-slate-800/90 rounded-md" />
              <div className="h-2.5 w-32 bg-slate-800/60 rounded-md" />
            </div>
            <div className="w-5 h-5 rounded-full bg-slate-800/80" />
          </div>

          {/* Cards Skeleton List */}
          <div className="space-y-3">
            {Array.from({ length: cardsPerCol }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="rounded-xl p-3.5 bg-slate-900/90 border border-white/5 space-y-3 animate-shimmer shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-slate-800 rounded-md" />
                  <div className="h-4 w-14 bg-indigo-950/80 border border-indigo-500/20 rounded-full" />
                </div>
                <div className="h-3 w-40 bg-slate-800/70 rounded-md" />
                
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="h-4 w-16 bg-slate-800/50 rounded-full" />
                  <div className="h-4 w-20 bg-slate-800/50 rounded-full" />
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="h-5 w-20 bg-emerald-950/50 border border-emerald-500/20 rounded-md" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-800" />
                    <div className="w-6 h-6 rounded-md bg-slate-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable: React.FC<{ rowsCount?: number; colsCount?: number }> = ({
  rowsCount = 6,
  colsCount = 6
}) => {
  return (
    <div className="w-full glass-card rounded-2xl overflow-hidden border border-white/5">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-slate-900/60 flex items-center justify-between animate-shimmer">
        <div className="flex items-center gap-4 w-full">
          {Array.from({ length: colsCount }).map((_, i) => (
            <div
              key={i}
              className={`h-3.5 bg-slate-800/80 rounded-md ${
                i === 0 ? 'w-36' : i === 1 ? 'w-24' : 'w-20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-white/5">
        {Array.from({ length: rowsCount }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="px-6 py-4 flex items-center justify-between gap-4 animate-shimmer bg-slate-950/30 hover:bg-slate-900/30 transition"
          >
            <div className="flex items-center gap-3 w-48 shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-800/90 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 w-28 bg-slate-800/90 rounded-md" />
                <div className="h-2.5 w-20 bg-slate-800/60 rounded-md" />
              </div>
            </div>

            <div className="h-3 w-24 bg-slate-800/70 rounded-md shrink-0" />
            <div className="h-4 w-20 bg-slate-800/60 rounded-full shrink-0" />
            <div className="h-4 w-16 bg-slate-800/80 rounded-md shrink-0" />
            <div className="h-4 w-28 bg-slate-800/60 rounded-full shrink-0" />

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="w-7 h-7 rounded-lg bg-slate-800/80" />
              <div className="w-7 h-7 rounded-lg bg-slate-800/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChat: React.FC<{ messagesCount?: number }> = ({ messagesCount = 4 }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: messagesCount }).map((_, idx) => {
        const isCurrentUser = idx % 2 !== 0;
        return (
          <div key={idx} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 w-20 bg-slate-800/80 rounded-md" />
              <div className="h-2.5 w-12 bg-slate-800/60 rounded-md" />
            </div>
            <div className={`p-3 rounded-2xl animate-shimmer space-y-2 ${
              isCurrentUser ? 'bg-indigo-900/40 rounded-br-none border border-indigo-500/20 w-64' : 'glass-card rounded-bl-none border border-white/5 w-72'
            }`}>
              <div className="h-3 w-full bg-slate-800/80 rounded-md" />
              <div className="h-3 w-4/5 bg-slate-800/60 rounded-md" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SkeletonInbox: React.FC<{ itemsCount?: number }> = ({ itemsCount = 5 }) => {
  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: itemsCount }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl glass-card border border-white/5 animate-shimmer space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800/90" />
              <div className="h-3.5 w-28 bg-slate-800/90 rounded-md" />
            </div>
            <div className="h-3 w-16 bg-slate-800/60 rounded-md" />
          </div>
          <div className="h-3 w-3/4 bg-slate-800/80 rounded-md" />
          <div className="h-2.5 w-full bg-slate-800/50 rounded-md" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-3.5 w-16 bg-indigo-950/60 rounded-full border border-indigo-500/20" />
            <div className="h-3.5 w-20 bg-emerald-950/60 rounded-full border border-emerald-500/20" />
          </div>
        </div>
      ))}
    </div>
  );
};
