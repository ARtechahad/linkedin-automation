import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Key, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Building2,
  Users,
  Briefcase,
  Code2,
  FileCheck2,
  UserCheck,
  CheckCircle2,
  Sun,
  Moon,
  Zap,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface RoleLoginViewProps {
  onSuccess?: () => void;
}

export const RoleLoginView: React.FC<RoleLoginViewProps> = ({ onSuccess }) => {
  const { login, loginWithGoogle, isDark, setIsDark, showToast } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [passwordOrPin, setPasswordOrPin] = useState<string>('1234');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message || 'Google Sign-In failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const personas: Array<{
    role: UserRole;
    name: string;
    title: string;
    email: string;
    pass: string;
    pin: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeStyle: string;
    scopeSummary: string;
    accessHighlights: string[];
  }> = [
    {
      role: 'admin',
      name: 'Tariq Mehmood',
      title: 'Agency Director & BD Head',
      email: 'admin@agencyops.dev',
      pass: 'Admin@12345',
      pin: '1234',
      icon: Building2,
      accentColor: 'indigo',
      badgeStyle: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
      scopeSummary: 'Unrestricted executive oversight across all revenue pipelines, financial commissions, database management, and SOP test gates.',
      accessHighlights: ['All 11 Modules', 'Financial Audits', 'Cloud SQL Sync']
    },
    {
      role: 'sales',
      name: 'Hamza Farooq',
      title: 'Senior Business Development Specialist',
      email: 'sales@agencyops.dev',
      pass: 'Sales@12345',
      pin: '1234',
      icon: Briefcase,
      accentColor: 'emerald',
      badgeStyle: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      scopeSummary: 'Discovery, client pitch generation, active deal pipeline, cold outreach engine, and personal 35% commission ledger.',
      accessHighlights: ['Pipeline Deals', 'Outreach Engine', 'Live Forex & DNS']
    },
    {
      role: 'coordinator',
      name: 'Fatima Noor',
      title: 'Senior Project Coordinator & QA Lead',
      email: 'coordinator@agencyops.dev',
      pass: 'Coord@12345',
      pin: '1234',
      icon: Users,
      accentColor: 'blue',
      badgeStyle: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
      scopeSummary: 'SOP 1–11 enforcement, client briefing handovers, Discord team notifications, staging verification, and scope validation.',
      accessHighlights: ['SOP Gatekeeper', 'Delivery Pipeline', 'Team Chat']
    },
    {
      role: 'developer',
      name: 'Zain Ul Abideen',
      title: 'Lead Full-Stack Systems Engineer',
      email: 'dev@agencyops.dev',
      pass: 'Dev@12345',
      pin: '1234',
      icon: Code2,
      accentColor: 'indigo',
      badgeStyle: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      scopeSummary: 'Staging environment deployment, technical architecture, automated QA testing, and secure credential vault management.',
      accessHighlights: ['Staging & QA', 'Server File Vault', 'SOP 17/17 Tests']
    },
    {
      role: 'client_guest',
      name: 'Alexander Vance',
      title: 'Client Stakeholder (Lumina Health UK)',
      email: 'client@lumina-health.co.uk',
      pass: 'Client@12345',
      pin: '1234',
      icon: UserCheck,
      accentColor: 'amber',
      badgeStyle: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
      scopeSummary: 'Secure isolated Client Portal: review active staging preview, inspect 50% deposit milestones, and download final delivery assets.',
      accessHighlights: ['Client Portal Only', 'Staging Review', 'Milestone Invoices']
    },
    {
      role: 'collaborator',
      name: 'Marcus Vance',
      title: 'Partner & Deal Evaluator',
      email: 'partner@vance-capital.com',
      pass: 'Partner@12345',
      pin: '1234',
      icon: FileCheck2,
      accentColor: 'cyan',
      badgeStyle: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
      scopeSummary: 'Institutional valuation partner workspace: confidential deal appraisal, scope sign-offs, with internal rates securely masked.',
      accessHighlights: ['Partner Pipeline', 'Deal Evaluation', 'NDA Workspace']
    }
  ];

  const activePersona = personas.find(p => p.role === selectedRole) || personas[0];

  const handleRoleSelect = (p: typeof personas[0]) => {
    setSelectedRole(p.role);
    setPasswordOrPin('1234');
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordOrPin) {
      setErrorMessage('Please enter a password or PIN (default PIN: 1234).');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const res = await login(activePersona.email, passwordOrPin);
    setLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please verify your PIN or password.');
    }
  };

  const handleQuickSignIn = async (p: typeof personas[0]) => {
    setSelectedRole(p.role);
    setLoading(true);
    setErrorMessage(null);
    const res = await login(p.email, p.pin || p.pass);
    setLoading(false);
    if (res.success) {
      showToast(`Welcome ${p.name}! Session established as ${p.title}.`, 'info');
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.message || 'Quick login failed.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-fadeIn">
      
      {/* Top Bar: Brand & Theme Toggle */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                AgencyOps ALM
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 font-mono">
                RBAC Gatekeeper
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              International Client Handling &amp; Project Operations Suite
            </p>
          </div>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsDark(!isDark)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-900/5">
        
        {/* Header Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-3 border border-slate-200 dark:border-white/10">
            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Secure Authentication Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Select Your Role to Access Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Each role provides strict, isolated view permissions and operational controls tailored to standard agency protocols.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {personas.map(p => {
            const Icon = p.icon;
            const isSelected = selectedRole === p.role;

            return (
              <div
                key={p.role}
                onClick={() => handleRoleSelect(p)}
                className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-sm'
                }`}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Selected</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-slate-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${p.badgeStyle}`}>
                        {p.role.toUpperCase()}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {p.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                    {p.title}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                    {p.scopeSummary}
                  </p>

                  {/* Highlights Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.accessHighlights.map((hl, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    PIN: <strong className="text-slate-700 dark:text-slate-200">1234</strong>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickSignIn(p);
                    }}
                    disabled={loading}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Instant Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Role Verification & Password/PIN Gate */}
        <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authenticate as <span className="text-indigo-600 dark:text-indigo-400">{activePersona.name}</span>
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {activePersona.email}
            </span>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password or 4-Digit Security PIN
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default Quick PIN: <strong className="font-mono text-indigo-600 dark:text-indigo-400">1234</strong>
                </span>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordOrPin}
                  onChange={e => setPasswordOrPin(e.target.value)}
                  placeholder="Enter 1234 or role password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPasswordOrPin('1234')}
                className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition cursor-pointer"
              >
                Auto-fill PIN (1234)
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <span>Verifying Session...</span>
                ) : (
                  <>
                    <span>Unlock {activePersona.role.toUpperCase()} Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Google Workspace & Gmail Authentication */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-col items-center justify-center gap-2.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Or Sign in with Google Workspace &amp; Gmail
              </span>
              <GoogleSignInButton
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                text={googleLoading ? 'Authorizing Workspace...' : 'Sign in with Google'}
              />
            </div>
          </div>

          {/* SOP Compliance Assurance */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SOP 1–11 Protocol Active
            </span>
            <span>Session Persistent across Refresh</span>
          </div>
        </div>

      </div>
    </div>
  );
};
