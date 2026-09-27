import React, { useState } from 'react';
import { Shield, User, Lock, Key, CheckCircle, ArrowRight, LogOut, Check, Sparkles, AlertCircle, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    currentUser, 
    firebaseUser,
    isFirebaseConnected,
    loginWithGoogle,
    login, 
    logout, 
    switchPersona, 
    showToast, 
    role 
  } = useApp();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setError(res.message || 'Google Sign-In failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickSwitch = async (targetRole: UserRole) => {
    setLoading(true);
    await switchPersona(targetRole);
    setLoading(false);
    setIsAuthModalOpen(false);
    const targetPersona = personas.find(p => p.role === targetRole);
    showToast(`Active Persona switched to ${targetPersona?.name || targetRole} (${targetRole.toUpperCase()})`, 'info');
  };

  const personas = [
    {
      role: 'bd_head' as UserRole,
      name: 'Ali Hasnain',
      title: 'Head of Business Development',
      email: 'admin@agencyops.dev',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'API Token generation for external scrapers, inbound pipeline automation, and audit compliance.'
    },
    {
      role: 'collaborator' as UserRole,
      name: 'Marcus Vance',
      title: 'Institutional Evaluation Partner (Vance Capital)',
      email: 'partner@vance-capital.com',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      description: 'Isolated Partner Workspace: Exclusive visibility into assigned project deals for valuation sign-off.'
    },
    {
      role: 'admin' as UserRole,
      name: 'Tariq Mehmood',
      title: 'Executive Managing Director',
      email: 'admin@agencyops.dev',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'Universal governance, DB migration, Stripe credentials, and financial payout approvals.'
    },
    {
      role: 'sales' as UserRole,
      name: 'Sarah Jenkins',
      title: 'Senior BD Specialist',
      email: 'sales@agencyops.dev',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Discovery pipeline, AI cold outreach, lead scoring, and personal commission tracking.'
    },
    {
      role: 'developer' as UserRole,
      name: 'Zain Malik',
      title: 'Lead Full-Stack Architect',
      email: 'dev@agencyops.dev',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      description: 'Staging development, internal QA sign-off, Discord handoff, and server credential vault.'
    },
    {
      role: 'client_guest' as UserRole,
      name: 'Dr. Christopher Evans',
      title: 'Client Partner (Lumina Health)',
      email: 'client@lumina-health.co.uk',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Isolated Client Portal: Live staging preview, milestone sign-offs, and invoice settlements.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="auth-rbac-modal-card"
        className="glass-modal border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/10 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  RBAC Authentication &amp; Roles
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  JWT HMAC-SHA256
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise role-based security isolating internal staff, sales commissions, and guest client portals
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm scrollbar-thin">
          {/* Active User Card */}
          {currentUser && (
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-11 h-11 rounded-xl border-2 border-indigo-500/40 object-cover shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentUser.role}
                    </span>
                    {firebaseUser && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Google Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">{currentUser.email} • {currentUser.title}</span>
                </div>
              </div>
              <button
                id="btn-modal-sign-out"
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Google Sign-In & Firebase Auth */}
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    Google Authentication (Firebase Auth)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Secure identity verification with Google &amp; real-time Cloud Firestore persistence
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Firestore Active
              </span>
            </div>

            {firebaseUser ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  {firebaseUser.photoURL ? (
                    <img src={firebaseUser.photoURL} alt="Google" className="w-8 h-8 rounded-full border border-emerald-500/40" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center font-bold text-xs text-emerald-300">
                      {firebaseUser.email?.[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-emerald-200">
                      {firebaseUser.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-emerald-300/70 font-mono">
                      {firebaseUser.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">
                    Google Linked
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleSignInButton
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  text={googleLoading ? 'Connecting to Google Firebase & Gmail...' : 'Sign in with Google (Firebase & Gmail API)'}
                  className="w-full justify-center"
                />
              </div>
            )}
          </div>

          {/* Quick Persona Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                1-Click Switch Agency Role (RBAC Simulation)
              </h3>
              <span className="text-[11px] text-slate-400">Instantly switch permissions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personas.map((p) => {
                const isSelected = role === p.role;
                return (
                  <button
                    key={p.role}
                    id={`btn-switch-role-${p.role}`}
                    onClick={() => handleQuickSwitch(p.role)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/15 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500' 
                        : 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {p.name}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${p.badgeColor}`}>
                        {p.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Sign-In Form */}
          <div className="pt-3 border-t border-white/10">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Sign In with Custom Credentials
            </h3>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                  <input
                    id="input-auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agencyops.dev"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950/60 border border-white/10 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Password</label>
                  <input
                    id="input-auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-slate-950/60 border border-white/10 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  id="btn-auth-submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{loading ? 'Authenticating...' : 'Sign In with JWT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Strict SOP Rule 8 Website Transfer Isolation</span>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
