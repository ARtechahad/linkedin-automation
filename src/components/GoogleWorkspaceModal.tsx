import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckSquare,
  Calendar,
  FileText,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Plus,
  Clock,
  Send,
  X,
  Layers,
  ArrowUpRight,
  Info,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { hasGoogleWorkspaceAccess, signInWithGoogle } from '../lib/firebase';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ProjectLead } from '../types';
import { googleSheetsService, GoogleSheetsSyncConfig, GoogleSpreadsheetMeta } from '../services/googleSheetsService';
import { googleTasksService, SOP_MILESTONE_DEFINITIONS, GoogleTaskList, GoogleTaskItem } from '../services/googleTasksService';
import { googleCalendarService, GoogleCalendarEvent } from '../services/googleCalendarService';
import { googleDocsService } from '../services/googleDocsService';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: ProjectLead | null;
  initialTab?: 'sheets' | 'tasks' | 'calendar' | 'docs';
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  activeProject: propProject,
  initialTab = 'sheets'
}) => {
  const { projects, updateProject, showToast, refreshProjects } = useApp();

  const [activeTab, setActiveTab] = useState<'sheets' | 'tasks' | 'calendar' | 'docs'>(initialTab);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    propProject?.id || (projects.length > 0 ? projects[0].id : '')
  );
  const [isConnected, setIsConnected] = useState<boolean>(hasGoogleWorkspaceAccess());

  // Sheets state
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsSyncConfig>(googleSheetsService.getConfig());
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetMeta[]>([]);
  const [isExportingSheets, setIsExportingSheets] = useState<boolean>(false);
  const [isImportingSheets, setIsImportingSheets] = useState<boolean>(false);

  // Tasks state
  const [isSyncingTasks, setIsSyncingTasks] = useState<boolean>(false);
  const [tasksResult, setTasksResult] = useState<{ taskListTitle?: string; webUrl?: string; taskCount?: number } | null>(null);

  // Calendar state
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState<boolean>(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendarStatusMsg, setCalendarStatusMsg] = useState<string | null>(null);

  // Docs state
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [docNoteInput, setDocNoteInput] = useState<string>('');
  const [isAppendingNote, setIsAppendingNote] = useState<boolean>(false);

  // Active project object
  const activeProject = projects.find(p => p.id === selectedProjectId) || propProject || projects[0];

  useEffect(() => {
    if (propProject) {
      setSelectedProjectId(propProject.id);
    }
  }, [propProject]);

  useEffect(() => {
    setIsConnected(hasGoogleWorkspaceAccess());
    const unsub = googleSheetsService.subscribe(cfg => setSheetsConfig(cfg));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen && isConnected) {
      googleSheetsService.listSpreadsheets().then(setSpreadsheets).catch(() => {});
      googleCalendarService.listUpcomingEvents(10).then(setCalendarEvents).catch(() => {});
    }
  }, [isOpen, isConnected]);

  const handleConnectGoogle = async () => {
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setIsConnected(true);
        showToast('Connected to Google Workspace (Sheets, Tasks, Calendar, Docs)!');
        googleSheetsService.listSpreadsheets().then(setSpreadsheets).catch(() => {});
        googleCalendarService.listUpcomingEvents(10).then(setCalendarEvents).catch(() => {});
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (e: any) {
      showToast('Google Workspace authentication error: ' + (e?.message || 'Unknown'), 'error');
    }
  };

  // Google Sheets Actions
  const handleExportSheets = async () => {
    if (!sheetsConfig.spreadsheetId) {
      showToast('Please create or link a Google Sheet first.', 'warning');
      return;
    }
    setIsExportingSheets(true);
    try {
      const res = await googleSheetsService.exportProjectsToSheet(sheetsConfig.spreadsheetId, projects);
      showToast(`Exported ${res.rowsExported} deals to Google Sheet!`);
    } catch (e: any) {
      showToast(`Export failed: ${e.message}`, 'error');
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleCreateNewSheet = async () => {
    try {
      const created = await googleSheetsService.createPipelineSpreadsheet(
        `AgencyOps Pipeline - ${new Date().toLocaleDateString()}`
      );
      showToast(`Created Google Sheet: "${created.name}"`);
      await googleSheetsService.exportProjectsToSheet(created.id, projects);
      showToast('Leads and SOP audit logs populated.');
      const list = await googleSheetsService.listSpreadsheets();
      setSpreadsheets(list);
    } catch (e: any) {
      showToast(`Error creating sheet: ${e.message}`, 'error');
    }
  };

  // Google Tasks Actions
  const handleSyncTasks = async () => {
    if (!activeProject) {
      showToast('Please select a project to sync SOP tasks.', 'warning');
      return;
    }
    setIsSyncingTasks(true);
    try {
      const res = await googleTasksService.syncSopTasksForProject(activeProject);
      setTasksResult(res);
      await updateProject(activeProject.id, {
        googleTaskListId: res.taskListId,
        googleTasksSyncedAt: new Date().toISOString()
      });
      showToast(`Synced 11 SOP milestones to Google Tasks: "${res.taskListTitle}"!`);
    } catch (e: any) {
      showToast(`Tasks sync failed: ${e.message}`, 'error');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Google Calendar Actions
  const handleScheduleMilestones = async () => {
    if (!activeProject) {
      showToast('Please select a project to schedule milestone events.', 'warning');
      return;
    }
    setIsSchedulingCalendar(true);
    try {
      const res = await googleCalendarService.scheduleMilestonesForProject(activeProject);
      setCalendarStatusMsg(`Scheduled ${res.scheduledEvents.length} calendar events!`);
      const events = await googleCalendarService.listUpcomingEvents(15);
      setCalendarEvents(events);
      await updateProject(activeProject.id, {
        googleCalendarSyncedAt: new Date().toISOString()
      });
      showToast(`Scheduled Kickoff, Payment Deadline, Staging QA, and Delivery events!`);
    } catch (e: any) {
      showToast(`Calendar scheduling failed: ${e.message}`, 'error');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  // Google Docs Actions
  const handleGenerateProposal = async () => {
    if (!activeProject) {
      showToast('Please select a project to generate a proposal.', 'warning');
      return;
    }
    setIsGeneratingDoc(true);
    try {
      const created = await googleDocsService.generateProposalForProject(activeProject);
      await updateProject(activeProject.id, {
        googleDocUrl: created.documentUrl,
        googleDocId: created.documentId
      });
      showToast(`Generated Google Doc proposal for ${activeProject.clientName}!`);
    } catch (e: any) {
      showToast(`Proposal generation failed: ${e.message}`, 'error');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleAppendDocNote = async () => {
    if (!activeProject?.googleDocId) {
      showToast('Please generate or attach a Google Doc first.', 'warning');
      return;
    }
    if (!docNoteInput.trim()) return;
    setIsAppendingNote(true);
    try {
      await googleDocsService.appendNotesToDocument(activeProject.googleDocId, docNoteInput.trim());
      showToast('Meeting notes appended to Google Doc!');
      setDocNoteInput('');
    } catch (e: any) {
      showToast(`Failed to append note: ${e.message}`, 'error');
    } finally {
      setIsAppendingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl glass-card rounded-2xl border border-white/10 shadow-2xl bg-slate-900 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Google Workspace Integration Suite
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Sheets • Tasks • Calendar • Docs
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Full-stack B2B synchronization for international client delivery and SOP compliance
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Selector Bar */}
          <div className="px-5 py-3 border-b border-white/10 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Selected Project:</span>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-white/10 text-white font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.clientName} ({p.clientCompany || 'Direct'}) - ${p.finalPrice} [{p.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {activeProject && (
              <div className="flex items-center gap-2 text-xs">
                {activeProject.googleDocUrl && (
                  <a
                    href={activeProject.googleDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition"
                  >
                    <FileText className="w-3 h-3" />
                    <span>View Doc</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {sheetsConfig.spreadsheetUrl && (
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>View Sheet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Google Calendar</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 border-b border-white/10 flex items-center gap-2 bg-slate-900/50 shrink-0">
            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'sheets'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets (Data Sync)</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Google Tasks (SOP Steps 1-11)</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Google Calendar (Deadlines &amp; Calls)</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'docs'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Google Docs (Proposals &amp; Briefs)</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {!isConnected ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-indigo-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Google Workspace Authorization Required</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Connect your Google Account to authorize Google Sheets, Tasks, Calendar, and Docs APIs for seamless B2B client pipeline automation.
                  </p>
                </div>
                <div className="pt-2">
                  <GoogleSignInButton
                    onClick={handleConnectGoogle}
                    text="Connect Google Workspace (Unified OAuth)"
                    className="mx-auto"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: GOOGLE SHEETS */}
                {activeTab === 'sheets' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>Central Lead Export, Backup &amp; Audit Log</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Current Sheet: <strong className="text-slate-200">{sheetsConfig.spreadsheetName || 'None Selected'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCreateNewSheet}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create New Sheet</span>
                        </button>

                        <button
                          onClick={handleExportSheets}
                          disabled={isExportingSheets}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isExportingSheets ? 'animate-spin' : ''}`} />
                          <span>{isExportingSheets ? 'Syncing...' : 'Sync All Leads Now'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Sheet 1: Pipeline Leads &amp; Deals
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Synchronizes client names, companies, emails, acquisition channels (Upwork, LinkedIn), pipeline values, advance payments, and live staging URLs.
                        </p>
                        <div className="text-[11px] font-mono text-emerald-400">
                          {projects.length} leads ready for continuous cloud backup.
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Sheet 2: SOP Milestone &amp; Tracking Log
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Maintains a chronological transaction history row-by-row with timestamps, total deal values, and status flags across all 11 stages.
                        </p>
                        <div className="text-[11px] font-mono text-indigo-400">
                          Milestones audited and strictly synchronized.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: GOOGLE TASKS */}
                {activeTab === 'tasks' && activeProject && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                          <span>Google Tasks SOP Milestone Gateway</span>
                        </h4>
                        <p className="text-xs text-indigo-300 mt-1">
                          Creates dedicated task list <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px]">Client: {activeProject.clientCompany || activeProject.clientName} - SOP Pipeline</code> and tracks Steps 1 through 11.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSyncTasks}
                          disabled={isSyncingTasks}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTasks ? 'animate-spin' : ''}`} />
                          <span>{isSyncingTasks ? 'Syncing Steps...' : 'Sync SOP Steps 1-11'}</span>
                        </button>

                        <a
                          href="https://calendar.google.com/calendar/u/0/r/tasks"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <span>Open Google Tasks</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
                      <div className="p-3 border-b border-white/10 bg-slate-800/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">SOP Operational Milestones Breakdown</span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          Two-Way Status Check Sync Active
                        </span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {SOP_MILESTONE_DEFINITIONS.map(sop => {
                          const done = sop.isCompleted(activeProject);
                          return (
                            <div key={sop.step} className="p-3 flex items-start gap-3 hover:bg-white/5 transition text-xs">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${done ? 'text-emerald-300' : 'text-slate-200'}`}>
                                    {sop.title}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {done ? 'COMPLETED' : 'PENDING'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {sop.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: GOOGLE CALENDAR */}
                {activeTab === 'calendar' && activeProject && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-400" />
                          <span>Google Calendar Automated Meeting &amp; Milestone Scheduler</span>
                        </h4>
                        <p className="text-xs text-amber-300 mt-1">
                          Schedules Kickoff Calls, strict 50% payment deadlines, staging review milestones, and delivery dates with color codes.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleScheduleMilestones}
                          disabled={isSchedulingCalendar}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className={`w-3.5 h-3.5 ${isSchedulingCalendar ? 'animate-spin' : ''}`} />
                          <span>{isSchedulingCalendar ? 'Scheduling...' : 'Auto-Schedule All 4 Events'}</span>
                        </button>

                        <a
                          href="https://calendar.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <span>Open Calendar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Color Coding Legend */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                        <span>Payment Deadlines (Strict)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                        <span>Client Discovery Calls</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                        <span>Staging Review QA</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <span>Domain Live Handover</span>
                      </div>
                    </div>

                    {/* Calendar Event Feed */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                      <span className="text-xs font-bold text-slate-300">
                        Upcoming Google Calendar Events (Real-Time Feed)
                      </span>
                      {calendarEvents.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3 text-center">
                          No upcoming events found. Click "Auto-Schedule All 4 Events" to generate milestones for this client.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {calendarEvents.map(evt => (
                            <div
                              key={evt.id}
                              className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-semibold text-white">{evt.summary}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {evt.start.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start.date}
                                </p>
                              </div>
                              {evt.htmlLink && (
                                <a
                                  href={evt.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-400 hover:text-amber-300"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: GOOGLE DOCS */}
                {activeTab === 'docs' && activeProject && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Google Docs Contract &amp; Service Agreement Generator</span>
                        </h4>
                        <p className="text-xs text-blue-300 mt-1">
                          Programmatically populates a professional B2B agreement with agreed scope, 50/50 payment gates, and saves link to client profile.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateProposal}
                          disabled={isGeneratingDoc}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDoc ? 'animate-spin' : ''}`} />
                          <span>{isGeneratingDoc ? 'Generating...' : 'Generate Contract / Proposal'}</span>
                        </button>

                        {activeProject.googleDocUrl && (
                          <a
                            href={activeProject.googleDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                          >
                            <span>Open In Google Docs</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Linked Doc Preview Card */}
                    {activeProject.googleDocUrl ? (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              Linked Agreement Document Active
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Doc ID: {activeProject.googleDocId || 'doc_attached'}
                            </p>
                          </div>
                        </div>

                        <a
                          href={activeProject.googleDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1"
                        >
                          <span>Launch Google Doc</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-center text-xs text-slate-400">
                        No contract generated yet for this client. Click "Generate Contract / Proposal" above.
                      </div>
                    )}

                    {/* Append Meeting Notes / Briefs into Google Doc */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          Sync Meeting Notes &amp; Scope Briefs to Google Doc
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Appends directly into the live document
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={docNoteInput}
                        onChange={e => setDocNoteInput(e.target.value)}
                        placeholder="Add discovery call meeting minutes, revisions, or updated technical briefs to push to the Google Doc..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleAppendDocNote}
                          disabled={isAppendingNote || !docNoteInput.trim() || !activeProject.googleDocId}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAppendingNote ? 'Pushing...' : 'Push Note to Google Doc'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-800/40 text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Google Workspace Suite: Sheets v4, Tasks v1, Calendar v3, Docs v1</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
