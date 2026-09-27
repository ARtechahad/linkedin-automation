import React, { useState } from 'react';
import { ProjectLead } from '../types';
import {
  Calendar,
  CalendarRange,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ShieldCheck,
  Server,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Users,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ProjectTimelineFullViewProps {
  projects: ProjectLead[];
  onSelectProject?: (project: ProjectLead) => void;
  onOpenTimeTracker?: (project: ProjectLead) => void;
  onUpdateProject?: (id: string, updates: Partial<ProjectLead>) => Promise<boolean>;
  formatMoney: (amount: number) => string;
}

export const ProjectTimelineFullView: React.FC<ProjectTimelineFullViewProps> = ({
  projects,
  onSelectProject,
  onOpenTimeTracker,
  onUpdateProject,
  formatMoney
}) => {
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'urgent' | 'completed'>('all');

  const getTimelineDetails = (proj: ProjectLead) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = proj.startDate ? new Date(proj.startDate) : new Date(proj.createdAt);
    const targetDate = proj.targetDeliveryDate ? new Date(proj.targetDeliveryDate) : new Date(Date.now() + 86400000 * 14);

    const totalDays = Math.max(1, Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const isCompleted = proj.domainTransferred || proj.status === 'completed' || proj.status === 'transferred';
    const isOverdue = !isCompleted && daysRemaining < 0;
    const isUrgent = !isCompleted && daysRemaining >= 0 && daysRemaining <= 3;

    let progressPercent = isCompleted ? 100 : Math.min(100, Math.max(5, Math.round((daysElapsed / totalDays) * 100)));

    const half = Number(((proj.finalPrice || proj.estimatedPrice || 0) * 0.5).toFixed(2));

    const steps = [
      {
        id: 'step-1',
        title: 'Step 1: Kick-Off',
        desc: 'Scope confirmed & sprint reserved',
        done: true,
        date: proj.startDate || 'Day 1'
      },
      {
        id: 'step-2',
        title: 'Step 5: Advance 50%',
        desc: proj.advancePaid ? `$${proj.advanceAmount || half} verified` : `$${half} deposit pending`,
        done: proj.advancePaid,
        date: proj.advancePaid ? 'Cleared' : 'Awaiting'
      },
      {
        id: 'step-3',
        title: 'Step 7: Discord Brief',
        desc: proj.discordShared ? 'Developer team briefed' : 'Pending SOP handoff',
        done: proj.discordShared,
        date: proj.discordSharedAt ? new Date(proj.discordSharedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'
      },
      {
        id: 'step-4',
        title: 'Step 8: Staging QA',
        desc: proj.internalQAPassed ? '100% QA verified' : 'Internal dev domain active',
        done: proj.internalQAPassed,
        date: proj.stagingUrl ? 'Live Staging' : 'In Dev'
      },
      {
        id: 'step-5',
        title: 'Step 8: Client Review',
        desc: proj.clientApproved ? 'Client 5-star sign-off' : 'Pending inspection',
        done: proj.clientApproved,
        date: proj.clientApprovalDate ? new Date(proj.clientApprovalDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Review'
      },
      {
        id: 'step-6',
        title: 'Step 8: Balance Gate',
        desc: proj.balancePaid ? `$${proj.balanceAmount || half} verified (Unlocked)` : `SOP 8: $${half} unlocks DNS cutover`,
        done: proj.balancePaid,
        date: proj.balancePaid ? 'Paid' : 'Locked'
      },
      {
        id: 'step-7',
        title: 'Step 11: Live Delivery',
        desc: proj.domainTransferred ? 'Transferred & 100% Live' : `Target: ${proj.targetDeliveryDate || 'TBD'}`,
        done: proj.domainTransferred,
        date: proj.targetDeliveryDate || 'Deadline'
      }
    ];

    return {
      startDateFormatted: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      targetDateFormatted: targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      totalDays,
      daysElapsed,
      daysRemaining,
      isCompleted,
      isOverdue,
      isUrgent,
      progressPercent,
      steps,
      completedSteps: steps.filter(s => s.done).length
    };
  };

  const filtered = projects.filter(p => {
    const t = getTimelineDetails(p);
    if (filterChannel !== 'all' && p.channel !== filterChannel) return false;
    if (filterStatus === 'active') return !t.isCompleted;
    if (filterStatus === 'urgent') return t.isUrgent || t.isOverdue;
    if (filterStatus === 'completed') return t.isCompleted;
    return true;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* View Header & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Full Project Timeline &amp; Milestone Gantt</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {filtered.length} Projects
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comprehensive schedule oversight tracking sprint progression, milestone transfer locks, and delivery deadlines
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Sprints
            </button>
            <button
              onClick={() => setFilterStatus('urgent')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'urgent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Deadlines / Urgent</span>
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Completed Live
            </button>
          </div>
        </div>
      </div>

      {/* Projects Timeline Stack */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400 text-xs">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Projects Found</h3>
            <p className="mt-1">No projects match the selected timeline filters.</p>
          </div>
        ) : (
          filtered.map(proj => {
            const t = getTimelineDetails(proj);
            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between"
              >
                {/* Top Section: Meta & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {proj.clientName}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {proj.websiteType}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                        {proj.channel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {proj.clientCompany ? `${proj.clientCompany} • ` : ''}{proj.purpose}
                    </p>
                  </div>

                  {/* Deadline Urgency Pill */}
                  <div className="flex items-center gap-2">
                    {t.isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>Domain Transferred &amp; Live</span>
                      </span>
                    ) : t.isOverdue ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Overdue by {Math.abs(t.daysRemaining)} Days</span>
                      </span>
                    ) : t.isUrgent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Deadline: {t.daysRemaining} Days Left</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{t.daysRemaining} Days Remaining</span>
                      </span>
                    )}

                    <span className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                      {formatMoney(proj.finalPrice || proj.estimatedPrice || 0)}
                    </span>
                  </div>
                </div>

                {/* Middle: Schedule Progress Bar */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-white/5 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Kick-Off Date: <strong className="font-mono text-slate-800 dark:text-slate-200">{t.startDateFormatted}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                      <Flag className={`w-3.5 h-3.5 ${t.isOverdue ? 'text-rose-500' : 'text-indigo-500'}`} />
                      <span>Target Delivery Deadline: <strong className={`font-mono ${t.isOverdue ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{t.targetDateFormatted}</strong></span>
                    </div>
                  </div>

                  {/* Progress Fill */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.isCompleted
                          ? 'bg-emerald-500'
                          : t.isOverdue
                          ? 'bg-rose-500'
                          : t.isUrgent
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${t.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Sprint Duration: {t.daysElapsed} of {t.totalDays} days ({t.progressPercent}% elapsed)</span>
                    <span>{t.completedSteps} of 7 SOP Milestones Verified</span>
                  </div>
                </div>

                {/* Bottom: Milestone Sequence */}
                <div className="pt-2 overflow-x-auto scrollbar-thin">
                  <div className="flex items-center min-w-[700px] justify-between relative py-2">
                    {t.steps.map((st, i) => {
                      const isLast = i === t.steps.length - 1;
                      return (
                        <div key={st.id} className="flex-1 flex flex-col items-center text-center relative px-2">
                          {/* Track Line */}
                          {!isLast && (
                            <div
                              className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-10 transition-colors ${
                                st.done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            />
                          )}

                          {/* Node Icon */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                              st.done
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                            title={`${st.title}: ${st.desc}`}
                          >
                            {st.done ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                          </div>

                          <span className={`text-[10px] font-bold mt-1.5 truncate max-w-[90px] ${
                            st.done ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                          }`}>
                            {st.title}
                          </span>

                          <span className="text-[9px] text-slate-500 dark:text-slate-400 max-w-[100px] truncate leading-tight">
                            {st.desc}
                          </span>

                          <span className="text-[8px] font-mono text-slate-400 mt-0.5">
                            {st.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span>Assigned: <strong className="text-slate-700 dark:text-slate-300">{proj.assignedSalesperson || 'Lead Coordinator'}</strong></span>
                    {proj.stagingUrl && (
                      <a
                        href={proj.stagingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Server className="w-3.5 h-3.5" />
                        <span>Staging Preview</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenTimeTracker && (
                      <button
                        onClick={() => onOpenTimeTracker(proj)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Tasks &amp; Time</span>
                      </button>
                    )}

                    {onSelectProject && (
                      <button
                        onClick={() => onSelectProject(proj)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <span>Project Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
