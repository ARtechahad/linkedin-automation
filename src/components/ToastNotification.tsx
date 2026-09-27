import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        return (
          <SingleToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        );
      })}
    </div>
  );
};

const SingleToastItem: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4000;
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const typeConfig: Record<
    ToastType,
    {
      icon: typeof CheckCircle2;
      iconColor: string;
      borderColor: string;
      glowColor: string;
      progressColor: string;
      badgeText: string;
    }
  > = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-[0_8px_30px_rgb(16,185,129,0.18)]',
      progressColor: 'bg-emerald-500',
      badgeText: 'Success'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      glowColor: 'shadow-[0_8px_30px_rgb(244,63,94,0.2)]',
      progressColor: 'bg-rose-500',
      badgeText: 'Error'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-[0_8px_30px_rgb(245,158,11,0.18)]',
      progressColor: 'bg-amber-500',
      badgeText: 'Warning'
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      glowColor: 'shadow-[0_8px_30px_rgb(99,102,241,0.2)]',
      progressColor: 'bg-indigo-500',
      badgeText: 'Info'
    }
  };

  const config = typeConfig[toast.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden rounded-xl glass-modal border ${config.borderColor} ${config.glowColor} p-3.5 text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-start gap-3 animate-slideInRight`}
      style={{
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Icon with subtle halo */}
      <div className="shrink-0 p-1.5 rounded-lg bg-white/5 mt-0.5">
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>

      {/* Message & Badge */}
      <div className="flex-1 pr-2 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {config.badgeText}
          </span>
        </div>
        <p className="text-xs font-medium text-slate-200 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className={`h-full ${config.progressColor} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
