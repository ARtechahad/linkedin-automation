import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Cloud, CloudOff } from 'lucide-react';
import { SaveStatus } from '../hooks/useDebouncedSave';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | null;
  errorMessage?: string | null;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md';
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSavedAt,
  errorMessage,
  className = '',
  showText = true,
  size = 'sm'
}) => {
  if (status === 'idle' && !lastSavedAt) {
    return null;
  }

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold transition-all duration-300 ${className} ${
        status === 'syncing'
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
          : status === 'saved'
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          : status === 'error'
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
      }`}
      title={
        status === 'syncing'
          ? 'Auto-saving changes to database...'
          : status === 'saved'
          ? `All changes saved${lastSavedAt ? ` at ${formatTime(lastSavedAt)}` : ''}`
          : status === 'error'
          ? `Save failed: ${errorMessage || 'Unknown error'}`
          : 'Ready'
      }
    >
      {status === 'syncing' && (
        <>
          <RefreshCw className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin text-amber-500 shrink-0`} />
          {showText && <span>Syncing...</span>}
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckCircle2 className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-500 shrink-0`} />
          {showText && (
            <span>
              Saved {lastSavedAt ? `@ ${formatTime(lastSavedAt)}` : ''}
            </span>
          )}
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-500 shrink-0`} />
          {showText && <span>Sync Failed</span>}
        </>
      )}

      {status === 'idle' && lastSavedAt && (
        <>
          <Cloud className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400 shrink-0`} />
          {showText && <span>Saved {formatTime(lastSavedAt)}</span>}
        </>
      )}
    </div>
  );
};
