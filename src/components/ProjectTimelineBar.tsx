import React, { useRef, useState, useMemo } from 'react';
import { ProjectLead, WebsiteType } from '../types';
import {
  Calendar,
  CalendarRange,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  ShieldCheck,
  Lock,
  Unlock,
  ExternalLink,
  Sparkles,
  Server,
  DollarSign,
  ArrowRight,
  Maximize2,
  Minimize2,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

interface ProjectTimelineBarProps {
  projects: ProjectLead[];
  onSelectProject?: (project: ProjectLead) => void;
  onOpenTimeTracker?: (project: ProjectLead) => void;
  formatMoney: (amount: number) => string;
}

export interface MilestoneStep {
  id: string;
  name: string;
  shortName: string;
  isCompleted: boolean;
  isCurrent: boolean;
  date?: string;
  detail: string;
  type: 'kickoff' | 'advance' | 'discord' | 'staging' | 'approval' | 'balance' | 'delivery';
}

export const ProjectTimelineBar: React.FC<ProjectTimelineBarProps> = ({
  projects,
  onSelectProject,
  onOpenTimeTracker,
  formatMoney
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'urgent' | 'completed'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Compute milestones and deadline analytics for a project
  const getProjectTimelineData = (proj: ProjectLead) => {
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
    const isApproaching = !isCompleted && daysRemaining > 3 && daysRemaining <= 6;

    // Progress percentage
    let progressPercent = 0;
    if (isCompleted) {
      progressPercent = 100;
    } else {
      progressPercent = Math.min(100, Math.max(5, Math.round((daysElapsed / totalDays) * 100)));
    }

    // Milestones chain
    const half = Number(((proj.finalPrice || proj.estimatedPrice || 0) * 0.5).toFixed(2));

    const milestones: MilestoneStep[] = [
      {
        id: 'step-1-kickoff',
        name: 'Sprint Kick-Off',
        shortName: 'Kick-Off',
        isCompleted: true,
        isCurrent: proj.status === 'lead' || proj.status === 'scoped',
        date: proj.startDate || 'Day 1',
        detail: `Scoped: ${proj.websiteType.toUpperCase()}`,
        type: 'kickoff'
      },
      {
        id: 'step-2-advance',
        name: '50% Advance Deposit',
        shortName: 'Advance 50%',
        isCompleted: proj.advancePaid,
        isCurrent: proj.status === 'scoped' && !proj.advancePaid,
        date: proj.advancePaid ? 'Cleared' : 'Due',
        detail: proj.advancePaid ? `$${proj.advanceAmount || half} verified` : `$${half} deposit pending`,
        type: 'advance'
      },
      {
        id: 'step-3-discord',
        name: 'Discord Team Briefing',
        shortName: 'Team Sync',
        isCompleted: proj.discordShared,
        isCurrent: proj.advancePaid && !proj.discordShared,
        date: proj.discordSharedAt ? new Date(proj.discordSharedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending',
        detail: proj.discordShared ? 'Developer sprint briefed' : 'Pending SOP 7 handoff',
        type: 'discord'
      },
      {
        id: 'step-4-staging',
        name: 'Staging Environment QA',
        shortName: 'Staging QA',
        isCompleted: proj.internalQAPassed,
        isCurrent: proj.status === 'staging_dev' && !proj.internalQAPassed,
        date: proj.stagingUrl ? 'Live' : 'In Dev',
        detail: proj.internalQAPassed ? '100% QA checks passed' : 'Cross-device verification pending',
        type: 'staging'
      },
      {
        id: 'step-5-approval',
        name: 'Client Staging Sign-Off',
        shortName: 'Sign-Off',
        isCompleted: proj.clientApproved,
        isCurrent: proj.internalQAPassed && !proj.clientApproved,
        date: proj.clientApprovalDate ? new Date(proj.clientApprovalDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Review',
        detail: proj.clientApproved ? 'Approved by stakeholder' : 'Awaiting client inspection',
        type: 'approval'
      },
      {
        id: 'step-6-balance',
        name: '50% Balance Clearance Gate',
        shortName: 'Balance 50%',
        isCompleted: proj.balancePaid,
        isCurrent: proj.clientApproved && !proj.balancePaid,
        date: proj.balancePaid ? 'Paid' : 'Locked',
        detail: proj.balancePaid ? `$${proj.balanceAmount || half} unlocked` : `SOP 8: $${half} unlocks DNS cutover`,
        type: 'balance'
      },
      {
        id: 'step-7-delivery',
        name: 'Production DNS Cutover',
        shortName: 'Live Cutover',
        isCompleted: proj.domainTransferred,
        isCurrent: proj.balancePaid && !proj.domainTransferred,
        date: proj.targetDeliveryDate || 'Deadline',
        detail: proj.domainTransferred ? 'Transferred & 100% Live' : `Target: ${proj.targetDeliveryDate || 'TBD'}`,
        type: 'delivery'
      }
    ];

    const completedMilestonesCount = milestones.filter(m => m.isCompleted).length;

    return {
      startDateFormatted: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      targetDateFormatted: targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      totalDays,
      daysElapsed,
      daysRemaining,
      isCompleted,
      isOverdue,
      isUrgent,
      isApproaching,
      progressPercent,
      milestones,
      completedMilestonesCount
    };
  };

  // Filter projects according to timeline criteria
  const processedProjects = useMemo(() => {
    return projects.map(proj => ({
      project: proj,
      timeline: getProjectTimelineData(proj)
    }));
  }, [projects]);

  const filteredProcessed = useMemo(() => {
    return processedProjects.filter(({ timeline }) => {
      if (filterMode === 'active') return !timeline.isCompleted;
      if (filterMode === 'urgent') return timeline.isUrgent || timeline.isOverdue;
      if (filterMode === 'completed') return timeline.isCompleted;
      return true;
    });
  }, [processedProjects, filterMode]);

  // Overall milestone summary
  const summaryStats = useMemo(() => {
    const total = processedProjects.length;
    const completed = processedProjects.filter(p => p.timeline.isCompleted).length;
    const overdue = processedProjects.filter(p => p.timeline.isOverdue).length;
    const urgent = processedProjects.filter(p => p.timeline.isUrgent).length;
    const onTrack = processedProjects.filter(p => !p.timeline.isCompleted && !p.timeline.isOverdue && !p.timeline.isUrgent).length;

    return { total, completed, overdue, urgent, onTrack };
  }, [processedProjects]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 380;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden mb-5 transition-all">
      {/* Top Bar: Title, Filters & Controls */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Project Milestones &amp; Deadlines Timeline</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                SOP Step 1–11 Gateways
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Interactive horizontal milestone tracking across active sprint schedules and final delivery gates
            </p>
          </div>
        </div>

        {/* Filter Chips & Scroll Arrows */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Filter Buttons */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[11px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({summaryStats.total})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({summaryStats.onTrack + summaryStats.urgent + summaryStats.overdue})
            </button>
            <button
              onClick={() => setFilterMode('urgent')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                filterMode === 'urgent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Deadlines ({summaryStats.urgent + summaryStats.overdue})</span>
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterMode === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              Completed ({summaryStats.completed})
            </button>
          </div>

          {/* Left/Right Horizontal Scroll Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Scroll Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Scroll Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse timeline bar' : 'Expand timeline bar'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Horizontal Scrollable Bar Container */}
      {isExpanded && (
        <div
          ref={scrollContainerRef}
          className="p-4 overflow-x-auto flex gap-4 scrollbar-thin scroll-smooth focus:outline-hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {filteredProcessed.length === 0 ? (
            <div className="w-full py-8 text-center text-slate-400 text-xs">
              <CalendarRange className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>No projects match the selected timeline filter.</p>
            </div>
          ) : (
            filteredProcessed.map(({ project, timeline }) => {
              const isSelected = selectedProjectId === project.id;
              return (
                <div
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(isSelected ? null : project.id);
                    if (onSelectProject) onSelectProject(project);
                  }}
                  className={`w-[440px] sm:w-[500px] shrink-0 p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-md ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Project Info Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {project.clientName}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {project.websiteType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {project.clientCompany || project.purpose}
                        </p>
                      </div>

                      {/* Deadline Status Badge */}
                      <div className="shrink-0">
                        {timeline.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>100% Live</span>
                          </span>
                        ) : timeline.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Overdue by {Math.abs(timeline.daysRemaining)}d</span>
                          </span>
                        ) : timeline.isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>{timeline.daysRemaining} days left</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                            <Clock className="w-3 h-3" />
                            <span>{timeline.daysRemaining} days left</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline Schedule Bar: Start -> Target Date */}
                    <div className="mb-3 p-2.5 rounded-lg bg-white dark:bg-slate-950/50 border border-slate-200/80 dark:border-white/5 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Start: <strong className="text-slate-700 dark:text-slate-300 font-mono">{timeline.startDateFormatted}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Flag className={`w-3 h-3 ${timeline.isOverdue ? 'text-rose-500' : 'text-indigo-500'}`} />
                          <span>Deadline: <strong className={`font-mono ${timeline.isOverdue ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{timeline.targetDateFormatted}</strong></span>
                        </div>
                      </div>

                      {/* Visual Sprint Progress Fill */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            timeline.isCompleted
                              ? 'bg-emerald-500'
                              : timeline.isOverdue
                              ? 'bg-rose-500'
                              : timeline.isUrgent
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${timeline.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Day {timeline.daysElapsed} of {timeline.totalDays}</span>
                        <span>{timeline.completedMilestonesCount}/7 SOP Milestones</span>
                      </div>
                    </div>

                    {/* Horizontal Interactive Milestone Step Chain */}
                    <div className="relative pt-1 pb-2">
                      <div className="flex items-center justify-between relative z-10">
                        {timeline.milestones.map((step, idx) => {
                          const isLast = idx === timeline.milestones.length - 1;
                          return (
                            <div key={step.id} className="flex-1 flex flex-col items-center text-center group/step relative">
                              {/* Horizontal Connecting Line between nodes */}
                              {!isLast && (
                                <div
                                  className={`absolute top-3 left-1/2 w-full h-0.5 -z-10 transition-colors ${
                                    step.isCompleted
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                />
                              )}

                              {/* Node Circle */}
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                                  step.isCompleted
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                                    : step.isCurrent
                                    ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/30 animate-pulse'
                                    : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-300 dark:border-slate-700'
                                }`}
                                title={`${step.name}: ${step.detail}`}
                              >
                                {step.isCompleted ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>

                              {/* Label */}
                              <span
                                className={`text-[9px] font-semibold mt-1 max-w-[56px] truncate ${
                                  step.isCompleted
                                    ? 'text-slate-800 dark:text-slate-200'
                                    : step.isCurrent
                                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.shortName}
                              </span>

                              {/* Date / Status Tag */}
                              <span className="text-[8px] font-mono text-slate-400 block -mt-0.5">
                                {step.date}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Quick Action */}
                  <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                      <span>Agreed: <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{formatMoney(project.finalPrice || project.estimatedPrice || 0)}</strong></span>
                      {project.balancePaid && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>100% Paid</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {project.stagingUrl && (
                        <a
                          href={project.stagingUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] text-slate-400 hover:text-indigo-500 transition flex items-center gap-0.5 font-mono"
                          title="Open staging URL"
                        >
                          <Server className="w-3 h-3" />
                          <span>Staging</span>
                        </a>
                      )}

                      {onOpenTimeTracker && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenTimeTracker(project);
                          }}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Tasks</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
