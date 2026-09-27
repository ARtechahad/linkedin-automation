import React from 'react';
import { LucideIcon, Plus, RefreshCw, FilterX, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'pipeline' | 'inbox' | 'logs' | 'search' | 'generic';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'generic'
}) => {
  return (
    <div className="w-full p-8 sm:p-12 text-center rounded-2xl glass-card border border-white/10 flex flex-col items-center justify-center space-y-4 my-4 animate-fadeIn">
      {/* Minimalist Graphic / Vector Icon Container */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-blue-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
          {Icon ? (
            <Icon className="w-8 h-8 stroke-[1.5]" />
          ) : (
            <svg
              className="w-8 h-8 stroke-[1.5] text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M9 9h6v6H9z" />
              <path d="m9 3 6 18" opacity="0.3" />
            </svg>
          )}
        </div>
        {/* Subtle decorative dot */}
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500/80 ring-4 ring-[#0b101c]" />
      </div>

      {/* Text Copy */}
      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-bold tracking-tight text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action Buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5 text-slate-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
