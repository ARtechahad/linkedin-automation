import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  Table,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  X,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { googleSheetsService, GoogleSheetsSyncConfig, GoogleSpreadsheetMeta } from '../services/googleSheetsService';
import { useApp } from '../context/AppContext';
import { hasGoogleSheetsAccess, signInWithGoogle } from '../lib/firebase';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose
}) => {
  const { projects, refreshProjects, showToast } = useApp();
  
  const [config, setConfig] = useState<GoogleSheetsSyncConfig>(googleSheetsService.getConfig());
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheetMeta[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sync' | 'import' | 'milestones'>('sync');
  const [isConnected, setIsConnected] = useState<boolean>(hasGoogleSheetsAccess());
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = googleSheetsService.subscribe(newConfig => {
      setConfig(newConfig);
    });
    setIsConnected(hasGoogleSheetsAccess());
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen && isConnected) {
      loadSpreadsheetsList();
    }
  }, [isOpen, isConnected]);

  const loadSpreadsheetsList = async () => {
    setIsLoadingSpreadsheets(true);
    try {
      const list = await googleSheetsService.listSpreadsheets();
      setSpreadsheets(list);
    } catch (err: any) {
      console.warn('Failed to load spreadsheets:', err);
    } finally {
      setIsLoadingSpreadsheets(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setIsConnected(true);
        showToast('Google Account connected with Google Sheets & Drive scopes.');
        loadSpreadsheetsList();
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (e: any) {
      showToast('Authentication failed: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingNew(true);
    try {
      const title = newSheetTitle.trim() || `AgencyOps - Pipeline (${new Date().toLocaleDateString()})`;
      const created = await googleSheetsService.createPipelineSpreadsheet(title);
      showToast(`Google Sheet created: "${created.name}"`);
      await googleSheetsService.exportProjectsToSheet(created.id, projects);
      showToast(`Exported ${projects.length} leads to new Google Sheet.`);
      loadSpreadsheetsList();
      setNewSheetTitle('');
    } catch (err: any) {
      showToast(`Failed to create sheet: ${err.message}`, 'error');
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleExportNow = async () => {
    if (!config.spreadsheetId) {
      showToast('Please select or create a Google Sheet first.', 'warning');
      return;
    }
    setIsExporting(true);
    try {
      const res = await googleSheetsService.exportProjectsToSheet(config.spreadsheetId, projects);
      showToast(`Successfully synced ${res.rowsExported} deals to Google Sheets!`);
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportNow = async () => {
    if (!config.spreadsheetId) {
      showToast('Please select a Google Sheet first.', 'warning');
      return;
    }
    setIsImporting(true);
    try {
      const res = await googleSheetsService.importProjectsFromSheet(config.spreadsheetId);
      if (res.importedCount === 0) {
        showToast('No new lead rows found in the sheet.', 'info');
      } else {
        let addedCount = 0;
        for (const lead of res.leads) {
          const exists = projects.some(p => p.id === lead.id || (p.clientName === lead.clientName && p.clientEmail === lead.clientEmail));
          if (!exists) {
            await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lead)
            });
            addedCount++;
          }
        }
        await refreshProjects();
        setLastImportCount(addedCount);
        showToast(`Imported ${addedCount} new leads from Google Sheet into dashboard.`);
      }
    } catch (err: any) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    googleSheetsService.saveConfig({ autoSync: enabled });
    showToast(`Google Sheets Auto-Sync ${enabled ? 'Enabled' : 'Disabled'}.`);
    if (enabled && config.spreadsheetId) {
      googleSheetsService.exportProjectsToSheet(config.spreadsheetId, projects).catch(() => {});
    }
  };

  const handleSelectSpreadsheet = (id: string, name: string) => {
    const url = `https://docs.google.com/spreadsheets/d/${id}/edit`;
    googleSheetsService.saveConfig({
      spreadsheetId: id,
      spreadsheetName: name,
      spreadsheetUrl: url,
      syncStatus: 'idle'
    });
    showToast(`Linked sheet: "${name}"`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl glass-card rounded-2xl border border-white/10 shadow-2xl bg-slate-900 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Google Sheets Real-Time Sync &amp; Bulk Import
                  </h3>
                  {config.syncStatus === 'synced' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold font-mono border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Synced
                    </span>
                  )}
                  {config.syncStatus === 'syncing' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold font-mono border border-amber-500/30">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                    </span>
                  )}
                  {config.syncStatus === 'error' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-semibold font-mono border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> Error
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Bi-directional lead backup, SOP milestone logging, and bulk template ingest
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

          {/* Navigation Tabs */}
          <div className="px-5 border-b border-white/10 flex items-center gap-2 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'sync'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Live Sync &amp; Backup</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'import'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Bulk Import Leads</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'milestones'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>SOP Tracking Log</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
            {/* Google Authentication Check */}
            {!isConnected ? (
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/30 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google Workspace Authorization Required</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Connect your Google Account to authorize Google Sheets &amp; Google Drive APIs for automated lead backups and milestone logging.
                  </p>
                </div>
                <div className="pt-2">
                  <GoogleSignInButton
                    onClick={handleConnectGoogle}
                    text="Sign in with Google (Grant Sheets Access)"
                    className="mx-auto"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Active Connected Spreadsheet Status */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {config.spreadsheetName || 'No Google Sheet Linked'}
                        </span>
                        {config.spreadsheetUrl && (
                          <a
                            href={config.spreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 transition"
                            title="Open in Google Sheets"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {config.lastSyncAt
                          ? `Last Synced: ${new Date(config.lastSyncAt).toLocaleString()}`
                          : 'Not synced yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-slate-200 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={config.autoSync}
                        onChange={e => handleToggleAutoSync(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Auto-Sync on Pipeline Changes</span>
                    </label>

                    <button
                      onClick={handleExportNow}
                      disabled={isExporting || !config.spreadsheetId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <ArrowUpFromLine className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                      <span>{isExporting ? 'Exporting...' : 'Sync Now'}</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Live Sync & Sheet Linking */}
                {activeTab === 'sync' && (
                  <div className="space-y-4">
                    {/* Create New Sheet Callout */}
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Create Standard SOP Google Sheet (Pre-formatted Headers)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. AgencyOps - Q1 2026 Pipeline"
                          value={newSheetTitle}
                          onChange={e => setNewSheetTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handleCreateNewSheet}
                          disabled={isCreatingNew}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isCreatingNew ? 'Creating...' : 'Create & Auto-Format'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Or Select Existing Google Sheet */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          Or Link an Existing Google Sheet from Google Drive:
                        </span>
                        <button
                          onClick={loadSpreadsheetsList}
                          disabled={isLoadingSpreadsheets}
                          className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingSpreadsheets ? 'animate-spin' : ''}`} />
                          <span>Refresh List</span>
                        </button>
                      </div>

                      {isLoadingSpreadsheets ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                          Loading Google Sheets from Drive...
                        </div>
                      ) : spreadsheets.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950/30 border border-white/5 text-center text-xs text-slate-400">
                          No existing spreadsheets found. Click "Create &amp; Auto-Format" above to generate your first pipeline sheet.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {spreadsheets.map(sheet => {
                            const isSelected = config.spreadsheetId === sheet.id;
                            return (
                              <div
                                key={sheet.id}
                                onClick={() => handleSelectSpreadsheet(sheet.id, sheet.name)}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-950/40 border-white/5 text-slate-300 hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <FileSpreadsheet className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                                  <div>
                                    <p className="font-semibold text-white">{sheet.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Modified: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                {isSelected ? (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Linked
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500 hover:text-slate-300">
                                    Click to Link
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Bulk Import Leads */}
                {activeTab === 'import' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                        <span>Pull &amp; Ingest Raw Leads from Google Sheet</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Reads rows from the connected Google Sheet (`Pipeline Leads &amp; Deals` tab) and creates new leads in your pipeline dashboard with automatic lead scoring and stage assignments.
                      </p>

                      <div className="p-3 rounded-xl bg-slate-900 border border-white/5 font-mono text-[11px] text-slate-300 space-y-1">
                        <p className="font-bold text-slate-400">Expected Column Order:</p>
                        <p className="text-slate-400">
                          A: Project ID | B: Client Name | C: Company | D: Email | E: Phone | F: Channel (Upwork/LinkedIn/Direct) | G: Website Type | H: Deal Value USD | I: 50% Advance Paid | J: 50% Balance Paid
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {lastImportCount !== null && `Last run imported ${lastImportCount} new project(s).`}
                        </span>
                        <button
                          onClick={handleImportNow}
                          disabled={isImporting || !config.spreadsheetId}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <ArrowDownToLine className={`w-3.5 h-3.5 ${isImporting ? 'animate-bounce' : ''}`} />
                          <span>{isImporting ? 'Importing Leads...' : 'Import Leads from Sheet'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Milestone & Tracking Log Preview */}
                {activeTab === 'milestones' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Live SOP Milestone Audit &amp; Deal Tracking Log ({projects.length} Deals)
                      </span>
                      <button
                        onClick={handleExportNow}
                        disabled={isExporting || !config.spreadsheetId}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                      >
                        <ArrowUpFromLine className="w-3 h-3" />
                        <span>Push Log Update</span>
                      </button>
                    </div>

                    <div className="rounded-xl border border-white/10 overflow-x-auto bg-slate-950/60 max-h-60">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-white/10 sticky top-0">
                          <tr>
                            <th className="p-2.5">Client &amp; Company</th>
                            <th className="p-2.5">Channel</th>
                            <th className="p-2.5">Deal Value</th>
                            <th className="p-2.5">50% Advance</th>
                            <th className="p-2.5">50% Balance</th>
                            <th className="p-2.5">SOP Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                          {projects.map(p => (
                            <tr key={p.id} className="hover:bg-white/5 transition">
                              <td className="p-2.5 font-sans">
                                <p className="font-semibold text-white">{p.clientName}</p>
                                <p className="text-[10px] text-slate-400">{p.clientCompany || 'Direct Client'}</p>
                              </td>
                              <td className="p-2.5 uppercase font-bold text-[10px] text-indigo-400">
                                {p.channel}
                              </td>
                              <td className="p-2.5 font-bold text-emerald-400">
                                ${p.finalPrice}
                              </td>
                              <td className="p-2.5">
                                {p.advancePaid ? (
                                  <span className="text-emerald-400 font-bold">PAID (50%)</span>
                                ) : (
                                  <span className="text-amber-400">PENDING</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                {p.balancePaid ? (
                                  <span className="text-emerald-400 font-bold">PAID (50%)</span>
                                ) : (
                                  <span className="text-slate-500">PENDING</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  p.status === 'transferred' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-800/40 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct Client-to-Google OAuth with Least-Privilege Scopes</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
