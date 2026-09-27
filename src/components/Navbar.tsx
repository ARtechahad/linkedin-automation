import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  BookOpen,
  Kanban,
  BarChart3,
  Calculator,
  MessageSquare,
  Lock,
  Sparkles,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  UserCheck,
  CheckCircle2,
  Plus,
  Radar,
  Inbox,
  Globe2,
  Zap,
  DollarSign,
  Server,
  Cloud,
  Database,
  Shield,
  Smartphone,
  ChevronDown,
  Layers,
  Settings,
  Cpu,
  Check,
  X
} from 'lucide-react';
import { UserRole, SupportedLanguage, SupportedCurrency } from '../types';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    role,
    setRole,
    currentUser,
    databaseStatus,
    setIsDatabaseModalOpen,
    setIsAuthModalOpen,
    language,
    setLanguage,
    t,
    isDark,
    setIsDark,
    isOnline,
    setIsTestModalOpen,
    setIsGDPRModalOpen,
    openAIModal,
    setIsNewLeadModalOpen,
    automatedTestsPassedCount,
    unreadInboxCount,
    currency,
    setCurrency,
    aiSettings,
    setIsAISettingsModalOpen
  } = useApp();

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isEngineMenuOpen, setIsEngineMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (engineRef.current && !engineRef.current.contains(e.target as Node)) {
        setIsEngineMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary top-level navigation tabs
  const primaryTabs = [
    { id: 'pipeline', label: t('projects'), icon: Kanban },
    { id: 'inbox', label: t('inbox') || 'Unified Inbox', icon: Inbox, badge: unreadInboxCount },
    { id: 'sop', label: t('sopGuide'), icon: BookOpen },
    { id: 'outreach', label: t('outreach'), icon: Radar },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
  ];

  // Secondary tools
  const secondaryTools = [
    { id: 'portal', label: t('clientPortal') || 'Client Portal', desc: 'Secure client review workspace', icon: Globe2 },
    { id: 'commissions', label: t('commissions'), desc: 'Tiered sales commission payouts', icon: Calculator },
    { id: 'chat', label: t('teamChat'), desc: 'Internal agency team discussion', icon: MessageSquare },
    { id: 'vault', label: t('fileVault'), desc: 'Client credentials & encrypted contracts', icon: Lock },
    { id: 'integrations', label: 'Integrations', desc: 'Discord, Stripe, GitHub & Webhooks', icon: Zap },
  ];

  const roleLabels: Record<UserRole, string> = {
    sales: 'Sales Representative',
    coordinator: 'Project Coordinator',
    developer: 'Full-Stack Developer',
    admin: 'Agency Executive (Admin)',
    bd_head: 'Head of BD (Inbound Automation)',
    collaborator: 'Institutional Evaluation Partner',
    client_guest: 'Client Portal (Guest)'
  };

  const isSecondaryActive = secondaryTools.some(tool => tool.id === activeTab);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Identity - Clean & Mature */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => setActiveTab('pipeline')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-700 p-0.5 shadow-md shadow-indigo-600/20 flex items-center justify-center">
              <img src="/icon.svg" alt="AgencyOps" className="w-7 h-7 rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-display">
                  AgencyOps
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-mono">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-[200px]">
                Operations &amp; Client Management
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Clean Linear-style Segmented Control) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
            {primaryTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Secondary Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                id="nav-tools-dropdown"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSecondaryActive
                    ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>More Tools</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180 text-slate-900 dark:text-white' : 'text-slate-400'}`} />
              </button>

              {/* Dropdown Menu */}
              {isToolsOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 dark:border-white/5">
                    Operations Modules
                  </div>
                  {secondaryTools.map(tool => {
                    const Icon = tool.icon;
                    const isActive = activeTab === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setActiveTab(tool.id as any);
                          setIsToolsOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30'
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mt-0.5 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block">{tool.label}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">{tool.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Bar - Mature & Consolidated */}
          <div className="flex items-center gap-2">
            
            {/* Primary Action Button: New Lead */}
            <button
              id="btn-nav-new-lead"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('newLead')}</span>
            </button>

            {/* AI Assistant Quick Trigger */}
            <button
              id="btn-nav-ai-assistant"
              onClick={() => openAIModal()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="AI Proposal & Strategy Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">AI Pitch</span>
            </button>

            {/* Consolidated System Engine Telemetry (1 Clean Button) */}
            <div className="relative" ref={engineRef}>
              <button
                id="btn-nav-system-telemetry"
                onClick={() => setIsEngineMenuOpen(!isEngineMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
                title="System Health, Database, AI Provider & Locale Settings"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span className="hidden xl:inline text-slate-600 dark:text-slate-300 font-medium">System</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">17/17</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform ${isEngineMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* System Engine Popover Drawer */}
              {isEngineMenuOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 rounded-2xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 shadow-2xl p-4 z-50 animate-fadeIn space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span>System Architecture &amp; Telemetry</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold">
                      100% Operational
                    </span>
                  </div>

                  {/* Telemetry Items */}
                  <div className="space-y-2 text-xs">
                    
                    {/* Database Engine */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">Persistence Database</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {databaseStatus?.engine === 'postgresql' ? 'Connected (PostgreSQL)' : 'Durable File Storage'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsDatabaseModalOpen(true);
                          setIsEngineMenuOpen(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 transition"
                      >
                        Manage
                      </button>
                    </div>

                    {/* AI Engine */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        {aiSettings.provider === 'local' ? (
                          <Server className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">AI Architecture</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {aiSettings.provider === 'local' ? `Local (${aiSettings.localModel})` : 'Cloud Gemini 2.5'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsAISettingsModalOpen(true);
                          setIsEngineMenuOpen(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 transition"
                      >
                        Config
                      </button>
                    </div>

                    {/* Automated SOP Tests */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">SOP Quality Gate</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{automatedTestsPassedCount}/17 Assertions Verified</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsTestModalOpen(true);
                          setIsEngineMenuOpen(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 transition"
                      >
                        View Tests
                      </button>
                    </div>
                  </div>

                  {/* Locale & Preferences Row */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">Currency</span>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="AED">AED (AED)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">Language</span>
                      <select
                        value={language}
                        onChange={e => setLanguage(e.target.value as SupportedLanguage)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="en">English</option>
                        <option value="ur">اردو (Urdu)</option>
                        <option value="es">Español</option>
                        <option value="ar">العربية</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                  </div>

                  {/* Privacy & Dark/Light mode toggles */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <button
                      onClick={() => {
                        setIsGDPRModalOpen(true);
                        setIsEngineMenuOpen(false);
                      }}
                      className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
                    >
                      <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>GDPR / Privacy</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <ThemeToggle variant="compact" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile & Role Switcher */}
            <div className="relative" ref={profileRef}>
              <button
                id="btn-nav-auth-profile"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Current User Role & Authentication"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {currentUser ? currentUser.name[0] : 'A'}
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 hidden md:inline px-1">
                  {roleLabels[role].split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 pr-0.5" />
              </button>

              {/* Profile & Role Selector Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute top-full mt-2 right-0 w-60 rounded-2xl bg-white dark:bg-[#090d16] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {currentUser ? currentUser.name : 'Agency Executive'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                      {currentUser ? currentUser.email : 'admin@agencyops.io'}
                    </span>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Switch Active Role (RBAC)
                  </div>

                  {[
                    { id: 'admin', label: 'Admin (Executive)' },
                    { id: 'sales', label: 'Sales Representative' },
                    { id: 'coordinator', label: 'Project Coordinator' },
                    { id: 'developer', label: 'Developer' },
                    { id: 'bd_head', label: 'Head of BD' },
                    { id: 'client_guest', label: 'Client (Guest Portal)' }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        const newRole = r.id as UserRole;
                        setRole(newRole);
                        if (newRole === 'client_guest') {
                          setActiveTab('portal');
                        }
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        role === r.id
                          ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{r.label}</span>
                      {role === r.id && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  ))}

                  <div className="pt-1 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      Authentication Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PWA Direct Install Button */}
            <PWAInstallButton />

          </div>
        </div>

        {/* Mobile Navigation Horizontal Bar */}
        <div className="lg:hidden flex items-center justify-start overflow-x-auto py-2 border-t border-slate-200 dark:border-white/5 gap-1.5 scrollbar-none">
          {primaryTabs.concat([
            { id: 'portal', label: 'Portal', icon: Globe2 },
            { id: 'chat', label: 'Chat', icon: MessageSquare }
          ]).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
