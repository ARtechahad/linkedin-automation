import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface RoleRouteGuardProps {
  allowedRoles: UserRole[];
  moduleName: string;
  children: React.ReactNode;
}

export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({
  allowedRoles,
  moduleName,
  children
}) => {
  const { role, setActiveTab } = useApp();

  const isAllowed = role === 'admin' || role === 'bd_head' || allowedRoles.includes(role);

  if (!isAllowed) {
    const fallbackTab = role === 'client_guest' ? 'portal' : 'pipeline';

    return (
      <div className="p-6 sm:p-10 max-w-2xl mx-auto my-12 animate-fadeIn">
        <div className="p-6 sm:p-8 rounded-2xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 text-center shadow-lg shadow-rose-950/5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto mb-4 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-mono font-bold mb-2">
            <Lock className="w-3 h-3" />
            <span>RBAC ACCESS DENIED (403)</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Restricted Module: {moduleName}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
            Your current role (<strong className="font-mono uppercase text-slate-800 dark:text-slate-200">{role}</strong>) does not have authorization to inspect or execute actions within the <em>{moduleName}</em> workspace.
          </p>

          <button
            onClick={() => setActiveTab(fallbackTab)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Authorized Workspace ({fallbackTab.toUpperCase()})</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
