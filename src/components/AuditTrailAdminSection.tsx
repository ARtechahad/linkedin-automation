import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Clock,
  User,
  Activity,
  Layers,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Database,
  ExternalLink
} from 'lucide-react';

import { SkeletonTable } from './SkeletonLoader';

export const AuditTrailAdminSection: React.FC = () => {
  const { showToast, currentUser } = useApp();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '100');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || (data.logs || []).length);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported audit trail JSON.');
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      showToast('No logs to export.');
      return;
    }
    const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
    const rows = logs.map(l => [
      l.createdAt,
      `"${l.userName || ''}"`,
      l.userRole || '',
      l.action,
      l.entityType,
      l.entityId || '',
      l.ipAddress || '',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported audit trail CSV.');
  };

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (action.includes('INGESTED') || action.includes('CREATED')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    if (action.includes('EVALUATED') || action.includes('APPRAISAL')) {
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    }
    if (action.includes('COLLABORATOR')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (action.includes('DELETED') || action.includes('REVOKED')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Executive Audit Trail &amp; Compliance Activity Logs
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Dual-Engine: JSON + PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                Every sensitive governance action—user authentication, status progression, project deletions, partner appraisals, collaborator assignments, and automated API lead ingestions—is immutably recorded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, entity ID, action, or IP address..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          >
            <option value="all">All Audit Actions ({totalCount})</option>
            <option value="AUTH_LOGIN">User Authentications (AUTH_LOGIN)</option>
            <option value="LEAD_API_INGESTED">Automation Ingestions (LEAD_API_INGESTED)</option>
            <option value="PROJECT_EVALUATED">Partner Appraisals (PROJECT_EVALUATED)</option>
            <option value="COLLABORATOR_ASSIGNED">Collaborator Assignments</option>
            <option value="PROJECT_STATUS_CHANGED">Project Pipeline Status Changes</option>
            <option value="PROJECT_DELETED">Project Deletions</option>
            <option value="API_TOKEN_CREATED">API Token Generations</option>
            <option value="API_TOKEN_REVOKED">API Token Revocations</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream Table */}
      <div className="glass-card rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {loading ? (
          <SkeletonTable rowsCount={6} colsCount={7} />
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No audit records matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor / User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Entity Target</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {log.userName || 'System Actor'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {log.userRole || 'system'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {log.entityType} {log.entityId ? `(${log.entityId})` : ''}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLogId(isExpanded ? null : log.id);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <td colSpan={7} className="p-4">
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 font-mono text-xs text-emerald-400 overflow-x-auto space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                                <span>Audit Event ID: {log.id}</span>
                                <span>Entity: {log.entityType}</span>
                              </div>
                              <pre className="whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(log.details || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
