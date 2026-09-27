import React from 'react';
import { AlertTriangle, Send, Trash2, ShieldAlert, X } from 'lucide-react';

export interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  type: 'send_email' | 'trash_email' | 'delete_email' | 'modify_label';
  title: string;
  description: string;
  details?: Array<{ label: string; value: string }>;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  type,
  title,
  description,
  details = [],
  confirmText,
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const defaultConfirmText = isDestructive
    ? (type === 'delete_email' ? 'Permanently Delete' : 'Move to Trash')
    : 'Confirm & Send Email';

  const actionText = confirmText || defaultConfirmText;

  const getIcon = () => {
    switch (type) {
      case 'send_email':
        return <Send className="w-5 h-5 text-indigo-500" />;
      case 'trash_email':
        return <Trash2 className="w-5 h-5 text-amber-500" />;
      case 'delete_email':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getBadgeStyle = () => {
    if (type === 'delete_email') {
      return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    }
    if (type === 'trash_email') {
      return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    }
    return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
  };

  const getConfirmBtnStyle = () => {
    if (type === 'delete_email') {
      return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20';
    }
    if (type === 'trash_email') {
      return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20';
    }
    return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${getBadgeStyle()}`}>
              {getIcon()}
            </div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider mb-0.5 border ${getBadgeStyle()}`}>
                Workspace User Authorization
              </span>
              <h3 className="text-base font-bold leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          {details.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2">
              {details.map((d, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {d.label}:
                  </span>
                  <span className="font-mono text-right text-slate-800 dark:text-slate-200 break-all">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>Authorized under Google Workspace Gmail API (Permission granted by user)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${getConfirmBtnStyle()}`}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                {type === 'send_email' && <Send className="w-3.5 h-3.5" />}
                {type === 'trash_email' && <Trash2 className="w-3.5 h-3.5" />}
                {type === 'delete_email' && <ShieldAlert className="w-3.5 h-3.5" />}
                <span>{actionText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
