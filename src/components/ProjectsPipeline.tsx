import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectLead, WebsiteType, LeadChannel } from '../types';
import {
  Search,
  Filter,
  Kanban as KanbanIcon,
  Table as TableIcon,
  Plus,
  ExternalLink,
  Lock,
  Unlock,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Server,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  Radar,
  Zap,
  Globe2,
  Building2,
  Award,
  Users,
  FileCheck,
  ShieldCheck,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Timer as TimerIcon,
  Play,
  CalendarRange as TimelineIcon,
  Edit3,
  FileSpreadsheet,
  CheckSquare,
  Calendar,
  FileText,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PartnerEvaluationModal } from './PartnerEvaluationModal';
import { ShareWithPartnerModal } from './ShareWithPartnerModal';
import { ProjectTimeTrackingModal } from './ProjectTimeTrackingModal';
import { ProjectQuickEditModal } from './ProjectQuickEditModal';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { GoogleWorkspaceModal } from './GoogleWorkspaceModal';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { ProjectTimelineBar } from './ProjectTimelineBar';
import { ProjectTimelineFullView } from './ProjectTimelineFullView';
import { generateDefaultTasksForProject } from '../lib/timeTrackingDefaults';
import { SkeletonKanban, SkeletonTable } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { KanbanTaskSwimlanes } from './KanbanTaskSwimlanes';

export const ProjectsPipeline: React.FC = () => {
  const {
    projects,
    loadingProjects,
    updateProject,
    transferProject,
    openAIModal,
    openOutreachWithData,
    openClientPortal,
    setActiveTab,
    setIsNewLeadModalOpen,
    setDiscordExportModalData,
    showToast,
    t,
    role,
    currentUser
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'timeline'>('kanban');
  const [kanbanSubView, setKanbanSubView] = useState<'tasks_swimlanes' | 'deals_pipeline'>('tasks_swimlanes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedScoreTier, setSelectedScoreTier] = useState<string>('all');
  const [isScoringLeads, setIsScoringLeads] = useState<boolean>(false);
  const [evaluatingProject, setEvaluatingProject] = useState<ProjectLead | null>(null);
  const [sharingProject, setSharingProject] = useState<ProjectLead | null>(null);
  const [editingScopeProject, setEditingScopeProject] = useState<ProjectLead | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [workspaceModalTab, setWorkspaceModalTab] = useState<'sheets' | 'tasks' | 'calendar' | 'docs'>('sheets');
  const [selectedWorkspaceProject, setSelectedWorkspaceProject] = useState<ProjectLead | null>(null);
  const [pipelineSaveStatus, setPipelineSaveStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('saved');
  const [pipelineLastSaved, setPipelineLastSaved] = useState<Date | null>(new Date());

  // Time Tracking Module States
  const [timeTrackingProject, setTimeTrackingProject] = useState<ProjectLead | null>(null);
  const [timeTrackingInitialTab, setTimeTrackingInitialTab] = useState<'tasks' | 'timer' | 'manual' | 'logs'>('tasks');
  const [timeTrackingTaskId, setTimeTrackingTaskId] = useState<string | undefined>(undefined);
  const [globalRunningTimer, setGlobalRunningTimer] = useState<any | null>(null);

  // Polling for global active running stopwatch timer across views
  useEffect(() => {
    const checkGlobalTimer = () => {
      const raw = localStorage.getItem('global_active_timer');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.isRunning) {
            setGlobalRunningTimer(parsed);
          } else {
            setGlobalRunningTimer(null);
          }
        } catch {
          setGlobalRunningTimer(null);
        }
      } else {
        setGlobalRunningTimer(null);
      }
    };
    checkGlobalTimer();
    const timerInterval = setInterval(checkGlobalTimer, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Compute total logged developer hours across all projects in pipeline
  const totalPipelineLoggedHours = useMemo(() => {
    return projects.reduce((total, p) => {
      if (p.tasks && p.tasks.length > 0) {
        return total + p.tasks.reduce((sum, t) => sum + (Number(t.loggedHours) || 0), 0);
      }
      if (p.timeLogs && p.timeLogs.length > 0) {
        return total + p.timeLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
      }
      return total;
    }, 0);
  }, [projects]);

  // Helper to extract time summary for a project card
  const getProjectTimeSummary = (p: ProjectLead) => {
    const tasks = p.tasks && p.tasks.length > 0 ? p.tasks : generateDefaultTasksForProject(p);
    const loggedHours = tasks.reduce((sum, t) => sum + (Number(t.loggedHours) || 0), 0);
    const estHours = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const isOverdue = loggedHours > estHours;
    const percent = estHours > 0 ? Math.min(Math.round((loggedHours / estHours) * 100), 100) : 0;
    return { tasks, loggedHours, estHours, activeTasks, isOverdue, percent };
  };

  const handleScoreAllLeads = async () => {
    try {
      setIsScoringLeads(true);
      const res = await fetch('/api/leads/score-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('All pipeline leads re-evaluated with Gemini Smart Scoring.');
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to score leads', e);
    } finally {
      setIsScoringLeads(false);
    }
  };

  // Helper to determine whether a project has been explicitly shared with or authorized for the collaborator
  const isProjectAuthorizedForCollaborator = (p: ProjectLead): boolean => {
    // 1. Explicitly marked as shared deal sheet
    if (p.isDealSheetShared) return true;

    // 2. Check assigned collaborators array
    const assigned = Array.isArray(p.assignedCollaborators) ? p.assignedCollaborators : [];
    if (assigned.length === 0) return false;

    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userId = (currentUser?.id || '').toLowerCase().trim();
    const userName = (currentUser?.name || '').toLowerCase().trim();

    // Direct check against authenticated user credentials if available
    if (userEmail || userId || userName) {
      const isDirectlyAssigned = assigned.some(collaboratorRef => {
        const refStr = String(collaboratorRef).toLowerCase().trim();
        return (
          (userEmail && (refStr === userEmail || refStr.includes(userEmail) || userEmail.includes(refStr))) ||
          (userId && (refStr === userId || refStr.includes(userId))) ||
          (userName && (refStr === userName || refStr.includes(userName) || userName.includes(refStr)))
        );
      });
      if (isDirectlyAssigned) return true;
    }

    // Role-level match for external partner workspace (e.g. Vance Capital / Institutional Partner)
    const isPartnerAssigned = assigned.some(collaboratorRef => {
      const refStr = String(collaboratorRef).toLowerCase().trim();
      return (
        refStr.includes('vance') ||
        refStr.includes('partner@vance-capital.com') ||
        refStr.includes('collaborator') ||
        refStr.includes('partner')
      );
    });

    return isPartnerAssigned || Boolean(p.partnerSignOff);
  };

  // Conditionally filter projects based on the user's role:
  // 'collaborator' users ONLY see projects where they are explicitly listed as authorized.
  const roleFilteredProjects = useMemo(() => {
    if (role === 'collaborator') {
      return projects.filter(p => isProjectAuthorizedForCollaborator(p));
    }
    return projects;
  }, [projects, role, currentUser]);

  // Filter projects by search query, channel, website type, and AI score tier
  const filteredProjects = useMemo(() => {
    return roleFilteredProjects.filter(p => {
      const matchesSearch =
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clientCompany && p.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = selectedChannel === 'all' || p.channel === selectedChannel;
      const matchesType = selectedType === 'all' || p.websiteType === selectedType;
      const matchesScoreTier = selectedScoreTier === 'all' || p.leadScore?.tierTag === selectedScoreTier;
      return matchesSearch && matchesChannel && matchesType && matchesScoreTier;
    });
  }, [roleFilteredProjects, searchQuery, selectedChannel, selectedType, selectedScoreTier]);

  // Kanban columns mapping
  const columns = [
    {
      id: 'lead',
      title: '1. Discovery & Scoping',
      subtitle: 'SOP Step 1-3: Inquiry, Assets & Hosting',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      projects: filteredProjects.filter(p => p.status === 'lead' || p.status === 'scoped')
    },
    {
      id: 'advance',
      title: '2. Advance 50% Cleared',
      subtitle: 'SOP Step 5: Kick-off Authorized',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      projects: filteredProjects.filter(p => p.status === 'advance_paid')
    },
    {
      id: 'staging',
      title: '3. Internal Staging & QA',
      subtitle: 'SOP Step 8: Build on Internal Domain',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      projects: filteredProjects.filter(p => p.status === 'staging_dev' || p.status === 'client_review')
    },
    {
      id: 'transfer_gate',
      title: '4. Balance Paid & Transfer',
      subtitle: 'SOP Step 8: Live Domain Handover Gate',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      projects: filteredProjects.filter(p => p.status === 'balance_paid' || (p.balancePaid && !p.domainTransferred))
    },
    {
      id: 'completed',
      title: '5. Transferred & Closed',
      subtitle: 'SOP Step 11: Retention & Retainers',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      projects: filteredProjects.filter(p => p.status === 'transferred' || p.status === 'completed')
    }
  ];

  const stageOrder = ['lead', 'advance', 'staging', 'transfer_gate', 'completed'];
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [activeDropColumnId, setActiveDropColumnId] = useState<string | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);

  const handleMoveProjectToStage = async (projectId: string, targetColumnId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const half = Number((project.finalPrice * 0.5).toFixed(2));
    let updates: Partial<ProjectLead> = {};

    if (targetColumnId === 'lead') {
      updates = {
        status: 'lead',
        advancePaid: false,
        advanceAmount: 0
      };
      showToast(`Moved "${project.clientName}" back to Discovery & Scoping.`);
    } else if (targetColumnId === 'advance') {
      updates = {
        status: 'advance_paid',
        advancePaid: true,
        advanceAmount: half
      };
      showToast(`Advance 50% deposit cleared ($${half}) for "${project.clientName}". Kick-off authorized.`);
    } else if (targetColumnId === 'staging') {
      updates = {
        status: 'staging_dev',
        advancePaid: true,
        advanceAmount: project.advancePaid ? project.advanceAmount : half,
        internalQAPassed: true
      };
      showToast(`"${project.clientName}" promoted to Internal Staging & QA stage.`);
    } else if (targetColumnId === 'transfer_gate') {
      updates = {
        status: 'balance_paid',
        advancePaid: true,
        advanceAmount: project.advancePaid ? project.advanceAmount : half,
        balancePaid: true,
        balanceAmount: half
      };
      showToast(`Balance 50% verified ($${half}) for "${project.clientName}". Transfer lock released.`);
    } else if (targetColumnId === 'completed') {
      updates = {
        status: 'transferred',
        advancePaid: true,
        advanceAmount: project.advancePaid ? project.advanceAmount : half,
        balancePaid: true,
        balanceAmount: half,
        domainTransferred: true
      };
      showToast(`"${project.clientName}" domain transferred & completed (SOP Step 11).`);
    }

    setRecentlyMovedId(projectId);
    setTimeout(() => setRecentlyMovedId(null), 1800);
    setPipelineSaveStatus('syncing');
    try {
      await updateProject(projectId, updates);
      setPipelineSaveStatus('saved');
      setPipelineLastSaved(new Date());
    } catch {
      setPipelineSaveStatus('error');
    }
  };

  const handleDragStart = (e: React.DragEvent, project: ProjectLead) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProjectId(project.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropColumnId !== columnId) {
      setActiveDropColumnId(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setActiveDropColumnId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain') || draggedProjectId;
    setDraggedProjectId(null);
    setActiveDropColumnId(null);
    if (projectId) {
      await handleMoveProjectToStage(projectId, targetColumnId);
    }
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setActiveDropColumnId(null);
  };

  const handleAdvancePaidToggle = async (project: ProjectLead) => {
    const newState = !project.advancePaid;
    await updateProject(project.id, {
      advancePaid: newState,
      advanceAmount: newState ? Number((project.finalPrice * 0.5).toFixed(2)) : 0,
      status: newState ? 'advance_paid' : 'scoped'
    });
  };

  const handleBalancePaidToggle = async (project: ProjectLead) => {
    const newState = !project.balancePaid;
    await updateProject(project.id, {
      balancePaid: newState,
      balanceAmount: newState ? Number((project.finalPrice * 0.5).toFixed(2)) : 0,
      status: newState ? (project.domainTransferred ? 'completed' : 'balance_paid') : 'staging_dev'
    });
  };

  const handleTransferClick = async (project: ProjectLead) => {
    if (!project.balancePaid) {
      showToast('SOP Rule 8 Violation: Website transfer is strictly locked until the remaining 50% balance payment is verified.', 'error');
      return;
    }
    await transferProject(project.id);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10 shadow-xl">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-pipeline-search"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900/60 text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Dropdowns and View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Channel Filter */}
          <select
            id="select-pipeline-channel"
            value={selectedChannel}
            onChange={e => setSelectedChannel(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Channels (Upwork, LinkedIn...)</option>
            <option value="linkedin">LinkedIn</option>
            <option value="upwork">Upwork</option>
            <option value="email">Direct Email</option>
            <option value="direct">Referral / Direct</option>
          </select>

          {/* Type Filter */}
          <select
            id="select-pipeline-type"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Types (Landing, Store...)</option>
            <option value="landing">Landing Page ($200–$300)</option>
            <option value="ecommerce">E-commerce ($500–$700)</option>
            <option value="corporate">Corporate ($800+)</option>
          </select>

          {/* Lead Score Tier Filter */}
          <select
            id="select-pipeline-score-tier"
            value={selectedScoreTier}
            onChange={e => setSelectedScoreTier(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Lead Scores</option>
            <option value="vip">⚡ VIP Leads (88+)</option>
            <option value="hot">🔥 Hot Leads (78-87)</option>
            <option value="warm">⚠️ Warm Leads (50-77)</option>
            <option value="cold">❄️ Cold Leads (&lt;50)</option>
          </select>

          {/* Time Tracking & Active Timer Module Trigger */}
          <div className="flex items-center gap-1.5">
            {globalRunningTimer && (
              <button
                onClick={() => {
                  const targetProj = projects.find(p => p.id === globalRunningTimer.projectId) || projects[0];
                  if (targetProj) {
                    setTimeTrackingProject(targetProj);
                    setTimeTrackingInitialTab('timer');
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold animate-pulse hover:bg-emerald-500/30 transition cursor-pointer"
                title={`Active stopwatch timer on: ${globalRunningTimer.projectName || 'Active Task'} (${globalRunningTimer.taskTitle})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="hidden lg:inline">{globalRunningTimer.projectName ? `${globalRunningTimer.projectName}: ` : ''}</span>
                <span>Timer Running</span>
              </button>
            )}

            <button
              id="btn-pipeline-time-tracker"
              onClick={() => {
                const targetProj = projects[0] || null;
                setTimeTrackingProject(targetProj);
                setTimeTrackingInitialTab('tasks');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Open Project Time Tracking & Developer Sprint Tasks"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Time Tracker</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                {totalPipelineLoggedHours.toFixed(1)}h
              </span>
            </button>
          </div>

          {/* Score All Leads Button - Internal Roles Only */}
          {role !== 'collaborator' && (
            <button
              id="btn-score-all-leads"
              onClick={handleScoreAllLeads}
              disabled={isScoringLeads}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold shadow-xs transition"
              title="Calculate AI Lead Scores for all prospects"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isScoringLeads ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isScoringLeads ? 'Scoring...' : 'Score All Leads'}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-white/10 rounded-xl p-0.5 bg-slate-900/60">
            <button
              id="btn-view-kanban"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-slate-800/80 text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Kanban Board View"
            >
              <KanbanIcon className="w-4 h-4" />
            </button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-800/80 text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table Grid View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              id="btn-view-timeline"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-slate-800/80 text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Project Timeline & Milestone Gantt View"
            >
              <TimelineIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Kanban Sub-View Switcher (Tasks Swimlanes vs Deals Pipeline) */}
          {viewMode === 'kanban' && (
            <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80 shadow-2xs">
              <button
                type="button"
                id="btn-kanban-tasks-swimlanes"
                onClick={() => setKanbanSubView('tasks_swimlanes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  kanbanSubView === 'tasks_swimlanes'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Categorize project tasks into Horizontal Swimlanes by Urgency Level (Critical, High, Medium, Low)"
              >
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Task Swimlanes</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold">
                  Urgency
                </span>
              </button>
              <button
                type="button"
                id="btn-kanban-deals-pipeline"
                onClick={() => setKanbanSubView('deals_pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  kanbanSubView === 'deals_pipeline'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="SOP Stages Deals Pipeline"
              >
                <KanbanIcon className="w-3.5 h-3.5" />
                <span>Deals Pipeline</span>
              </button>
            </div>
          )}

          {/* Debounced Auto-Save Status Indicator */}
          <div className="hidden lg:flex items-center">
            <AutoSaveIndicator
              status={pipelineSaveStatus}
              lastSavedAt={pipelineLastSaved}
              size="sm"
            />
          </div>

          {/* Google Workspace Suite (Sheets, Tasks, Calendar, Docs) */}
          {role !== 'collaborator' && (
            <button
              onClick={() => {
                setSelectedWorkspaceProject(projects[0] || null);
                setWorkspaceModalTab('sheets');
                setIsWorkspaceModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-xs transition cursor-pointer border border-white/10"
              title="Google Workspace Suite: Sheets, Tasks, Calendar & Docs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Workspace</span>
            </button>
          )}

          {/* Add New Client Button - Hidden for Collaborator role */}
          {role !== 'collaborator' && (
            <button
              id="btn-pipeline-new-client"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition ml-auto sm:ml-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newLead')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Partner Isolated Workspace Alert Banner */}
      {role === 'collaborator' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-2 border-cyan-500/40 text-white flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-cyan-200">
                  Institutional Partner Workspace (Marcus Vance • Vance Capital)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Isolated NDA Role
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Displaying deal sheets explicitly shared with you for evaluation and appraisal sign-off. Internal agency commissions and sales payout rates are masked.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-cyan-900/60 border border-cyan-700/50 text-cyan-200 font-semibold">
              Authorized Deals: {roleFilteredProjects.length} of {projects.length} Total
            </span>
          </div>
        </div>
      )}

      {/* Collaborator No-Authorized-Deals Empty Notice */}
      {role === 'collaborator' && roleFilteredProjects.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No Authorized Deals Assigned"
          description="You do not currently have any active deal sheets or project scopes explicitly shared with your collaborator account. When an agency administrator authorizes a deal for your evaluation, it will appear here."
          variant="subtle"
        />
      )}

      {/* Security Rule 8 Reminder Banner */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{t('securityNotice')}</span>
        </div>
        <span className="text-[11px] font-mono text-indigo-400 hidden sm:inline">
          SOP Section 8.3 Enforcement
        </span>
      </div>

      {/* Project Milestones & Deadlines Horizontal Scrollable Bar */}
      {!loadingProjects && roleFilteredProjects.length > 0 && (
        <ProjectTimelineBar
          projects={roleFilteredProjects}
          onSelectProject={(proj) => {
            if (role === 'collaborator') {
              setEvaluatingProject(proj);
            } else {
              setTimeTrackingProject(proj);
              setTimeTrackingInitialTab('tasks');
            }
          }}
          onOpenTimeTracker={(proj) => {
            setTimeTrackingProject(proj);
            setTimeTrackingInitialTab('tasks');
          }}
          formatMoney={(amt) => `$${amt.toLocaleString()}`}
        />
      )}

      {/* Loading Skeleton */}
      {loadingProjects ? (
        viewMode === 'kanban' ? (
          <SkeletonKanban columnsCount={5} cardsPerColumn={3} />
        ) : (
          <SkeletonTable rows={6} cols={8} />
        )
      ) : filteredProjects.length === 0 && role !== 'collaborator' ? (
        <EmptyState
          icon={KanbanIcon}
          title="No deals in pipeline"
          description={
            searchQuery || selectedChannel !== 'all' || selectedType !== 'all' || selectedScoreTier !== 'all'
              ? 'No projects in your pipeline match the selected filters or search query.'
              : 'Your pipeline is currently empty. Create your first lead or connect inbound scraper channels.'
          }
          actionLabel={
            searchQuery || selectedChannel !== 'all' || selectedType !== 'all' || selectedScoreTier !== 'all'
              ? 'Reset All Filters'
              : 'Create First Lead'
          }
          onAction={
            searchQuery || selectedChannel !== 'all' || selectedType !== 'all' || selectedScoreTier !== 'all'
              ? () => {
                  setSearchQuery('');
                  setSelectedChannel('all');
                  setSelectedType('all');
                  setSelectedScoreTier('all');
                }
              : () => setIsNewLeadModalOpen(true)
          }
        />
      ) : (
        <>
          {/* TIMELINE FULL GANTT & MILESTONES VIEW */}
          {viewMode === 'timeline' && (
            <ProjectTimelineFullView
              projects={filteredProjects}
              onSelectProject={(proj) => {
                if (role === 'collaborator') {
                  setEvaluatingProject(proj);
                } else {
                  setTimeTrackingProject(proj);
                  setTimeTrackingInitialTab('tasks');
                }
              }}
              onOpenTimeTracker={(proj) => {
                setTimeTrackingProject(proj);
                setTimeTrackingInitialTab('tasks');
              }}
              onUpdateProject={updateProject}
              formatMoney={(amt) => `$${amt.toLocaleString()}`}
            />
          )}

          {/* KANBAN VIEW: HORIZONTAL SWIMLANES BY URGENCY LEVEL */}
          {viewMode === 'kanban' && kanbanSubView === 'tasks_swimlanes' && (
            <KanbanTaskSwimlanes
              projects={projects}
              onOpenTimeTracker={(proj, taskId) => {
                setTimeTrackingProject(proj);
                setTimeTrackingTaskId(taskId);
                setTimeTrackingInitialTab(taskId ? 'timer' : 'tasks');
              }}
              onUpdateProject={updateProject}
              formatMoney={(amt) => `$${amt.toLocaleString()}`}
            />
          )}

          {/* KANBAN DEALS PIPELINE (SOP STAGE COLUMNS) */}
          {viewMode === 'kanban' && kanbanSubView === 'deals_pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
              {columns.map((col, colIndex) => {
                const isDropTarget = activeDropColumnId === col.id && draggedProjectId !== null;

                return (
                  <motion.div
                    layout
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`rounded-2xl p-3 border transition-all duration-200 space-y-3 min-h-[520px] flex flex-col justify-between ${
                      isDropTarget
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg scale-[1.01]'
                        : 'bg-slate-100/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-white/5'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Column Header */}
                      <div className="pb-2 border-b border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {col.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.badgeColor}`}>
                            {col.projects.length}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {col.subtitle}
                        </p>
                      </div>

                      {/* Tactile Drop Target Banner */}
                      <AnimatePresence>
                        {isDropTarget && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="p-2.5 rounded-xl border-2 border-dashed border-indigo-500/80 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                            <span>Drop here to move stage</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cards List */}
                      <div className="space-y-3">
                        {col.projects.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                            No active clients in this stage
                          </div>
                        ) : (
                          <AnimatePresence mode="popLayout">
                            {col.projects.map(project => {
                              const isDraggingThis = draggedProjectId === project.id;
                              const isRecentlyMoved = recentlyMovedId === project.id;

                              return (
                                <motion.div
                                  layout
                                  layoutId={project.id}
                                  key={project.id}
                                  id={`client-card-${project.id}`}
                                  draggable={role !== 'collaborator'}
                                  onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project)}
                                  onDragEnd={handleDragEnd}
                                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                                  animate={{
                                    opacity: isDraggingThis ? 0.4 : 1,
                                    scale: isDraggingThis ? 0.98 : 1,
                                    y: 0
                                  }}
                                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 350,
                                    damping: 28,
                                    mass: 0.6
                                  }}
                                  whileHover={{
                                    y: -2,
                                    boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.12)'
                                  }}
                                  className={`rounded-xl p-3.5 border transition-colors duration-150 space-y-2.5 ${
                                    role !== 'collaborator' ? 'cursor-grab active:cursor-grabbing' : ''
                                  } ${
                                    isRecentlyMoved
                                      ? 'ring-2 ring-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                                      : isDraggingThis
                                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 shadow-xl'
                                      : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-white/10 hover:border-indigo-500/40 shadow-xs'
                                  }`}
                                >
                                  {/* Client Name & Drag Handle */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {role !== 'collaborator' && (
                                          <span
                                            className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-grab"
                                            title="Drag to change stage"
                                          >
                                            <GripVertical className="w-3.5 h-3.5" />
                                          </span>
                                        )}
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                          {project.channel}
                                        </span>
                                        {project.leadScore && (
                                          <span
                                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                              project.leadScore.tierTag === 'vip'
                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                                                : project.leadScore.tierTag === 'hot'
                                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                                                : project.leadScore.tierTag === 'warm'
                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                            title={project.leadScore.analysisSummary}
                                          >
                                            {project.leadScore.label} ({project.leadScore.totalScore})
                                          </span>
                                        )}
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                                        {project.clientName}
                                      </h5>
                                      {project.clientCompany && (
                                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                          {project.clientCompany}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                                        ${project.finalPrice}
                                      </span>
                                      <span className="block text-[9px] text-slate-400 uppercase font-semibold">
                                        {project.websiteType}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Purpose summary with Quick-Edit Trigger */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingScopeProject(project);
                                    }}
                                    className="group/desc p-1.5 -mx-1 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                                    title="Click to edit project description & scope (2s Debounced Auto-Save)"
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-0.5 opacity-70 group-hover/desc:opacity-100">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        Scope Description
                                      </span>
                                      <span className="flex items-center gap-0.5 text-[9px] text-indigo-500 font-semibold">
                                        <Edit3 className="w-2.5 h-2.5" />
                                        <span>Edit</span>
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                      {project.purpose}
                                    </p>
                                  </div>

                                  {/* Partner Collaboration & Appraisal Status Badge */}
                                  {(project.isDealSheetShared || (project.assignedCollaborators && project.assignedCollaborators.length > 0)) && (
                                    <div className="p-2 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-[11px] space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1">
                                          <Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                          <span>Vance Capital Partner</span>
                                        </span>
                                        {project.partnerSignOff ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                            Certified
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                            Evaluation Pending
                                          </span>
                                        )}
                                      </div>
                                      {project.partnerEvaluationScore && (
                                        <div className="flex items-center justify-between text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold pt-0.5">
                                          <span>Appraisal: {project.partnerEvaluationScore}/100</span>
                                          {project.partnerEvaluationNotes && (
                                            <span className="truncate max-w-[120px] text-slate-500 font-normal italic">
                                              {project.partnerEvaluationNotes}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Payment Milestones Tracker */}
                                  <div className="space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-[11px]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500">50% Advance:</span>
                                      <button
                                        onClick={() => handleAdvancePaidToggle(project)}
                                        className={`font-semibold px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                                          project.advancePaid
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {project.advancePaid ? '✅ $ ' + project.advanceAmount : '⏳ Pending'}
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500">50% Balance:</span>
                                      <button
                                        onClick={() => handleBalancePaidToggle(project)}
                                        className={`font-semibold px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition ${
                                          project.balancePaid
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                        }`}
                                      >
                                        {project.balancePaid ? '✅ $ ' + project.balanceAmount : '🔒 Due ($' + project.finalPrice * 0.5 + ')'}
                                      </button>
                                    </div>

                                    {/* If advance is unpaid and drip is active */}
                                    {!project.advancePaid && (
                                      <div className="pt-1 flex items-center justify-between text-[10px] border-t border-slate-200/50 dark:border-slate-700/50">
                                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                          <Zap className="w-3 h-3 text-amber-500" />
                                          Drip Stage {project.dripCampaign?.currentStage || 1}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setActiveTab('outreach');
                                          }}
                                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                                        >
                                          Manage Drip
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Staging URL Link if present */}
                                  {project.stagingUrl && (
                                    <div className="text-[10px] text-slate-500 flex items-center justify-between truncate bg-indigo-50/40 dark:bg-indigo-950/20 p-1.5 rounded">
                                      <span className="truncate">Staging: {project.stagingUrl.replace('https://', '')}</span>
                                      <ExternalLink className="w-3 h-3 text-indigo-500 shrink-0 ml-1" />
                                    </div>
                                  )}

                                  {/* Project Time & Developer Tasks Module Widget */}
                                  {(() => {
                                    const timeSummary = getProjectTimeSummary(project);
                                    const isTimerOnThis = globalRunningTimer && globalRunningTimer.projectId === project.id;
                                    return (
                                      <div className="p-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/5 space-y-1.5 text-[11px]">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                                            <span>Dev Sprint Time</span>
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setTimeTrackingProject(project);
                                              setTimeTrackingInitialTab(isTimerOnThis ? 'timer' : 'tasks');
                                            }}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                              isTimerOnThis
                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse'
                                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                                            }`}
                                          >
                                            {isTimerOnThis ? (
                                              <>
                                                <TimerIcon className="w-3 h-3 text-emerald-500 animate-spin" />
                                                <span>Running</span>
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="w-2.5 h-2.5" />
                                                <span>Log Hours</span>
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {timeSummary.loggedHours.toFixed(1)}h / {timeSummary.estHours.toFixed(1)}h est
                                          </span>
                                          <span>{timeSummary.activeTasks.length} active tasks</span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full transition-all duration-300 ${
                                              timeSummary.isOverdue
                                                ? 'bg-rose-500'
                                                : timeSummary.percent >= 80
                                                ? 'bg-amber-500'
                                                : 'bg-indigo-500'
                                            }`}
                                            style={{ width: `${Math.min(timeSummary.percent, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* SOP Step 8 Transfer Gate Action */}
                                  <div className="pt-1">
                                    {project.domainTransferred ? (
                                      <div className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Transferred &amp; Live</span>
                                      </div>
                                    ) : project.balancePaid ? (
                                      <button
                                        onClick={() => handleTransferClick(project)}
                                        className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                        <span>Transfer to Live Domain</span>
                                      </button>
                                    ) : (
                                      <div
                                        className="flex items-center justify-center gap-1 w-full py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-medium border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                        title="SOP Rule 8: Website transfer is strictly locked until remaining 50% balance payment is verified."
                                      >
                                        <Lock className="w-3 h-3 text-rose-500" />
                                        <span>Transfer Locked (Balance Due)</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Tactile Stage Prev/Next Steppers for Easy Single-Click Transitions */}
                                  {role !== 'collaborator' && (
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[10px]">
                                      <button
                                        disabled={colIndex === 0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (colIndex > 0) {
                                            handleMoveProjectToStage(project.id, stageOrder[colIndex - 1]);
                                          }
                                        }}
                                        className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium transition cursor-pointer ${
                                          colIndex === 0
                                            ? 'opacity-25 cursor-not-allowed text-slate-400'
                                            : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                        title={colIndex > 0 ? `Move back to ${columns[colIndex - 1].title}` : undefined}
                                      >
                                        <ChevronLeft className="w-3 h-3" />
                                        <span>Prev</span>
                                      </button>

                                      <span className="text-[9px] text-slate-400 font-mono">
                                        Stage {colIndex + 1}/5
                                      </span>

                                      <button
                                        disabled={colIndex === stageOrder.length - 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (colIndex < stageOrder.length - 1) {
                                            handleMoveProjectToStage(project.id, stageOrder[colIndex + 1]);
                                          }
                                        }}
                                        className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 font-semibold transition cursor-pointer ${
                                          colIndex === stageOrder.length - 1
                                            ? 'opacity-25 cursor-not-allowed text-slate-400'
                                            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                                        }`}
                                        title={colIndex < stageOrder.length - 1 ? `Advance to ${columns[colIndex + 1].title}` : undefined}
                                      >
                                        <span>Next</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Google Workspace One-Click Shortcut Bar */}
                                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-[10px]">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                      <Layers className="w-2.5 h-2.5 text-indigo-500" />
                                      <span>Workspace</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWorkspaceProject(project);
                                          setWorkspaceModalTab('sheets');
                                          setIsWorkspaceModalOpen(true);
                                        }}
                                        className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
                                        title="Google Sheets: Live Lead & Milestone Sync"
                                      >
                                        <FileSpreadsheet className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWorkspaceProject(project);
                                          setWorkspaceModalTab('tasks');
                                          setIsWorkspaceModalOpen(true);
                                        }}
                                        className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                                        title="Google Tasks: Sync SOP Steps 1-11 Tasks"
                                      >
                                        <CheckSquare className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWorkspaceProject(project);
                                          setWorkspaceModalTab('calendar');
                                          setIsWorkspaceModalOpen(true);
                                        }}
                                        className="p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition cursor-pointer"
                                        title="Google Calendar: Schedule Meetings & Payment Deadlines"
                                      >
                                        <Calendar className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWorkspaceProject(project);
                                          setWorkspaceModalTab('docs');
                                          setIsWorkspaceModalOpen(true);
                                        }}
                                        className={`p-1 rounded-md transition cursor-pointer ${
                                          project.googleDocUrl
                                            ? 'bg-blue-500/20 text-blue-400 font-bold'
                                            : 'hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                                        }`}
                                        title={project.googleDocUrl ? "Google Docs: Proposal Active (Click to View/Edit)" : "Google Docs: Generate Contract / Proposal"}
                                      >
                                        <FileText className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Bottom Quick Tools: Discord Export + AI Outreach + Portal + AI Assistant */}
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] gap-1">
                                    <button
                                      onClick={() => setDiscordExportModalData(project)}
                                      className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-[10px] cursor-pointer"
                                      title="Generate Discord SOP Step 7 Handoff"
                                    >
                                      <Share2 className="w-3 h-3" />
                                      <span>Discord</span>
                                    </button>
                                    <button
                                      onClick={() => openOutreachWithData(project)}
                                      className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                      title="Draft AI Cold Outreach / Connection Message"
                                    >
                                      <Radar className="w-3 h-3" />
                                      <span>Outreach</span>
                                    </button>
                                    <button
                                      onClick={() => openClientPortal(project.id)}
                                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                      title="Open Secure Client Portal"
                                    >
                                      <Globe2 className="w-3 h-3" />
                                      <span>Portal</span>
                                    </button>
                                    <button
                                      onClick={() => openAIModal({ clientName: project.clientName, websiteType: project.websiteType, channel: project.channel, mode: 'custom_pitch' })}
                                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Pitch</span>
                                    </button>
                                  </div>

                                  {/* Partner Appraisal & Share Action Bar */}
                                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    {(role === 'collaborator' || role === 'bd_head' || role === 'admin') && (
                                      <button
                                        onClick={() => setEvaluatingProject(project)}
                                        className="flex-1 py-1 px-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center gap-1 text-[10px] transition cursor-pointer"
                                        title="Open Partner Appraisal Form"
                                      >
                                        <Award className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                                        <span>{project.partnerSignOff ? `Appraised (${project.partnerEvaluationScore}/100)` : 'Appraise Deal'}</span>
                                      </button>
                                    )}
                                    {(role === 'admin' || role === 'bd_head' || role === 'sales') && (
                                      <button
                                        onClick={() => setSharingProject(project)}
                                        className="py-1 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center gap-1 text-[10px] transition cursor-pointer"
                                        title="Share Deal Sheet with Partner Collaborator"
                                      >
                                        <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        <span>Share</span>
                                      </button>
                                    )}
                                  </div>

                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase font-bold text-slate-400 border-b border-white/10">
              <tr>
                <th className="p-3.5">Client &amp; Channel</th>
                <th className="p-3.5">Website Type &amp; Purpose</th>
                <th className="p-3.5">Agreed Price</th>
                <th className="p-3.5">50% Advance</th>
                <th className="p-3.5">50% Balance</th>
                <th className="p-3.5">Dev Hours &amp; Tasks</th>
                <th className="p-3.5">{role === 'collaborator' ? 'Partner Due Diligence' : 'Commission'}</th>
                <th className="p-3.5">SOP Transfer Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">{p.clientName}</span>
                      {p.leadScore && (
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            p.leadScore.tierTag === 'vip'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : p.leadScore.tierTag === 'hot'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                              : p.leadScore.tierTag === 'warm'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.leadScore.label} ({p.leadScore.totalScore})
                        </span>
                      )}
                      {p.partnerSignOff && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                          Appraised ({p.partnerEvaluationScore}/100)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.clientCompany || p.clientEmail}</div>
                    <span className="inline-block mt-0.5 text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {p.channel}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="font-semibold uppercase text-[11px] text-indigo-600 dark:text-indigo-400">
                      {p.websiteType}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 truncate">{p.purpose}</div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    ${p.finalPrice}
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleAdvancePaidToggle(p)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        p.advancePaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700'
                      }`}
                    >
                      {p.advancePaid ? `Paid ($${p.advanceAmount})` : 'Pending'}
                    </button>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleBalancePaidToggle(p)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                        p.balancePaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950'
                      }`}
                    >
                      {p.balancePaid ? `Paid ($${p.balanceAmount})` : `Locked ($${p.finalPrice * 0.5})`}
                    </button>
                  </td>
                  <td className="p-3.5">
                    {(() => {
                      const summary = getProjectTimeSummary(p);
                      const isTimerOnThis = globalRunningTimer && globalRunningTimer.projectId === p.id;
                      return (
                        <div className="space-y-1 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {summary.loggedHours.toFixed(1)}h
                              <span className="text-[10px] text-slate-400 font-normal"> / {summary.estHours.toFixed(1)}h</span>
                            </span>
                            <button
                              onClick={() => {
                                setTimeTrackingProject(p);
                                setTimeTrackingInitialTab(isTimerOnThis ? 'timer' : 'tasks');
                              }}
                              className={`p-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                                isTimerOnThis
                                  ? 'bg-emerald-500/20 text-emerald-500 animate-pulse'
                                  : 'text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
                              }`}
                              title="Open time tracker for this project"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                summary.isOverdue
                                  ? 'bg-rose-500'
                                  : summary.percent >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(summary.percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {summary.activeTasks.length} active tasks
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3.5">
                    {role === 'collaborator' ? (
                      <div>
                        <span className="font-semibold text-slate-400 text-xs italic block">
                          [Restricted NDA]
                        </span>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                          Appraisal: {p.partnerEvaluationScore ? `${p.partnerEvaluationScore}/100` : 'Pending'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${p.commissionAmount}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({p.commissionRate}%)
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-3.5">
                    {p.domainTransferred ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Transferred
                      </span>
                    ) : p.balancePaid ? (
                      <button
                        onClick={() => handleTransferClick(p)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                      >
                        Execute Handover
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                    {(role === 'collaborator' || role === 'bd_head' || role === 'admin') && (
                      <button
                        onClick={() => setEvaluatingProject(p)}
                        className="p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50"
                        title="Partner Appraisal & Sign-off"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(role === 'admin' || role === 'bd_head' || role === 'sales') && (
                      <button
                        onClick={() => setSharingProject(p)}
                        className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        title="Share with Collaborator"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setTimeTrackingProject(p);
                        setTimeTrackingInitialTab('tasks');
                      }}
                      className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                      title="Developer Time Tracker & Tasks"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openClientPortal(p.id)}
                      className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                      title="Open Secure Client Portal"
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDiscordExportModalData(p)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Discord Export"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button
                      onClick={() => openAIModal({ clientName: p.clientName, websiteType: p.websiteType, channel: p.channel })}
                      className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                      title="AI Reply"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {/* Partner Modals */}
      <PartnerEvaluationModal
        project={evaluatingProject}
        isOpen={Boolean(evaluatingProject)}
        onClose={() => setEvaluatingProject(null)}
      />
      <ShareWithPartnerModal
        project={sharingProject}
        isOpen={Boolean(sharingProject)}
        onClose={() => setSharingProject(null)}
      />

      {/* Project Time Tracking & Developer Sprint Tasks Modal */}
      <ProjectTimeTrackingModal
        project={timeTrackingProject}
        isOpen={Boolean(timeTrackingProject)}
        onClose={() => setTimeTrackingProject(null)}
        initialTab={timeTrackingInitialTab}
        initialTaskId={timeTrackingTaskId}
      />

      {/* Debounced Project Scope & Description Quick-Edit Modal */}
      <ProjectQuickEditModal
        project={editingScopeProject}
        isOpen={Boolean(editingScopeProject)}
        onClose={() => setEditingScopeProject(null)}
        onSaveToBackend={async (id, updates) => {
          setPipelineSaveStatus('syncing');
          try {
            await updateProject(id, updates);
            setPipelineSaveStatus('saved');
            setPipelineLastSaved(new Date());
          } catch {
            setPipelineSaveStatus('error');
          }
        }}
      />

      {/* Google Sheets Real-Time Sync & Bulk Import Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Google Workspace Deep Integration Suite (Sheets, Tasks, Calendar, Docs) */}
      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        activeProject={selectedWorkspaceProject}
        initialTab={workspaceModalTab}
      />

    </div>
  );
};
