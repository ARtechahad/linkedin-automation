import React from 'react';
import { 
  Menu, 
  Search, 
  CheckCircle2, 
  Database, 
  ShieldCheck, 
  Coins, 
  User,
  Sparkles,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportedCurrency, UserRole } from '../types';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const {
    activeTab,
    role,
    currentUser,
    firebaseUser,
    setIsAuthModalOpen,
    currency,
    setCurrency,
    automatedTestsPassedCount,
    databaseStatus,
    isDark,
    setIsDark,
    showToast
  } = useApp();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    pipeline: { title: 'Pipeline & Lead Deals', subtitle: 'Step 1–5: Discovery, Pricing, 50% Advance & Staging' },
    inbox: { title: 'Unified Omni-Inbox', subtitle: 'Centralized client conversations across LinkedIn, Upwork & Email' },
    outreach: { title: 'AI Cold Outreach Engine', subtitle: 'Lead scraper, automated follow-ups & connection templates' },
    sop: { title: 'International Client SOP Rules', subtitle: '11-Step Quality Gate, Commission Rules & Milestone Protections' },
    analytics: { title: 'Executive Operations Analytics', subtitle: 'Revenue forecasts, conversion funnels & SLA monitoring' },
    free_apis: { title: 'Global Agency Live Free APIs', subtitle: 'Live Currency Forex, Cloudflare DNS-over-HTTPS & Client Geo Radar' },
    commissions: { title: 'Commission Calculator & Splits', subtitle: 'SOP Section 6 tiered payout matrix & audit logs' },
    chat: { title: 'Team Collaboration Hub', subtitle: 'Internal channels for Sales, Devs & Operations' },
    vault: { title: 'Encrypted Credential Vault', subtitle: 'RBAC protected hosting, Git & domain credentials' },
    integrations: { title: 'Webhooks & External Connectors', subtitle: 'Live Stripe, PayPal IPN, Upwork & Discord channels' },
    portal: { title: 'Isolated Client Portal', subtitle: 'Live milestone reviews, invoice settlement & handover archive' }
  };

  const currentViewMeta = tabTitles[activeTab] || { title: 'Operations Dashboard', subtitle: 'Client Operations Suite' };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#070a12]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {currentViewMeta.title}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentViewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Context Badges */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Manual Theme Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          id="btn-header-theme-toggle"
          onClick={() => {
            const nextMode = !isDark;
            setIsDark(nextMode);
            showToast(`Switched to ${nextMode ? 'Dark' : 'Light'} Mode (manual override active)`, 'info');
          }}
          className="group relative flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          title={isDark ? "Current: Dark Mode (Click to switch to Light Mode)" : "Current: Light Mode (Click to switch to Dark Mode)"}
        >
          <div className="relative flex items-center justify-center w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110">
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400 drop-shadow-xs transition-transform duration-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 drop-shadow-xs transition-transform duration-300" />
            )}
          </div>

          <span className="hidden md:inline text-xs font-bold select-none text-slate-800 dark:text-slate-200">
            {isDark ? 'Dark' : 'Light'}
          </span>

          {/* Tactile track & thumb slider */}
          <div className="flex items-center w-7 h-3.5 sm:w-8 sm:h-4 bg-slate-300 dark:bg-slate-700/80 rounded-full p-0.5 transition-colors duration-300">
            <div
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white dark:bg-indigo-400 shadow-xs transform transition-transform duration-300 ${
                isDark ? 'translate-x-3.5 sm:translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Currency Quick Switcher */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 text-xs font-semibold">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as SupportedCurrency)}
            className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="AED">AED (AED)</option>
          </select>
        </div>

        {/* SOP Quality Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>SOP 17/17</span>
        </div>

        {/* Firebase / Google Auth Quick Badge */}
        {firebaseUser ? (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-600/25 transition cursor-pointer"
            title={`Firebase Verified: ${firebaseUser.email}`}
          >
            {firebaseUser.photoURL ? (
              <img src={firebaseUser.photoURL} alt="Google" className="w-4 h-4 rounded-full" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
            <span className="font-mono text-[11px] truncate max-w-[110px]">{firebaseUser.displayName || firebaseUser.email}</span>
            <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Firebase</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
            title="Sign in with Google Firebase"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="text-[11px]">Sign in with Google</span>
          </button>
        )}

        {/* Role Switcher Pill */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-600/25 transition cursor-pointer"
          title="Click to switch persona role"
        >
          <User className="w-3.5 h-3.5 text-indigo-500" />
          <span className="capitalize">{role.replace('_', ' ')}</span>
          <ChevronDown className="w-3 h-3 text-indigo-400" />
        </button>
      </div>
    </header>
  );
};
