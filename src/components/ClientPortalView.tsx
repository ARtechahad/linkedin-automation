import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectLead, ClientFeedbackItem } from '../types';
import { SkeletonCard } from './SkeletonLoader';
import {
  Globe2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Laptop,
  Tablet,
  Smartphone,
  Send,
  MessageSquare,
  DollarSign,
  Copy,
  Lock,
  Sparkles,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const { projects, activePortalProjectId, setActivePortalProjectId, showToast } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activePortalProjectId || (projects && projects.length > 0 ? projects[0].id : '')
  );
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Client feedback form state
  const [feedbackAuthor, setFeedbackAuthor] = useState<string>('');
  const [feedbackContent, setFeedbackContent] = useState<string>('');
  const [feedbackCategory, setFeedbackCategory] = useState<'design' | 'bug' | 'content' | 'general'>('design');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  // Sync when activePortalProjectId changes or projects load
  useEffect(() => {
    if (activePortalProjectId) {
      setSelectedProjectId(activePortalProjectId);
    } else if (!selectedProjectId && projects && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activePortalProjectId, projects, selectedProjectId]);

  const loadPortalData = async (projId: string) => {
    if (!projId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/project/${projId}`);
      const data = await res.json();
      if (data.success && data.project) {
        setProjectData(data.project);
        setFeedbackAuthor(data.project.clientName || '');
      }
    } catch (err) {
      console.error('Error fetching portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadPortalData(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCopyGuestLink = () => {
    if (!projectData) return;
    const url = `${window.location.origin}/?portal=${projectData.id}&token=${projectData.portalToken || 'guest'}`;
    navigator.clipboard.writeText(url);
    showToast('Secure Guest Access Link copied to clipboard.');
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim() || !projectData) return;

    try {
      setIsSubmittingFeedback(true);
      const res = await fetch(`/api/portal/feedback/${projectData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: feedbackAuthor || projectData.clientName,
          content: feedbackContent,
          category: feedbackCategory
        })
      });
      const data = await res.json();
      if (data.success && data.feedbackItem) {
        setProjectData((prev: any) => ({
          ...prev,
          feedback: [data.feedbackItem, ...(prev.feedback || [])]
        }));
        setFeedbackContent('');
        showToast('Feedback submitted to agency engineering & staging team.');
      }
    } catch (err) {
      console.error('Error submitting feedback', err);
      showToast('Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Milestone calculation
  const getMilestones = (p: any) => {
    return [
      {
        id: 'discovery',
        name: '1. Discovery & Scope',
        completed: true,
        desc: 'Requirements & site architecture confirmed'
      },
      {
        id: 'advance',
        name: '2. 50% Advance Milestone',
        completed: Boolean(p?.advancePaid),
        desc: p?.advancePaid ? `Paid $${p.advanceAmount} (Tx: ${p.advanceTxId || 'Verified'})` : 'Awaiting deposit to kick off sprint'
      },
      {
        id: 'staging',
        name: '3. Staging Development',
        completed: p?.status === 'staging' || p?.status === 'qa' || p?.status === 'client_review' || p?.status === 'advance_paid' || p?.domainTransferred,
        desc: 'Interactive builds deployed on private agency staging server'
      },
      {
        id: 'qa',
        name: '4. Internal QA & Validation',
        completed: Boolean(p?.internalQAPassed),
        desc: p?.internalQAPassed ? 'Cross-device responsiveness & speed audit passed' : 'In QA review cycle'
      },
      {
        id: 'approval',
        name: '5. Client Review & Approval',
        completed: Boolean(p?.clientApproved),
        desc: p?.clientApproved ? 'Approved by client on staging' : 'Pending final client staging walkthrough'
      },
      {
        id: 'balance',
        name: '6. 50% Final Balance Deposit',
        completed: Boolean(p?.balancePaid),
        desc: p?.balancePaid ? `Paid $${p.balanceAmount} (Tx: ${p.balanceTxId || 'Verified'})` : 'Required before domain migration'
      },
      {
        id: 'transfer',
        name: '7. Live Handover & Transfer',
        completed: Boolean(p?.domainTransferred),
        desc: p?.domainTransferred ? 'Deployed to production client domain' : 'Locked until balance is cleared'
      }
    ];
  };

  const milestones = projectData ? getMilestones(projectData) : [];
  const completedMilestonesCount = milestones.filter(m => m.completed).length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestonesCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Security Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xl border border-white/10 glass-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">Secure Client Project Portal (Guest View)</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Read-Only Guest Session</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            External live status dashboard for clients. Allows staging preview inspection, milestone progress tracking, invoice verification, and structured revision requests with zero exposure of internal employee rates.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyGuestLink}
            id="btn-copy-guest-portal-link"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Guest Link</span>
          </button>
        </div>
      </div>

      {/* Project Switcher Bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-card border border-white/10 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">
            Viewing Client Project:
          </span>
          <select
            id="select-portal-project"
            value={selectedProjectId}
            onChange={e => {
              setSelectedProjectId(e.target.value);
              setActivePortalProjectId(e.target.value);
            }}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 text-xs font-bold text-white focus:outline-hidden"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.clientCompany || p.clientName} ({p.websiteType.toUpperCase()} - ${p.finalPrice})
              </option>
            ))}
          </select>
        </div>

        {projectData && (
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Sprint Timeline: <strong className="text-slate-800 dark:text-slate-200">{projectData.timelineDays || 10} Days</strong></span>
            <span>•</span>
            <span>Target Delivery: <strong className="text-slate-800 dark:text-slate-200">{projectData.targetDeliveryDate || 'Upcoming'}</strong></span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-64" />
          </div>
        </div>
      ) : projectData ? (
        <div className="space-y-6">
          
          {/* Milestone Progress Bar */}
          <div className="p-5 rounded-2xl glass-card border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Sprint Milestone Progress ({completedMilestonesCount}/{milestones.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Standard 7-step agency workflow from Discovery to Live Production Handover.
                </p>
              </div>
              <span className="text-sm font-extrabold text-indigo-400">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-slate-900/60 border border-white/5 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Milestone Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border transition text-xs space-y-1 ${
                    m.completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                    {m.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Staging Interactive Environment Preview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Live Dedicated Staging Server Preview</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {projectData.internalQAPassed ? 'QA Verified' : 'In Active Sprint'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspected on isolated staging infrastructure prior to live DNS propagation.
                  </p>
                </div>
              </div>

              {/* Viewport switcher & external link */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewportMode('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                      viewportMode === 'desktop' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Desktop Preview (100% width)"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewportMode('tablet')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                      viewportMode === 'tablet' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Tablet Preview (768px width)"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewportMode('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                      viewportMode === 'mobile' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                    title="Mobile Preview (375px width)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <a
                  href={projectData.stagingUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Screen</span>
                </a>
              </div>
            </div>

            {/* Staging Preview Frame */}
            <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
              <div
                className={`transition-all duration-300 rounded-xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col ${
                  viewportMode === 'desktop'
                    ? 'w-full h-[420px]'
                    : viewportMode === 'tablet'
                    ? 'w-[768px] h-[460px]'
                    : 'w-[375px] h-[520px]'
                }`}
              >
                {/* Simulated browser top bar */}
                <div className="h-8 bg-slate-200 dark:bg-slate-800 px-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-4 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 truncate max-w-xs">
                    https://staging-{projectData.id}.agencyops.dev
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">SSL Secure</span>
                </div>

                {/* Staging visual mock interior */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/60">
                  <div className="max-w-md mx-auto text-center space-y-2 pt-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                      {projectData.websiteType?.toUpperCase() || 'CUSTOM'} BUILD PREVIEW
                    </span>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">
                      {projectData.clientCompany || projectData.clientName}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {projectData.purpose || 'High-converting custom web solution built to specifications.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Speed Audit</div>
                      <div className="text-lg font-extrabold text-emerald-600">98/100</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Mobile Ready</div>
                      <div className="text-lg font-extrabold text-blue-600">100%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">SSL Encryption</div>
                      <div className="text-lg font-extrabold text-indigo-600">Active</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* 2-Column: Financial Breakdown & Invoices (Left) & Client Feedback Engine (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Invoice & Financial Breakdown (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Milestone Invoices & Payment Verification
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Total Fee: ${projectData.finalPrice} USD
                </span>
              </div>

              {/* Milestone 1: 50% Advance */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Milestone 1: 50% Kick-Off Advance
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    ${projectData.advanceAmount || (projectData.finalPrice * 0.5).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Status: {projectData.advancePaid ? (
                      <strong className="text-emerald-600 dark:text-emerald-400">Cleared & Verified</strong>
                    ) : (
                      <strong className="text-amber-600 dark:text-amber-400">Pending Deposit</strong>
                    )}
                  </span>
                  {projectData.advanceTxId && (
                    <span className="font-mono text-slate-400">Tx: {projectData.advanceTxId}</span>
                  )}
                </div>
              </div>

              {/* Milestone 2: 50% Final Balance */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Milestone 2: 50% Live Handover Balance
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    ${projectData.balanceAmount || (projectData.finalPrice * 0.5).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    Status: {projectData.balancePaid ? (
                      <strong className="text-emerald-600 dark:text-emerald-400">Cleared & Handover Ready</strong>
                    ) : (
                      <strong className="text-amber-600 dark:text-amber-400">Due upon Staging Approval</strong>
                    )}
                  </span>
                  {projectData.balanceTxId && (
                    <span className="font-mono text-slate-400">Tx: {projectData.balanceTxId}</span>
                  )}
                </div>
              </div>

              {/* SOP Rule 8 Security Lock Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Agency Security Protocol:</strong> Live domain DNS migration is triggered immediately upon confirmation of the 50% final balance. Staging builds remain fully accessible for client testing.
                </p>
              </div>

            </div>

            {/* Right: Client Feedback & Revisions Form (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Submit Staging Feedback & Revisions
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {(projectData.feedback || []).length} Notes
                </span>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={feedbackAuthor}
                      onChange={e => setFeedbackAuthor(e.target.value)}
                      placeholder="e.g. Rachel Adams"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Feedback Type
                    </label>
                    <select
                      value={feedbackCategory}
                      onChange={e => setFeedbackCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="design">Design / Layout Styling</option>
                      <option value="bug">Responsive / Functional Bug</option>
                      <option value="content">Text / Image Update</option>
                      <option value="general">General Scope Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Staging Revision Notes
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={feedbackContent}
                    onChange={e => setFeedbackContent(e.target.value)}
                    placeholder="Specific feedback regarding elements you would like adjusted on the staging site..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingFeedback ? 'Posting...' : 'Submit to Development Team'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Feedback History */}
              {projectData.feedback && projectData.feedback.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto">
                  {projectData.feedback.map((item: ClientFeedbackItem) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.author} ({item.category.toUpperCase()})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        "{item.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
};
