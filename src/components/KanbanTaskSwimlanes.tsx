import React, { useState, useMemo } from 'react';
import {
  ProjectLead,
  ProjectTask,
  UrgencyLevel,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  normalizeUrgencyLevel
} from '../types';
import { useApp } from '../context/AppContext';
import { generateDefaultTasksForProject } from '../lib/timeTrackingDefaults';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Search,
  Users,
  Layers,
  Sparkles,
  GripVertical,
  Trash2,
  Edit2,
  Check,
  X,
  Zap,
  FolderKanban,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  CheckSquare,
  BarChart3,
  Flame,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanTaskSwimlanesProps {
  projects: ProjectLead[];
  onOpenTimeTracker?: (project: ProjectLead, taskId?: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<ProjectLead>) => Promise<boolean>;
  formatMoney?: (amount: number) => string;
}

export interface UrgencyConfig {
  id: UrgencyLevel;
  label: string;
  sublabel: string;
  badgeClass: string;
  headerBorder: string;
  headerBg: string;
  cardBorderLeft: string;
  dropZoneBg: string;
  accentColor: string;
  accentBg: string;
  icon: React.ElementType;
}

export const URGENCY_CONFIGS: Record<UrgencyLevel, UrgencyConfig> = {
  critical: {
    id: 'critical',
    label: 'Critical Urgency',
    sublabel: 'Payment gate blockers, SSL/DNS cutovers & critical launch dependencies',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    headerBorder: 'border-l-4 border-l-rose-500 border-rose-200/80 dark:border-rose-900/40',
    headerBg: 'bg-rose-50/70 dark:bg-rose-950/20',
    cardBorderLeft: 'border-l-4 border-l-rose-500',
    dropZoneBg: 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-300/40 dark:border-rose-800/30',
    accentColor: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    icon: AlertOctagon
  },
  high: {
    id: 'high',
    label: 'High Urgency',
    sublabel: 'Milestone deliverables, staging regression QA & client review approvals',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    headerBorder: 'border-l-4 border-l-amber-500 border-amber-200/80 dark:border-amber-900/40',
    headerBg: 'bg-amber-50/70 dark:bg-amber-950/20',
    cardBorderLeft: 'border-l-4 border-l-amber-500',
    dropZoneBg: 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300/40 dark:border-amber-800/30',
    accentColor: 'text-amber-500',
    accentBg: 'bg-amber-500/10',
    icon: AlertTriangle
  },
  medium: {
    id: 'medium',
    label: 'Medium Urgency',
    sublabel: 'Standard development roadmap, responsive frontend & backend integrations',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
    headerBorder: 'border-l-4 border-l-sky-500 border-sky-200/80 dark:border-sky-900/40',
    headerBg: 'bg-sky-50/70 dark:bg-sky-950/20',
    cardBorderLeft: 'border-l-4 border-l-sky-500',
    dropZoneBg: 'bg-sky-50/30 dark:bg-sky-950/10 border-sky-300/40 dark:border-sky-800/30',
    accentColor: 'text-sky-500',
    accentBg: 'bg-sky-500/10',
    icon: Clock
  },
  low: {
    id: 'low',
    label: 'Low Urgency',
    sublabel: 'Routine maintenance, backlog polish, documentation & post-launch retainers',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    headerBorder: 'border-l-4 border-l-emerald-500 border-emerald-200/80 dark:border-emerald-900/40',
    headerBg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    cardBorderLeft: 'border-l-4 border-l-emerald-500',
    dropZoneBg: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-300/40 dark:border-emerald-800/30',
    accentColor: 'text-emerald-500',
    accentBg: 'bg-emerald-500/10',
    icon: CheckCircle2
  }
};

const TASK_COLUMNS: { id: TaskStatus; label: string; badge: string; stepHint: string }[] = [
  { id: 'todo', label: 'To Do', badge: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300', stepHint: 'Sprint Backlog' },
  { id: 'in_progress', label: 'In Progress', badge: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300', stepHint: 'Active Build' },
  { id: 'review', label: 'Review & QA', badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300', stepHint: 'Staging Audit' },
  { id: 'completed', label: 'Completed', badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300', stepHint: 'Verified & Closed' }
];

export const KanbanTaskSwimlanes: React.FC<KanbanTaskSwimlanesProps> = ({
  projects,
  onOpenTimeTracker,
  onUpdateProject,
  formatMoney = (amt) => `$${amt.toLocaleString()}`
}) => {
  const { showToast, role } = useApp();

  // Filters & View Controls
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cardDensity, setCardDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [sortBy, setSortBy] = useState<'priority' | 'hours_desc' | 'title_asc'>('priority');

  // Collapse/Expand state per swimlane
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<UrgencyLevel, boolean>>({
    critical: false,
    high: false,
    medium: false,
    low: false
  });

  // Drag and Drop tracking
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedTaskProjectId, setDraggedTaskProjectId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<{ urgency: UrgencyLevel; status: TaskStatus } | null>(null);

  // Modals & Drawers
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [modalDefaultUrgency, setModalDefaultUrgency] = useState<UrgencyLevel>('medium');
  const [modalProjectId, setModalProjectId] = useState<string>('');
  const [taskTitleInput, setTaskTitleInput] = useState('');
  const [taskDescInput, setTaskDescInput] = useState('');
  const [taskCategoryInput, setTaskCategoryInput] = useState<TaskCategory>('frontend');
  const [taskEstHoursInput, setTaskEstHoursInput] = useState('4.0');
  const [taskDevInput, setTaskDevInput] = useState('Dev Lead');

  // Inspect / Quick View Task Drawer
  const [viewingTask, setViewingTask] = useState<{ projectId: string; task: ProjectTask; project: ProjectLead } | null>(null);

  // Quick edit task
  const [editingTask, setEditingTask] = useState<{ projectId: string; task: ProjectTask } | null>(null);

  // Aggregated Project Map (with fallback generated default tasks)
  const projectTasksMap = useMemo(() => {
    const map = new Map<string, { project: ProjectLead; tasks: ProjectTask[] }>();
    projects.forEach(project => {
      const currentTasks = (project.tasks && project.tasks.length > 0)
        ? project.tasks
        : generateDefaultTasksForProject(project);
      map.set(project.id, { project, tasks: currentTasks });
    });
    return map;
  }, [projects]);

  // Flattened and Filtered Tasks with Project Reference
  const allFilteredTasks = useMemo(() => {
    const items: Array<{ task: ProjectTask; project: ProjectLead; urgency: UrgencyLevel }> = [];

    projectTasksMap.forEach(({ project, tasks }) => {
      if (selectedProjectId !== 'all' && project.id !== selectedProjectId) {
        return;
      }

      tasks.forEach(task => {
        const urgency = normalizeUrgencyLevel(task.priority);

        // Filter by Urgency
        if (selectedUrgencyFilter !== 'all' && urgency !== selectedUrgencyFilter) {
          return;
        }

        // Filter by Category
        if (selectedCategoryFilter !== 'all' && task.category !== selectedCategoryFilter) {
          return;
        }

        // Filter by Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q);
          const matchClient = project.clientName.toLowerCase().includes(q);
          const matchDev = task.assignedDeveloper?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchClient && !matchDev) {
            return;
          }
        }

        items.push({ task, project, urgency });
      });
    });

    // Sorting
    if (sortBy === 'hours_desc') {
      items.sort((a, b) => (b.task.estimatedHours || 0) - (a.task.estimatedHours || 0));
    } else if (sortBy === 'title_asc') {
      items.sort((a, b) => a.task.title.localeCompare(b.task.title));
    }

    return items;
  }, [projectTasksMap, selectedProjectId, selectedUrgencyFilter, selectedCategoryFilter, searchQuery, sortBy]);

  // Group tasks by Urgency Level and then by Status
  const swimlaneData = useMemo(() => {
    const urgencyOrder: UrgencyLevel[] = ['critical', 'high', 'medium', 'low'];
    
    return urgencyOrder.map(urgency => {
      const tasksInUrgency = allFilteredTasks.filter(item => item.urgency === urgency);
      
      const columnGroups: Record<TaskStatus, Array<{ task: ProjectTask; project: ProjectLead }>> = {
        todo: [],
        in_progress: [],
        review: [],
        completed: []
      };

      tasksInUrgency.forEach(({ task, project }) => {
        if (columnGroups[task.status]) {
          columnGroups[task.status].push({ task, project });
        } else {
          columnGroups.todo.push({ task, project });
        }
      });

      const totalEstHours = tasksInUrgency.reduce((acc, curr) => acc + (curr.task.estimatedHours || 0), 0);
      const totalLoggedHours = tasksInUrgency.reduce((acc, curr) => acc + (curr.task.loggedHours || 0), 0);
      const completedCount = columnGroups.completed.length;
      const completionPercent = tasksInUrgency.length > 0 ? Math.round((completedCount / tasksInUrgency.length) * 100) : 0;

      return {
        config: URGENCY_CONFIGS[urgency],
        urgency,
        tasks: tasksInUrgency,
        columnGroups,
        totalEstHours,
        totalLoggedHours,
        completedCount,
        completionPercent,
        isCollapsed: !!collapsedSwimlanes[urgency]
      };
    });
  }, [allFilteredTasks, collapsedSwimlanes]);

  // Overall Board Metrics
  const boardMetrics = useMemo(() => {
    let totalAll = 0;
    let criticalAll = 0;
    let highAll = 0;
    let mediumAll = 0;
    let lowAll = 0;

    projectTasksMap.forEach(({ tasks }) => {
      tasks.forEach(t => {
        totalAll++;
        const u = normalizeUrgencyLevel(t.priority);
        if (u === 'critical') criticalAll++;
        else if (u === 'high') highAll++;
        else if (u === 'medium') mediumAll++;
        else if (u === 'low') lowAll++;
      });
    });

    const visibleTotal = allFilteredTasks.length;
    const inProgress = allFilteredTasks.filter(t => t.task.status === 'in_progress').length;
    const completed = allFilteredTasks.filter(t => t.task.status === 'completed').length;
    const totalEst = allFilteredTasks.reduce((acc, curr) => acc + (curr.task.estimatedHours || 0), 0);
    const totalLogged = allFilteredTasks.reduce((acc, curr) => acc + (curr.task.loggedHours || 0), 0);

    return {
      totalAll,
      criticalAll,
      highAll,
      mediumAll,
      lowAll,
      visibleTotal,
      inProgress,
      completed,
      totalEst,
      totalLogged
    };
  }, [projectTasksMap, allFilteredTasks]);

  // Toggle Collapse of a Swimlane
  const toggleSwimlaneCollapse = (urgency: UrgencyLevel) => {
    setCollapsedSwimlanes(prev => ({
      ...prev,
      [urgency]: !prev[urgency]
    }));
  };

  // Toggle All Swimlanes
  const toggleAllSwimlanes = (collapse: boolean) => {
    setCollapsedSwimlanes({
      critical: collapse,
      high: collapse,
      medium: collapse,
      low: collapse
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string, projectId: string) => {
    setDraggedTaskId(taskId);
    setDraggedTaskProjectId(projectId);
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, projectId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDraggedTaskProjectId(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, urgency: UrgencyLevel, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!activeDropZone || activeDropZone.urgency !== urgency || activeDropZone.status !== status) {
      setActiveDropZone({ urgency, status });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setActiveDropZone(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetUrgency: UrgencyLevel, targetStatus: TaskStatus) => {
    e.preventDefault();
    setActiveDropZone(null);

    let taskId = draggedTaskId;
    let projectId = draggedTaskProjectId;

    if (!taskId || !projectId) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          taskId = parsed.taskId;
          projectId = parsed.projectId;
        }
      } catch {
        return;
      }
    }

    if (!taskId || !projectId) return;

    const projectData = projectTasksMap.get(projectId);
    if (!projectData) return;

    const existingTask = projectData.tasks.find(t => t.id === taskId);
    if (!existingTask) return;

    const targetPriority: TaskPriority = targetUrgency === 'critical' ? 'critical' : targetUrgency;
    const currentUrgency = normalizeUrgencyLevel(existingTask.priority);

    if (existingTask.status === targetStatus && currentUrgency === targetUrgency) {
      return;
    }

    const updatedTasks: ProjectTask[] = projectData.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: targetStatus,
          priority: targetPriority,
          completedAt: targetStatus === 'completed' ? (t.completedAt || new Date().toISOString()) : undefined
        };
      }
      return t;
    });

    await onUpdateProject(projectId, { tasks: updatedTasks });
    showToast(
      `Task moved to ${URGENCY_CONFIGS[targetUrgency].label} · ${TASK_COLUMNS.find(c => c.id === targetStatus)?.label}`,
      'success'
    );
  };

  // Quick Urgency changer on card
  const handleQuickChangeUrgency = async (projectId: string, taskId: string, newUrgency: UrgencyLevel) => {
    const projectData = projectTasksMap.get(projectId);
    if (!projectData) return;

    const targetPriority: TaskPriority = newUrgency === 'critical' ? 'critical' : newUrgency;
    const updatedTasks = projectData.tasks.map(t => 
      t.id === taskId ? { ...t, priority: targetPriority } : t
    );

    await onUpdateProject(projectId, { tasks: updatedTasks });
    showToast(`Prioritized to ${URGENCY_CONFIGS[newUrgency].label}`, 'info');
  };

  // Quick Status changer on card
  const handleQuickChangeStatus = async (projectId: string, taskId: string, newStatus: TaskStatus) => {
    const projectData = projectTasksMap.get(projectId);
    if (!projectData) return;

    const updatedTasks = projectData.tasks.map(t => 
      t.id === taskId ? {
        ...t, 
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
      } : t
    );

    await onUpdateProject(projectId, { tasks: updatedTasks });
    showToast(`Status updated to ${TASK_COLUMNS.find(c => c.id === newStatus)?.label}`, 'success');
  };

  // Delete Task
  const handleDeleteTask = async (projectId: string, taskId: string) => {
    const projectData = projectTasksMap.get(projectId);
    if (!projectData) return;

    const updatedTasks = projectData.tasks.filter(t => t.id !== taskId);
    await onUpdateProject(projectId, { tasks: updatedTasks });
    showToast('Task removed from sprint.', 'info');
  };

  // Open Add Task Modal pre-configured for a swimlane
  const openAddTaskModal = (urgency: UrgencyLevel) => {
    setModalDefaultUrgency(urgency);
    setModalProjectId(selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id || ''));
    setTaskTitleInput('');
    setTaskDescInput('');
    setTaskCategoryInput('frontend');
    setTaskEstHoursInput('4.0');
    setTaskDevInput('Dev Lead');
    setIsNewTaskModalOpen(true);
  };

  // Submit Add Task Modal
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitleInput.trim() || !modalProjectId) return;

    const projectData = projectTasksMap.get(modalProjectId);
    if (!projectData) return;

    const newTask: ProjectTask = {
      id: `task-${modalProjectId}-${Date.now()}`,
      projectId: modalProjectId,
      title: taskTitleInput.trim(),
      description: taskDescInput.trim() || undefined,
      status: 'todo',
      priority: modalDefaultUrgency === 'critical' ? 'critical' : modalDefaultUrgency,
      category: taskCategoryInput,
      assignedDeveloper: taskDevInput.trim() || 'Dev Lead',
      estimatedHours: parseFloat(taskEstHoursInput) || 4.0,
      loggedHours: 0,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [newTask, ...projectData.tasks];
    await onUpdateProject(modalProjectId, { tasks: updatedTasks });
    setIsNewTaskModalOpen(false);
    showToast(`Task created under ${URGENCY_CONFIGS[modalDefaultUrgency].label}!`, 'success');
  };

  // Submit Edit Task
  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.task.title.trim()) return;

    const projectData = projectTasksMap.get(editingTask.projectId);
    if (!projectData) return;

    const updatedTasks = projectData.tasks.map(t => 
      t.id === editingTask.task.id ? editingTask.task : t
    );

    await onUpdateProject(editingTask.projectId, { tasks: updatedTasks });
    setEditingTask(null);
    showToast('Task updated successfully.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP STATS RIBBON & CONTROLS BAR */}
      <div className="rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-xs space-y-4">
        
        {/* Top Header Row with Title & Quick Action Chips */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FolderKanban className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                Kanban Swimlanes · Urgency Prioritization
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5">
                {boardMetrics.visibleTotal} of {boardMetrics.totalAll} Tasks Visible
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag tasks vertically across status columns or horizontally between Urgency Swimlanes to dynamically reprioritize delivery blockers.
            </p>
          </div>

          {/* Quick Urgency Filter Chips (Clickable with Live Badges) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedUrgencyFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedUrgencyFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] font-mono font-bold opacity-80">({boardMetrics.totalAll})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUrgencyFilter(selectedUrgencyFilter === 'critical' ? 'all' : 'critical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedUrgencyFilter === 'critical'
                  ? 'bg-rose-500 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Critical</span>
              <span className="text-[10px] font-mono font-bold">({boardMetrics.criticalAll})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUrgencyFilter(selectedUrgencyFilter === 'high' ? 'all' : 'high')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedUrgencyFilter === 'high'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>High</span>
              <span className="text-[10px] font-mono font-bold">({boardMetrics.highAll})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUrgencyFilter(selectedUrgencyFilter === 'medium' ? 'all' : 'medium')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedUrgencyFilter === 'medium'
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xs ring-2 ring-sky-500/20'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20'
              }`}
            >
              <Clock className="w-3 h-3 text-sky-500" />
              <span>Medium</span>
              <span className="text-[10px] font-mono font-bold">({boardMetrics.mediumAll})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUrgencyFilter(selectedUrgencyFilter === 'low' ? 'all' : 'low')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                selectedUrgencyFilter === 'low'
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Low</span>
              <span className="text-[10px] font-mono font-bold">({boardMetrics.lowAll})</span>
            </button>
          </div>
        </div>

        {/* Filters, Search, Density & Actions Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks, descriptions, devs, clients..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project & Category Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="all">📁 All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.clientName} ({p.websiteType})
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
            >
              <option value="all">🏷️ All Categories</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="devops">DevOps &amp; DNS</option>
              <option value="qa">QA &amp; Audit</option>
              <option value="design">Design &amp; UI</option>
              <option value="content">Content</option>
            </select>

            {/* Density Selector */}
            <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={() => setCardDensity('comfortable')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  cardDensity === 'comfortable'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Comfortable Density (full details & progress bars)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCardDensity('compact')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  cardDensity === 'compact'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Compact Density (dense cards for broad view)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expand / Collapse All Swimlanes */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(false)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Expand all urgency swimlanes"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => toggleAllSwimlanes(true)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Collapse all urgency swimlanes"
              >
                Collapse
              </button>
            </div>

            {/* New Task Button */}
            {role !== 'collaborator' && (
              <button
                type="button"
                onClick={() => openAddTaskModal('medium')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. GLOBAL COLUMN HEADERS (Shared across all horizontal swimlanes) */}
      <div className="hidden md:grid md:grid-cols-4 gap-3 px-3">
        {TASK_COLUMNS.map(col => {
          const countInColumn = allFilteredTasks.filter(item => item.task.status === col.id).length;
          const percentOfTotal = boardMetrics.visibleTotal > 0
            ? Math.round((countInColumn / boardMetrics.visibleTotal) * 100)
            : 0;

          return (
            <div
              key={col.id}
              className="flex items-center justify-between pb-2 border-b-2 border-slate-200 dark:border-white/10 px-1"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {col.label}
                </span>
                <p className="text-[10px] text-slate-400 font-medium">
                  {col.stepHint}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {countInColumn}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {percentOfTotal}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. HORIZONTAL SWIMLANES LIST */}
      <div className="space-y-4">
        {swimlaneData.map(lane => {
          const UrgencyIcon = lane.config.icon;

          return (
            <div
              key={lane.urgency}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                lane.config.headerBorder
              } bg-white dark:bg-slate-900/80`}
            >
              {/* SWIMLANE HEADER BAR WITH COMPLETION METER */}
              <div
                onClick={() => toggleSwimlaneCollapse(lane.urgency)}
                className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                  lane.config.headerBg
                } hover:opacity-95`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    aria-label={`Toggle ${lane.config.label} swimlane`}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    {lane.isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  <div className={`p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-2xs ${lane.config.accentColor}`}>
                    <UrgencyIcon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {lane.config.label}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${lane.config.badgeClass}`}>
                        {lane.tasks.length} {lane.tasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {lane.totalLoggedHours.toFixed(1)}h logged / {lane.totalEstHours.toFixed(1)}h est
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                      {lane.config.sublabel}
                    </p>
                  </div>
                </div>

                {/* Right Side: Completion Progress & Quick Add Task */}
                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Completion Meter */}
                  <div className="hidden lg:flex items-center gap-2 text-right">
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{lane.completedCount}</span>/{lane.tasks.length} completed
                    </div>
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          lane.completionPercent >= 100
                            ? 'bg-emerald-500'
                            : lane.completionPercent > 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${lane.completionPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {lane.completionPercent}%
                    </span>
                  </div>

                  {role !== 'collaborator' && (
                    <button
                      type="button"
                      onClick={() => openAddTaskModal(lane.urgency)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs transition"
                      title={`Add task directly to ${lane.config.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add Task</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SWIMLANE BODY: 4 VERTICAL STATUS COLUMNS */}
              <AnimatePresence initial={false}>
                {!lane.isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-3 border-t border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {TASK_COLUMNS.map(col => {
                          const tasksInCell = lane.columnGroups[col.id] || [];
                          const isTarget =
                            activeDropZone?.urgency === lane.urgency &&
                            activeDropZone?.status === col.id;

                          return (
                            <div
                              key={col.id}
                              onDragOver={e => handleDragOver(e, lane.urgency, col.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={e => handleDrop(e, lane.urgency, col.id)}
                              className={`rounded-xl p-2.5 min-h-[140px] flex flex-col justify-between transition-all duration-150 border ${
                                isTarget
                                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-inner'
                                  : 'border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/40'
                              }`}
                            >
                              {/* Mobile Column Label */}
                              <div className="flex md:hidden items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-white/10">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                  {col.label}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${col.badge}`}>
                                  {tasksInCell.length}
                                </span>
                              </div>

                              {/* Task Cards in this Cell */}
                              <div className="space-y-2 flex-1">
                                {tasksInCell.length === 0 ? (
                                  <div
                                    className={`h-full min-h-[80px] rounded-lg border border-dashed flex flex-col items-center justify-center p-3 text-center transition-colors ${
                                      isTarget
                                        ? 'border-indigo-400 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                                        : 'border-slate-200/80 dark:border-white/5 text-slate-400 dark:text-slate-600'
                                    }`}
                                  >
                                    <p className="text-[11px] font-medium">
                                      {isTarget ? 'Drop task here' : 'No tasks in this stage'}
                                    </p>
                                  </div>
                                ) : (
                                  tasksInCell.map(({ task, project }) => {
                                    const isDragging = draggedTaskId === task.id;
                                    const percent =
                                      task.estimatedHours > 0
                                        ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
                                        : 0;

                                    return (
                                      <motion.div
                                        layout
                                        key={task.id}
                                        draggable={role !== 'collaborator'}
                                        onDragStart={e => handleDragStart(e as unknown as React.DragEvent, task.id, project.id)}
                                        onDragEnd={handleDragEnd}
                                        whileHover={{ y: -1 }}
                                        className={`rounded-xl border transition-all duration-150 select-none ${
                                          lane.config.cardBorderLeft
                                        } ${
                                          cardDensity === 'comfortable' ? 'p-3 space-y-2.5' : 'p-2 space-y-1.5'
                                        } ${
                                          role !== 'collaborator' ? 'cursor-grab active:cursor-grabbing' : ''
                                        } ${
                                          isDragging
                                            ? 'opacity-40 border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/30'
                                            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-white/10 hover:border-indigo-500/40 shadow-2xs hover:shadow-xs'
                                        }`}
                                      >
                                        {/* Task Top Meta: Project & Category */}
                                        <div className="flex items-start justify-between gap-1.5">
                                          <div className="flex items-center gap-1 flex-wrap min-w-0">
                                            {role !== 'collaborator' && (
                                              <span
                                                className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 cursor-grab"
                                                title="Drag task between stages or urgency swimlanes"
                                              >
                                                <GripVertical className="w-3.5 h-3.5" />
                                              </span>
                                            )}
                                            <span
                                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]"
                                              title={`Project: ${project.clientName}`}
                                            >
                                              {project.clientName}
                                            </span>
                                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300">
                                              {task.category}
                                            </span>
                                          </div>

                                          {/* Urgency Selector Dropdown */}
                                          <select
                                            value={normalizeUrgencyLevel(task.priority)}
                                            onChange={e => handleQuickChangeUrgency(project.id, task.id, e.target.value as UrgencyLevel)}
                                            className={`text-[9px] font-bold uppercase rounded px-1 py-0.5 border cursor-pointer ${
                                              lane.config.badgeClass
                                            } bg-transparent focus:outline-none`}
                                            title="Change Urgency Level"
                                          >
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                          </select>
                                        </div>

                                        {/* Task Title & Description */}
                                        <div>
                                          <h5
                                            onClick={() => setViewingTask({ projectId: project.id, task, project })}
                                            className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                          >
                                            {task.title}
                                          </h5>
                                          {cardDensity === 'comfortable' && task.description && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>

                                        {/* Hours Progress Bar (in Comfortable Mode) */}
                                        {cardDensity === 'comfortable' && (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                              <span>{task.loggedHours.toFixed(1)}h / {task.estimatedHours.toFixed(1)}h</span>
                                              <span className={percent >= 100 ? 'text-emerald-500 font-bold' : ''}>
                                                {percent}%
                                              </span>
                                            </div>
                                            <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                  percent >= 100
                                                    ? 'bg-emerald-500'
                                                    : percent > 75
                                                    ? 'bg-amber-500'
                                                    : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${Math.min(100, percent)}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {/* Assignee & Action Buttons */}
                                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-white/5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                                              {(task.assignedDeveloper || 'DL').substring(0, 2).toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[85px]">
                                              {task.assignedDeveloper || 'Dev Lead'}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Inspect / Quick View Button */}
                                            <button
                                              type="button"
                                              onClick={() => setViewingTask({ projectId: project.id, task, project })}
                                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                              title="Inspect task details"
                                            >
                                              <Eye className="w-3 h-3" />
                                            </button>

                                            {/* Timer shortcut */}
                                            {onOpenTimeTracker && (
                                              <button
                                                type="button"
                                                onClick={() => onOpenTimeTracker(project, task.id)}
                                                className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                                title="Start live stopwatch timer for this task"
                                              >
                                                <Play className="w-3 h-3" />
                                              </button>
                                            )}

                                            {/* Quick Status Advance / Complete */}
                                            {task.status !== 'completed' ? (
                                              <button
                                                type="button"
                                                onClick={() => handleQuickChangeStatus(project.id, task.id, 'completed')}
                                                className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                                                title="Mark task as Completed"
                                              >
                                                <Check className="w-3 h-3" />
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleQuickChangeStatus(project.id, task.id, 'in_progress')}
                                                className="p-1 rounded text-emerald-500 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                                title="Reopen task to In Progress"
                                              >
                                                <CheckCircle2 className="w-3 h-3" />
                                              </button>
                                            )}

                                            {/* Edit Task */}
                                            {role !== 'collaborator' && (
                                              <button
                                                type="button"
                                                onClick={() => setEditingTask({ projectId: project.id, task: { ...task } })}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                                                title="Edit task details"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                            )}

                                            {/* Delete Task */}
                                            {role !== 'collaborator' && (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteTask(project.id, task.id)}
                                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                                title="Delete task"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 4. TASK DETAIL QUICK-INSPECT DRAWER */}
      <AnimatePresence>
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${URGENCY_CONFIGS[normalizeUrgencyLevel(viewingTask.task.priority)].badgeClass}`}>
                      {URGENCY_CONFIGS[normalizeUrgencyLevel(viewingTask.task.priority)].label}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {viewingTask.task.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {viewingTask.task.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task Details Body */}
              <div className="space-y-3 text-xs">
                {viewingTask.task.description && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Description &amp; Acceptance Notes
                    </span>
                    <p>{viewingTask.task.description}</p>
                  </div>
                )}

                {/* Project Info Pill */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Client Project</span>
                    <p className="font-bold text-slate-900 dark:text-white">{viewingTask.project.clientName}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{viewingTask.project.websiteType} Website</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Stage &amp; Gate</span>
                    <p className="font-bold text-slate-900 dark:text-white capitalize">{viewingTask.task.status.replace('_', ' ')}</p>
                    <p className="text-[11px] text-indigo-500 font-mono font-bold">${viewingTask.project.finalPrice}</p>
                  </div>
                </div>

                {/* Time & Developer Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Estimated</span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {viewingTask.task.estimatedHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Logged</span>
                    <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {viewingTask.task.loggedHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Assigned Dev</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {viewingTask.task.assignedDeveloper || 'Dev Lead'}
                    </p>
                  </div>
                </div>

                {/* Status Switcher Bar */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Transition Stage
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TASK_COLUMNS.map(col => {
                      const isActive = viewingTask.task.status === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            handleQuickChangeStatus(viewingTask.projectId, viewingTask.task.id, col.id);
                            setViewingTask({
                              ...viewingTask,
                              task: { ...viewingTask.task, status: col.id }
                            });
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50'
                          }`}
                        >
                          {col.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                {onOpenTimeTracker && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenTimeTracker(viewingTask.project, viewingTask.task.id);
                      setViewingTask(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Timer</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask({ projectId: viewingTask.projectId, task: { ...viewingTask.task } });
                      setViewingTask(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Edit Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingTask(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. NEW TASK MODAL */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Plus className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Create New Sprint Task
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add to {URGENCY_CONFIGS[modalDefaultUrgency].label}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Project Lead
                  </label>
                  <select
                    value={modalProjectId}
                    onChange={e => setModalProjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.clientName} ({p.websiteType} - ${p.finalPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Level (Swimlane)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['critical', 'high', 'medium', 'low'] as UrgencyLevel[]).map(lvl => {
                      const cfg = URGENCY_CONFIGS[lvl];
                      const isSelected = modalDefaultUrgency === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setModalDefaultUrgency(lvl)}
                          className={`p-2 rounded-xl border text-center transition ${
                            isSelected
                              ? `${cfg.badgeClass} ring-2 ring-indigo-500/30 font-bold`
                              : 'border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="block text-xs font-extrabold capitalize">{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitleInput}
                    onChange={e => setTaskTitleInput(e.target.value)}
                    placeholder="e.g., Step 8: Configure Stripe webhook endpoints & SSL"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description &amp; Acceptance Criteria (Optional)
                  </label>
                  <textarea
                    value={taskDescInput}
                    onChange={e => setTaskDescInput(e.target.value)}
                    placeholder="Provide technical specs, deliverable details, or SOP gate checks..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={taskCategoryInput}
                      onChange={e => setTaskCategoryInput(e.target.value as TaskCategory)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="devops">DevOps &amp; DNS</option>
                      <option value="qa">QA &amp; Audit</option>
                      <option value="design">Design</option>
                      <option value="content">Content</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Assigned Dev
                    </label>
                    <input
                      type="text"
                      value={taskDevInput}
                      onChange={e => setTaskDevInput(e.target.value)}
                      placeholder="Dev Lead"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Est. Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={taskEstHoursInput}
                      onChange={e => setTaskEstHoursInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsNewTaskModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Add Task to Swimlane
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. EDIT TASK MODAL */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Edit2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Edit Task Details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {editingTask.task.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditTask} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={editingTask.task.title}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, title: e.target.value }
                    })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingTask.task.description || ''}
                    onChange={e => setEditingTask({
                      ...editingTask,
                      task: { ...editingTask.task, description: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={normalizeUrgencyLevel(editingTask.task.priority)}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        task: { ...editingTask.task, priority: e.target.value as TaskPriority }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                    >
                      <option value="critical">🔴 Critical Urgency</option>
                      <option value="high">🟠 High Urgency</option>
                      <option value="medium">🔵 Medium Urgency</option>
                      <option value="low">🟢 Low Urgency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status Stage
                    </label>
                    <select
                      value={editingTask.task.status}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        task: { ...editingTask.task, status: e.target.value as TaskStatus }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review &amp; QA</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={editingTask.task.category}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        task: { ...editingTask.task, category: e.target.value as TaskCategory }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="devops">DevOps &amp; DNS</option>
                      <option value="qa">QA &amp; Audit</option>
                      <option value="design">Design</option>
                      <option value="content">Content</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Developer
                    </label>
                    <input
                      type="text"
                      value={editingTask.task.assignedDeveloper || ''}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        task: { ...editingTask.task, assignedDeveloper: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Est. Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={editingTask.task.estimatedHours}
                      onChange={e => setEditingTask({
                        ...editingTask,
                        task: { ...editingTask.task, estimatedHours: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
