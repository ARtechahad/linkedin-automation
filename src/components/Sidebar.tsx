import React from 'react';
import { 
  Kanban, 
  Inbox, 
  Send, 
  Mail,
  BookOpen, 
  BarChart3, 
  Coins, 
  MessageSquare, 
  FolderLock, 
  Globe, 
  ExternalLink,
  Plus,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Building2,
  User,
  ChevronRight,
  Database,
  Globe2,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    role,
    currentUser,
    unreadInboxCount,
    automatedTestsPassedCount,
    isDark,
    setIsDark,
    logout,
    setIsAuthModalOpen,
    setIsNewLeadModalOpen,
    openAIModal,
    setIsTestModalOpen,
    setIsDatabaseModalOpen,
    databaseStatus
  } = useApp();

  const roleLabels: Record<UserRole, { title: string; badgeClass: string }> = {
    admin: { title: 'Executive (Admin)', badgeClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30' },
    sales: { title: 'Sales Specialist', badgeClass: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
    coordinator: { title: 'Project Coordinator', badgeClass: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30' },
    developer: { title: 'Lead Developer', badgeClass: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30' },
    bd_head: { title: 'Head of BD', badgeClass: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30' },
    collaborator: { title: 'Evaluation Partner', badgeClass: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30' },
    client_guest: { title: 'Client Guest', badgeClass: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30' }
  };

  // Role-based navigation matrix
  const navItems = [
    { id: 'pipeline', label: 'Pipeline & Deals', icon: Kanban, roles: ['admin', 'bd_head', 'sales', 'coordinator', 'developer', 'collaborator'] },
    { id: 'gmail', label: 'Gmail Workspace', icon: Mail, roles: ['admin', 'bd_head', 'sales', 'coordinator', 'developer'] },
    { id: 'inbox', label: 'Unified Inbox', icon: Inbox, badge: unreadInboxCount, roles: ['admin', 'bd_head', 'sales', 'coordinator'] },
    { id: 'outreach', label: 'Outreach Engine', icon: Send, roles: ['admin', 'bd_head', 'sales'] },
    { id: 'sop', label: 'SOP 1–11 Rules', icon: BookOpen, badge: `${automatedTestsPassedCount}/17`, roles: ['admin', 'bd_head', 'coordinator', 'developer'] },
    { id: 'analytics', label: 'Analytics & Revenue', icon: BarChart3, roles: ['admin', 'bd_head'] },
    { id: 'free_apis', label: 'Live Free APIs', icon: Globe2, badge: 'Forex & DNS', roles: ['admin', 'bd_head', 'sales', 'coordinator', 'developer'] },
    { id: 'commissions', label: 'Commissions & Splits', icon: Coins, roles: ['admin', 'bd_head', 'sales'] },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare, roles: ['admin', 'bd_head', 'sales', 'coordinator', 'developer', 'collaborator'] },
    { id: 'vault', label: 'Secure File Vault', icon: FolderLock, roles: ['admin', 'bd_head', 'coordinator', 'developer'] },
    { id: 'integrations', label: 'Integrations & Hooks', icon: Globe, roles: ['admin', 'bd_head'] },
    { id: 'portal', label: 'Client Portal', icon: ExternalLink, roles: ['admin', 'bd_head', 'client_guest', 'collaborator'] }
  ];

  const currentRoleInfo = roleLabels[role] || roleLabels.admin;

  const handleNavClick = (id: string) => {
    setActiveTab(id as any);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Left Sidebar */}
      <aside 
        id="app-left-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white dark:bg-[#080c16] border-slate-200 dark:border-white/[0.08] shadow-2xl lg:shadow-none`}
      >
        {/* Top: Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => handleNavClick('pipeline')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-700 p-0.5 shadow-md shadow-indigo-600/25 flex items-center justify-center">
                <img src="/icon.svg" alt="AgencyOps" className="w-7 h-7 rounded-lg" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    AgencyOps
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                  Operations &amp; Client Suite
                </span>
              </div>
            </div>

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
          </div>

          {/* Active Persona / Role Badge Card */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name ? currentUser.name[0] : (role === 'client_guest' ? 'C' : 'A')}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  {currentUser ? currentUser.name : (role === 'client_guest' ? 'Client Guest' : 'Tariq Mehmood')}
                </span>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border font-mono ${currentRoleInfo.badgeClass}`}>
                  {currentRoleInfo.title}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition cursor-pointer shrink-0"
              title="Switch user role or log in"
            >
              Role
            </button>
          </div>
        </div>

        {/* Action Buttons on Left Side (strictly filtered by role) */}
        {['admin', 'bd_head', 'sales', 'coordinator'].includes(role) && (
          <div className="px-3 pt-3 pb-1 space-y-1.5">
            <button
              id="btn-sidebar-new-lead"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Lead</span>
            </button>

            {['admin', 'bd_head', 'sales'].includes(role) && (
              <button
                id="btn-sidebar-ai-pitch"
                onClick={() => openAIModal()}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>AI Proposal &amp; Pitch</span>
              </button>
            )}
          </div>
        )}

        {/* Center: Navigation Menu Items */}
        <nav className="px-3 py-2 flex-1 overflow-y-auto space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Navigation Menu
          </div>

          {navItems.map(item => {
            if (item.roles && !item.roles.includes(role)) return null;

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Theme Toggle, Telemetry, and Logout */}
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.08] space-y-2 bg-slate-50/50 dark:bg-[#070a12]/50">
          
          {/* Dark / Light Mode Toggle Switch */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
            </span>

            <button
              id="sidebar-theme-toggle-btn"
              onClick={() => setIsDark(!isDark)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-xs hover:bg-indigo-500 transition cursor-pointer"
            >
              Switch to {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* SOP Engine Status / Test Trigger */}
          <div className="flex items-center justify-between text-xs px-1">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SOP Tests 17/17</span>
            </button>

            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-mono"
            >
              <Database className="w-3.5 h-3.5 text-cyan-500" />
              <span>{databaseStatus?.engine === 'postgresql' ? 'PostgreSQL' : 'JSON DB'}</span>
            </button>
          </div>

          {/* Auth Action: Sign In or Sign Out */}
          <div className="pt-1">
            {currentUser ? (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Select Role</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
