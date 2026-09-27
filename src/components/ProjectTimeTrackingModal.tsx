import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProjectLead, ProjectTask, ProjectTimeLog, TaskPriority, TaskStatus, TaskCategory } from '../types';
import { useApp } from '../context/AppContext';
import { generateDefaultTasksForProject, generateDefaultTimeLogsForProject } from '../lib/timeTrackingDefaults';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Layers,
  ChevronDown,
  Sparkles,
  Timer as TimerIcon,
  X,
  Tag,
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectTimeTrackingModalProps {
  project: ProjectLead | null;
  isOpen: boolean;
  onClose: () => void;
  initialTaskId?: string;
  initialTab?: 'tasks' | 'timer' | 'manual' | 'logs';
}

export const ProjectTimeTrackingModal: React.FC<ProjectTimeTrackingModalProps> = ({
  project,
  isOpen,
  onClose,
  initialTaskId,
  initialTab = 'tasks'
}) => {
  const { updateProject, showToast, currentUser, role, formatMoney } = useApp();

  const [activeTab, setActiveTab] = useState<'tasks' | 'timer' | 'manual' | 'logs'>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  // Tasks state
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [timeLogs, setTimeLogs] = useState<ProjectTimeLog[]>([]);

  // Task creation state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('frontend');
  const [newTaskEstHours, setNewTaskEstHours] = useState('4.0');
  const [newTaskDev, setNewTaskDev] = useState('');

  // Manual Log state
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState('1.5');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualNotes, setManualNotes] = useState('');
  const [manualBillable, setManualBillable] = useState(true);
  const [manualHourlyRate, setManualHourlyRate] = useState('45');
  const [manualDevName, setManualDevName] = useState('');

  // Live Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerTaskId, setTimerTaskId] = useState('');
  const [timerNotes, setTimerNotes] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  const [timerHourlyRate, setTimerHourlyRate] = useState('45');
  const [timerDevName, setTimerDevName] = useState('');
  const timerIntervalRef = useRef<any>(null);

  // Filter state for logs tab
  const [logFilterDev, setLogFilterDev] = useState<string>('all');
  const [logFilterBillable, setLogFilterBillable] = useState<string>('all');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Initialize data on project change
  useEffect(() => {
    if (!project) return;

    // Load or generate default tasks
    let currentTasks = project.tasks && project.tasks.length > 0
      ? project.tasks
      : generateDefaultTasksForProject(project);

    // Load or generate default logs
    let currentLogs = project.timeLogs && project.timeLogs.length > 0
      ? project.timeLogs
      : generateDefaultTimeLogsForProject(project, currentTasks);

    setTasks(currentTasks);
    setTimeLogs(currentLogs);

    // Default developer name to current user or active developer
    const defaultDev = currentUser?.name || (role === 'developer' ? 'Alex Rivera' : 'Dev Lead');
    setManualDevName(defaultDev);
    setTimerDevName(defaultDev);
    setNewTaskDev(defaultDev);

    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
      setTimerTaskId(initialTaskId);
      setManualTaskId(initialTaskId);
    } else if (currentTasks.length > 0) {
      const activeTask = currentTasks.find(t => t.status === 'in_progress') || currentTasks[0];
      setSelectedTaskId(activeTask.id);
      setTimerTaskId(activeTask.id);
      setManualTaskId(activeTask.id);
    }

    if (initialTab) {
      setActiveTab(initialTab);
    }

    // Check for saved running timer for this project
    const savedTimer = localStorage.getItem(`active_timer_${project.id}`);
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        if (parsed.startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - parsed.startTime) / 1000) + (parsed.accumulatedSeconds || 0);
          setTimerSeconds(elapsed);
          setIsTimerRunning(parsed.isRunning);
          if (parsed.taskId) setTimerTaskId(parsed.taskId);
          if (parsed.notes) setTimerNotes(parsed.notes);
          if (parsed.billable !== undefined) setTimerBillable(parsed.billable);
        }
      } catch (e) {
        console.warn('Error reading saved timer', e);
      }
    }
  }, [project, initialTaskId, initialTab, currentUser, role]);

  // Live Timer Interval
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Persist timer state to localStorage
  useEffect(() => {
    if (!project) return;
    if (isTimerRunning || timerSeconds > 0) {
      const state = {
        projectId: project.id,
        taskId: timerTaskId,
        taskTitle: tasks.find(t => t.id === timerTaskId)?.title || 'General Task',
        startTime: isTimerRunning ? Date.now() - timerSeconds * 1000 : null,
        accumulatedSeconds: timerSeconds,
        isRunning: isTimerRunning,
        notes: timerNotes,
        billable: timerBillable,
        developerName: timerDevName
      };
      localStorage.setItem(`active_timer_${project.id}`, JSON.stringify(state));
      localStorage.setItem('global_active_timer', JSON.stringify({ ...state, projectName: project.clientName }));
    } else {
      localStorage.removeItem(`active_timer_${project.id}`);
      const globalTimer = localStorage.getItem('global_active_timer');
      if (globalTimer) {
        try {
          const parsed = JSON.parse(globalTimer);
          if (parsed.projectId === project.id) {
            localStorage.removeItem('global_active_timer');
          }
        } catch (e) {}
      }
    }
  }, [isTimerRunning, timerSeconds, timerTaskId, timerNotes, timerBillable, timerDevName, project, tasks]);

  // Format seconds into HH:MM:SS
  const formatTimerDigits = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      formatted: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    };
  };

  // Metrics computations
  const metrics = useMemo(() => {
    const totalEstHours = tasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
    const totalLoggedHours = tasks.reduce((sum, t) => sum + (Number(t.loggedHours) || 0), 0);
    const billableHours = timeLogs
      .filter(l => l.billable)
      .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);
    
    const totalDevCost = timeLogs.reduce((sum, l) => {
      const rate = Number(l.hourlyRate) || 45;
      return sum + (Number(l.hours) || 0) * rate;
    }, 0);

    const projectPrice = project?.finalPrice || 0;
    const grossMargin = projectPrice - totalDevCost;
    const grossMarginPercent = projectPrice > 0 ? Math.round((grossMargin / projectPrice) * 100) : 0;
    const progressPercent = totalEstHours > 0 ? Math.min(Math.round((totalLoggedHours / totalEstHours) * 100), 100) : 0;

    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

    return {
      totalEstHours,
      totalLoggedHours,
      billableHours,
      totalDevCost,
      projectPrice,
      grossMargin,
      grossMarginPercent,
      progressPercent,
      completedTasksCount,
      totalTasksCount: tasks.length
    };
  }, [tasks, timeLogs, project]);

  // Save changes to project state and Firestore
  const persistChanges = async (newTasks: ProjectTask[], newLogs: ProjectTimeLog[]) => {
    if (!project) return;
    setTasks(newTasks);
    setTimeLogs(newLogs);
    await updateProject(project.id, {
      tasks: newTasks,
      timeLogs: newLogs
    });
  };

  // Add Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${project.id}-${Date.now().toString(36)}`,
      projectId: project.id,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      status: 'in_progress',
      priority: newTaskPriority,
      category: newTaskCategory,
      assignedDeveloper: newTaskDev.trim() || currentUser?.name || 'Developer',
      assignedDeveloperAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newTaskDev || 'Dev')}`,
      estimatedHours: parseFloat(newTaskEstHours) || 4.0,
      loggedHours: 0,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, newTask];
    await persistChanges(updatedTasks, timeLogs);

    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsAddingTask(false);
    showToast(`Task "${newTask.title}" added to active sprint.`);
  };

  // Update Task Status
  const handleToggleTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return t;
    });

    await persistChanges(updatedTasks, timeLogs);
    showToast(`Task status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await persistChanges(updatedTasks, timeLogs);
    showToast('Task removed from project.');
  };

  // Load Standard SOP Tasks
  const handleLoadStandardTasks = async () => {
    if (!project) return;
    const standardTasks = generateDefaultTasksForProject(project);
    const standardLogs = generateDefaultTimeLogsForProject(project, standardTasks);
    await persistChanges(standardTasks, standardLogs);
    showToast('Standard SOP sprint tasks and verification logs loaded.');
  };

  // Commit Time from Live Timer
  const handleStopAndLogTimer = async () => {
    if (!project || timerSeconds < 60) {
      if (timerSeconds < 60) {
        showToast('Timer must run for at least 1 minute to log time.', 'warning');
      }
      return;
    }

    const elapsedHours = Number((timerSeconds / 3600).toFixed(2));
    const durationMins = Math.round(timerSeconds / 60);

    const task = tasks.find(t => t.id === timerTaskId) || tasks[0];
    const taskTitle = task ? task.title : 'General Development & QA';

    const newLog: ProjectTimeLog = {
      id: `log-${project.id}-${Date.now().toString(36)}`,
      projectId: project.id,
      taskId: task ? task.id : 'general',
      taskTitle,
      developerName: timerDevName || currentUser?.name || 'Developer',
      developerEmail: currentUser?.email || 'dev@agencyops.dev',
      developerAvatar: currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(timerDevName || 'Dev')}`,
      hours: elapsedHours,
      durationMinutes: durationMins,
      date: new Date().toISOString().split('T')[0],
      loggedAt: new Date().toISOString(),
      billable: timerBillable,
      hourlyRate: parseFloat(timerHourlyRate) || 45,
      notes: timerNotes.trim() || `Live session tracked on: ${taskTitle}`
    };

    // Increment task's loggedHours
    const updatedTasks = tasks.map(t => {
      if (task && t.id === task.id) {
        return {
          ...t,
          loggedHours: Number(((Number(t.loggedHours) || 0) + elapsedHours).toFixed(2))
        };
      }
      return t;
    });

    const updatedLogs = [newLog, ...timeLogs];

    // Reset timer
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerNotes('');
    localStorage.removeItem(`active_timer_${project.id}`);
    localStorage.removeItem('global_active_timer');

    await persistChanges(updatedTasks, updatedLogs);
    showToast(`Logged ${elapsedHours}h (${durationMins}m) against "${taskTitle}"!`);
    setActiveTab('logs');
  };

  // Manual Time Log Commit
  const handleManualTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const parsedHours = parseFloat(manualHours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      showToast('Please enter a valid positive number of hours.', 'error');
      return;
    }

    const task = tasks.find(t => t.id === manualTaskId) || tasks[0];
    const taskTitle = task ? task.title : 'General Engineering Sprint';

    const newLog: ProjectTimeLog = {
      id: `log-${project.id}-${Date.now().toString(36)}`,
      projectId: project.id,
      taskId: task ? task.id : 'general',
      taskTitle,
      developerName: manualDevName.trim() || currentUser?.name || 'Developer',
      developerEmail: currentUser?.email || 'dev@agencyops.dev',
      developerAvatar: currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(manualDevName || 'Dev')}`,
      hours: parsedHours,
      durationMinutes: Math.round(parsedHours * 60),
      date: manualDate,
      loggedAt: new Date().toISOString(),
      billable: manualBillable,
      hourlyRate: parseFloat(manualHourlyRate) || 45,
      notes: manualNotes.trim() || `Manual work entry logged for ${taskTitle}`
    };

    // Increment task loggedHours
    const updatedTasks = tasks.map(t => {
      if (task && t.id === task.id) {
        return {
          ...t,
          loggedHours: Number(((Number(t.loggedHours) || 0) + parsedHours).toFixed(2))
        };
      }
      return t;
    });

    const updatedLogs = [newLog, ...timeLogs];
    await persistChanges(updatedTasks, updatedLogs);

    setManualHours('1.5');
    setManualNotes('');
    showToast(`Logged ${parsedHours} hours for ${newLog.developerName}.`);
    setActiveTab('logs');
  };

  // Delete a logged entry
  const handleDeleteLog = async (logId: string) => {
    const logToDelete = timeLogs.find(l => l.id === logId);
    if (!logToDelete) return;

    // Decrement from task loggedHours
    const updatedTasks = tasks.map(t => {
      if (t.id === logToDelete.taskId) {
        return {
          ...t,
          loggedHours: Math.max(0, Number(((Number(t.loggedHours) || 0) - logToDelete.hours).toFixed(2)))
        };
      }
      return t;
    });

    const updatedLogs = timeLogs.filter(l => l.id !== logId);
    await persistChanges(updatedTasks, updatedLogs);
    showToast('Time entry deleted.');
  };

  // Export Timesheet CSV
  const handleExportCSV = () => {
    if (!project || timeLogs.length === 0) {
      showToast('No time logs available to export.', 'warning');
      return;
    }

    const headers = ['Date', 'Developer', 'Task', 'Hours', 'Duration (Min)', 'Billable', 'Hourly Rate ($)', 'Cost ($)', 'Notes'];
    const rows = timeLogs.map(l => [
      l.date,
      `"${l.developerName.replace(/"/g, '""')}"`,
      `"${l.taskTitle.replace(/"/g, '""')}"`,
      l.hours,
      l.durationMinutes,
      l.billable ? 'YES' : 'NO',
      l.hourlyRate || 45,
      (l.hours * (l.hourlyRate || 45)).toFixed(2),
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${project.clientName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Timesheet CSV downloaded.');
  };

  // Copy Timesheet Summary to Clipboard
  const handleCopySummary = () => {
    if (!project) return;
    const summary = [
      `⏱️ PROJECT TIMESHEET SUMMARY: ${project.clientName}`,
      `Website Type: ${project.websiteType.toUpperCase()} | Agreed Price: $${project.finalPrice}`,
      `Total Logged: ${metrics.totalLoggedHours.toFixed(1)}h / Estimated: ${metrics.totalEstHours.toFixed(1)}h (${metrics.progressPercent}%)`,
      `Billable Hours: ${metrics.billableHours.toFixed(1)}h | Dev Cost: $${metrics.totalDevCost.toFixed(2)}`,
      `Gross Profit Margin: $${metrics.grossMargin.toFixed(2)} (${metrics.grossMarginPercent}%)`,
      ``,
      `ACTIVE TASKS BURNDOWN (${metrics.completedTasksCount}/${metrics.totalTasksCount} Completed):`,
      ...tasks.map(t => `• [${t.status.toUpperCase()}] ${t.title} (${t.loggedHours}h / ${t.estimatedHours}h est) - Dev: ${t.assignedDeveloper}`),
      ``,
      `RECENT TIME ENTRIES:`,
      ...timeLogs.slice(0, 5).map(l => `• ${l.date} | ${l.developerName}: ${l.hours}h on "${l.taskTitle}" - ${l.notes || 'No notes'}`)
    ].join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
    showToast('Timesheet report copied to clipboard.');
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return timeLogs.filter(l => {
      const matchDev = logFilterDev === 'all' || l.developerName === logFilterDev;
      const matchBillable =
        logFilterBillable === 'all' ||
        (logFilterBillable === 'billable' && l.billable) ||
        (logFilterBillable === 'non_billable' && !l.billable);
      return matchDev && matchBillable;
    });
  }, [timeLogs, logFilterDev, logFilterBillable]);

  // Unique developers in logs
  const developersList = useMemo(() => {
    const devs = new Set<string>();
    timeLogs.forEach(l => {
      if (l.developerName) devs.add(l.developerName);
    });
    tasks.forEach(t => {
      if (t.assignedDeveloper) devs.add(t.assignedDeveloper);
    });
    return Array.from(devs);
  }, [timeLogs, tasks]);

  if (!isOpen || !project) return null;

  const timerDigits = formatTimerDigits(timerSeconds);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Developer Time Tracker &amp; Sprint Tasks</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {project.websiteType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {project.clientName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Log billable developer hours, track active task burndown, and monitor production margin against SOP milestones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isTimerRunning && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Timer Running: {timerDigits.formatted}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Time Tracker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial & Time Metrics Overview Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-900/40 border-b border-white/5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Hours Logged / Est.
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-white font-mono">
                {metrics.totalLoggedHours.toFixed(1)}h
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                / {metrics.totalEstHours.toFixed(1)}h est
              </span>
            </div>
            <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-500 ${
                  metrics.progressPercent >= 100
                    ? 'bg-rose-500'
                    : metrics.progressPercent >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(metrics.progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Tasks Completed
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {metrics.completedTasksCount} / {metrics.totalTasksCount}
              </span>
              <span className="text-[11px] text-slate-400">
                {metrics.totalTasksCount > 0
                  ? Math.round((metrics.completedTasksCount / metrics.totalTasksCount) * 100)
                  : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {metrics.totalTasksCount - metrics.completedTasksCount} active in current sprint
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              Dev Cost (Logged)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-amber-300 font-mono">
                ${Math.round(metrics.totalDevCost)}
              </span>
              <span className="text-[11px] text-slate-400">
                {metrics.billableHours.toFixed(1)}h billable
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              Agreed Price: ${metrics.projectPrice}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Project Margin
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-base font-extrabold font-mono ${metrics.grossMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${Math.round(metrics.grossMargin)}
              </span>
              <span className={`text-[11px] font-bold ${metrics.grossMarginPercent >= 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.grossMarginPercent}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              Target Agency Margin: &gt;50%
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/5 bg-slate-950/40 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Sprint Tasks ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'timer'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <TimerIcon className="w-3.5 h-3.5" />
            <span>Live Stopwatch {isTimerRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />}</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Hours</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Timesheet &amp; Logs ({timeLogs.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: ACTIVE TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Sprint Development Tasks</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      (SOP Milestones &amp; Developer Assignments)
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadStandardTasks}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    title="Populate standard SOP tasks for this project type"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load SOP Template Tasks</span>
                  </button>

                  <button
                    onClick={() => setIsAddingTask(!isAddingTask)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingTask ? 'Cancel' : 'New Task'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible New Task Form */}
              <AnimatePresence>
                {isAddingTask && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateTask}
                    className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/30 space-y-3 text-xs"
                  >
                    <h5 className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Active Task</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Task Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Responsive Checkout Integration & Stripe Testing"
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Assigned Developer</label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Rivera, Dev Lead"
                          value={newTaskDev}
                          onChange={e => setNewTaskDev(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Category</label>
                        <select
                          value={newTaskCategory}
                          onChange={e => setNewTaskCategory(e.target.value as TaskCategory)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-200 text-xs focus:outline-hidden"
                        >
                          <option value="frontend">Frontend UI</option>
                          <option value="backend">Backend &amp; API</option>
                          <option value="devops">DevOps / Hosting</option>
                          <option value="qa">QA &amp; Testing</option>
                          <option value="design">Design / Figma</option>
                          <option value="content">Content &amp; Assets</option>
                          <option value="general">General</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Priority</label>
                        <select
                          value={newTaskPriority}
                          onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-200 text-xs focus:outline-hidden"
                        >
                          <option value="urgent">🔴 Urgent</option>
                          <option value="high">🟠 High</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="low">🟢 Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Estimated Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={newTaskEstHours}
                          onChange={e => setNewTaskEstHours(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Description / Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="Detailed technical deliverables or verification criteria..."
                        value={newTaskDescription}
                        onChange={e => setNewTaskDescription(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
                      >
                        Save Task to Sprint
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Tasks List */}
              <div className="space-y-2.5">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-white/10 space-y-3">
                    <Layers className="w-8 h-8 mx-auto text-slate-600" />
                    <p>No development tasks defined for this project yet.</p>
                    <button
                      onClick={handleLoadStandardTasks}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Generate Standard SOP Sprint Tasks</span>
                    </button>
                  </div>
                ) : (
                  tasks.map(task => {
                    const taskProgress = task.estimatedHours > 0
                      ? Math.min(Math.round(((task.loggedHours || 0) / task.estimatedHours) * 100), 100)
                      : 0;

                    const isOverdue = (task.loggedHours || 0) > task.estimatedHours;

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border transition duration-150 space-y-2.5 ${
                          task.status === 'completed'
                            ? 'bg-slate-900/40 border-white/5 opacity-85'
                            : task.status === 'in_progress'
                            ? 'bg-slate-800/70 border-indigo-500/40 ring-1 ring-indigo-500/20'
                            : 'bg-slate-900/80 border-white/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-[240px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Status Badge */}
                              <select
                                value={task.status}
                                onChange={e => handleToggleTaskStatus(task.id, e.target.value as TaskStatus)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                                    : task.status === 'in_progress'
                                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                                    : task.status === 'review'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">In Review</option>
                                <option value="completed">Completed</option>
                              </select>

                              {/* Priority Tag */}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  task.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : task.priority === 'high'
                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {task.priority}
                              </span>

                              {/* Category */}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-400">
                                {task.category}
                              </span>

                              {/* Assigned Dev */}
                              {task.assignedDeveloper && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span>{task.assignedDeveloper}</span>
                                </span>
                              )}
                            </div>

                            <h5 className={`text-xs font-bold mt-1.5 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                              {task.title}
                            </h5>

                            {task.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Hours & Actions */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className={`text-xs font-mono font-extrabold ${isOverdue ? 'text-rose-400' : 'text-indigo-400'}`}>
                                {task.loggedHours.toFixed(1)}h
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {' '}/ {task.estimatedHours}h est
                              </span>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setTimerTaskId(task.id);
                                  setActiveTab('timer');
                                  setIsTimerRunning(true);
                                  showToast(`Stopwatch started for "${task.title}".`);
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer"
                                title="Start live timer on this task"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Start Timer</span>
                              </button>

                              <button
                                onClick={() => {
                                  setManualTaskId(task.id);
                                  setActiveTab('manual');
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold transition cursor-pointer"
                                title="Log manual hours on this task"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>+ Log</span>
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Task Progress Bar */}
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              task.status === 'completed'
                                ? 'bg-emerald-500'
                                : isOverdue
                                ? 'bg-rose-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${taskProgress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE STOPWATCH TIMER */}
          {activeTab === 'timer' && (
            <div className="max-w-xl mx-auto space-y-6 py-2">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 text-center space-y-4 shadow-xl">
                {/* Timer Pulsing Ring & Digits */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center w-52 h-52 rounded-full border-4 border-slate-800 bg-slate-900/60 shadow-inner">
                    {isTimerRunning && (
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/50 animate-ping opacity-25" />
                    )}
                    <div className="space-y-1">
                      <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-widest">
                        {timerDigits.formatted}
                      </div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        {isTimerRunning ? '🔴 Live Session Ticking' : '⏸️ Timer Paused'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Timer Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {!isTimerRunning ? (
                    <button
                      onClick={() => setIsTimerRunning(true)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{timerSeconds > 0 ? 'Resume Timer' : 'Start Timer'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(0);
                      localStorage.removeItem(`active_timer_${project.id}`);
                      localStorage.removeItem('global_active_timer');
                      showToast('Stopwatch reset.');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                    title="Reset timer to 00:00:00"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    disabled={timerSeconds < 60}
                    onClick={handleStopAndLogTimer}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${
                      timerSeconds >= 60
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Stop &amp; Log Hours</span>
                  </button>
                </div>
              </div>

              {/* Timer Metadata Configuration */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3 text-xs">
                <h5 className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Session Log Target</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Target Active Task</label>
                    <select
                      value={timerTaskId}
                      onChange={e => setTimerTaskId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-hidden"
                    >
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.status.toUpperCase()})
                        </option>
                      ))}
                      <option value="general">General Implementation &amp; QA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Developer</label>
                    <input
                      type="text"
                      value={timerDevName}
                      onChange={e => setTimerDevName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={timerBillable}
                        onChange={e => setTimerBillable(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Billable Client Work</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Hourly Cost Rate ($/hr)</label>
                    <input
                      type="number"
                      value={timerHourlyRate}
                      onChange={e => setTimerHourlyRate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Work Notes / Git Commit Summary</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fixed navigation hamburger menu on iPhone 15, verified Stripe checkout webhook response."
                    value={timerNotes}
                    onChange={e => setTimerNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TIME LOG ENTRY */}
          {activeTab === 'manual' && (
            <div className="max-w-xl mx-auto space-y-4 py-2">
              <form onSubmit={handleManualTimeSubmit} className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4 text-xs shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Log Completed Developer Hours</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Direct Entry</span>
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] mb-1">Select Active Task *</label>
                  <select
                    value={manualTaskId}
                    onChange={e => setManualTaskId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                  >
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} — ({t.loggedHours}h logged of {t.estimatedHours}h est)
                      </option>
                    ))}
                    <option value="general">General Development &amp; Support</option>
                  </select>
                </div>

                {/* Quick Add Pills */}
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Quick Select Hours</label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['0.5', '1.0', '1.5', '2.0', '3.0', '4.0', '6.0', '8.0'].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setManualHours(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                          manualHours === val
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        +{val}h
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Exact Decimal Hours *</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      required
                      value={manualHours}
                      onChange={e => setManualHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Date Completed</label>
                    <input
                      type="date"
                      required
                      value={manualDate}
                      onChange={e => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Developer Name</label>
                    <input
                      type="text"
                      required
                      value={manualDevName}
                      onChange={e => setManualDevName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Hourly Cost ($/hr)</label>
                    <input
                      type="number"
                      value={manualHourlyRate}
                      onChange={e => setManualHourlyRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={manualBillable}
                      onChange={e => setManualBillable(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Billable to Client Project</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Work Description &amp; Deliverables *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Summarize engineering work completed, tests executed, or code merged..."
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Save &amp; Log Hours
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: TIMESHEET & LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              {/* Filter and Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Developer Filter */}
                  <select
                    value={logFilterDev}
                    onChange={e => setLogFilterDev(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-hidden"
                  >
                    <option value="all">All Developers</option>
                    {developersList.map(dev => (
                      <option key={dev} value={dev}>{dev}</option>
                    ))}
                  </select>

                  {/* Billable Filter */}
                  <select
                    value={logFilterBillable}
                    onChange={e => setLogFilterBillable(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-300 text-xs focus:outline-hidden"
                  >
                    <option value="all">All Time Types</option>
                    <option value="billable">Billable Only</option>
                    <option value="non_billable">Non-billable Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleCopySummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                    title="Copy formatted timesheet report"
                  >
                    {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSuccess ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                    title="Download timesheet as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="rounded-xl border border-white/10 overflow-x-auto bg-slate-950/40">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Developer</th>
                      <th className="p-3">Task Deliverable</th>
                      <th className="p-3">Work Summary</th>
                      <th className="p-3 text-right">Hours</th>
                      <th className="p-3 text-right">Cost</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No time logs match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => {
                        const logCost = log.hours * (log.hourlyRate || 45);

                        return (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                              {log.date}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={log.developerAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(log.developerName)}`}
                                  alt={log.developerName}
                                  className="w-5 h-5 rounded-full bg-slate-800"
                                />
                                <span className="font-bold text-white">{log.developerName}</span>
                              </div>
                            </td>
                            <td className="p-3 max-w-[200px]">
                              <span className="font-semibold text-indigo-400 block truncate">
                                {log.taskTitle}
                              </span>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                log.billable
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {log.billable ? 'Billable' : 'Internal R&D'}
                              </span>
                            </td>
                            <td className="p-3 max-w-xs text-slate-400">
                              <p className="line-clamp-2 leading-relaxed">
                                {log.notes}
                              </p>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-white whitespace-nowrap">
                              {log.hours.toFixed(2)}h
                              <span className="text-[10px] text-slate-500 block font-normal">
                                ({log.durationMinutes}m)
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-amber-300 font-bold whitespace-nowrap">
                              ${logCost.toFixed(2)}
                              <span className="text-[10px] text-slate-500 block font-normal">
                                @ ${log.hourlyRate || 45}/h
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Delete log entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-mono text-indigo-400 font-bold">
              {metrics.totalLoggedHours.toFixed(1)}h
            </span>
            <span>total hours logged across</span>
            <span className="font-mono text-white font-bold">{tasks.length} tasks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
