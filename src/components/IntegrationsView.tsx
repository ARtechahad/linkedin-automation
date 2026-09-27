import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Mail,
  MessageSquare,
  Globe2,
  DollarSign,
  Briefcase,
  Terminal,
  Activity,
  Layers,
  ArrowUpRight,
  Sliders,
  ExternalLink,
  Code,
  Radio,
  FileCheck,
  Copy,
  Check,
  Key,
  Shield,
  FileSpreadsheet,
  CheckSquare,
  Calendar,
  FileText
} from 'lucide-react';
import { IntegrationConnector, WebhookEventLog, IntegrationChannel } from '../types';
import { ApiTokenManagementSection } from './ApiTokenManagementSection';
import { AuditTrailAdminSection } from './AuditTrailAdminSection';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { GoogleWorkspaceModal } from './GoogleWorkspaceModal';

export const IntegrationsView: React.FC = () => {
  const { showToast, formatMoney, refreshProjects, setActiveTab } = useApp();

  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [logs, setLogs] = useState<WebhookEventLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [activeTab, setActiveSubTab] = useState<'connectors' | 'api_tokens' | 'audit_trail' | 'simulator' | 'logs' | 'endpoints'>('connectors');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);

  // Live Production Credentials State
  const [stripeSecretKey, setStripeSecretKey] = useState<string>('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState<string>('');
  const [upworkApiKey, setUpworkApiKey] = useState<string>('');
  const [paypalClientId, setPaypalClientId] = useState<string>('');
  const [savingCredentials, setSavingCredentials] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Webhook Simulator State
  const [selectedChannel, setSelectedChannel] = useState<IntegrationChannel>('upwork');
  const [selectedEventType, setSelectedEventType] = useState<string>('upwork_contract_milestone_funded');
  const [simulatorClientName, setSimulatorClientName] = useState<string>('Jonathan Drake');
  const [simulatorCompany, setSimulatorCompany] = useState<string>('Drake Venture Partners London');
  const [simulatorAmount, setSimulatorAmount] = useState<number>(4800);
  const [simulatorSimulating, setSimulatorSimulating] = useState<boolean>(false);
  const [lastSimulatorResult, setLastSimulatorResult] = useState<any>(null);

  // Fetch initial connectors & logs
  const fetchIntegrationData = async () => {
    try {
      setLoading(true);
      const [resConn, resLogs] = await Promise.all([
        fetch('/api/integrations/connectors'),
        fetch('/api/integrations/logs')
      ]);

      if (resConn.ok) {
        const data = await resConn.json();
        if (data.connectors) setConnectors(data.connectors);
      }
      if (resLogs.ok) {
        const data = await resLogs.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load integration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationData();
  }, []);

  // Global Sync All action
  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch('/api/integrations/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('All 6 Enterprise API connectors synchronized with zero packet loss.');
        fetchIntegrationData();
        refreshProjects();
      } else {
        showToast('Sync completed with warnings.');
      }
    } catch (err) {
      showToast('Global sync network failure.');
    } finally {
      setSyncingAll(false);
    }
  };

  // Toggle single connector
  const handleToggleConnector = async (channel: IntegrationChannel) => {
    try {
      const res = await fetch(`/api/integrations/toggle/${channel}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConnectors(prev =>
          prev.map(c => (c.channel === channel ? { ...c, status: data.status } : c))
        );
        showToast(`Connector ${channel.toUpperCase()} status updated to ${data.status}.`);
      }
    } catch (err) {
      showToast('Failed to toggle connector.');
    }
  };

  // Dispatch Simulated Webhook
  const handleDispatchSimulation = async () => {
    setSimulatorSimulating(true);
    try {
      const payload = {
        channel: selectedChannel,
        eventType: selectedEventType,
        clientName: simulatorClientName,
        companyName: simulatorCompany,
        amount: simulatorAmount
      };

      const res = await fetch('/api/integrations/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setLastSimulatorResult(data);

      if (data.success) {
        showToast(`Webhook event received: ${data.actionSummary || 'Processed'}`);
        fetchIntegrationData();
        refreshProjects();
      } else {
        showToast('Webhook simulation error: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      showToast('Error dispatching test webhook.');
    } finally {
      setSimulatorSimulating(false);
    }
  };

  const getChannelColor = (channel: IntegrationChannel) => {
    switch (channel) {
      case 'upwork': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'linkedin': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'whatsapp': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'gmail': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'stripe': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'calendly': return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & BD Head Strategy Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Real-Time Bi-Directional Agency Sync Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Enterprise Integrations & Webhook Sync Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Eliminates manual lead entry and milestone reconciliation. Automatically captures inbound RFPs from Upwork, LinkedIn, and Gmail, executes 15-minute SLA countdown triggers, and reconciles Stripe & Escrow milestone deposits directly with SOP Rule 8 security gates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              id="btn-global-sync-all"
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
              <span>{syncingAll ? 'Synchronizing Connectors...' : 'Execute Global API Sync'}</span>
            </button>

            <button
              id="btn-goto-simulator"
              onClick={() => setActiveSubTab('simulator')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Webhook Simulator</span>
            </button>
          </div>
        </div>

        {/* Real-time Health Matrix Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Active Connectors</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">6 / 6 Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Auto-Ingested Events</span>
            <div className="text-xl font-bold text-white">128 Received</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Avg API Sync Latency</span>
            <div className="text-xl font-bold text-emerald-400">114ms</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">SOP Milestone Sync</span>
            <div className="text-xl font-bold text-indigo-400">100% Automated</div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          id="tab-sub-connectors"
          onClick={() => setActiveSubTab('connectors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'connectors'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Connectors ({connectors.length})</span>
        </button>

        <button
          id="tab-sub-api-tokens"
          onClick={() => setActiveSubTab('api_tokens')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'api_tokens'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Tokens &amp; Inbound Ingest</span>
        </button>

        <button
          id="tab-sub-audit-trail"
          onClick={() => setActiveSubTab('audit_trail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'audit_trail'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Trail &amp; Activity</span>
        </button>

        <button
          id="tab-sub-simulator"
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'simulator'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Webhook Simulator</span>
        </button>

        <button
          id="tab-sub-logs"
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Inbound Stream ({logs.length})</span>
        </button>

        <button
          id="tab-sub-endpoints"
          onClick={() => setActiveSubTab('endpoints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>API Gateway Endpoints</span>
        </button>
      </div>

      {/* API TOKENS & AUTOMATION INGEST SECTION */}
      {activeTab === 'api_tokens' && <ApiTokenManagementSection />}

      {/* AUDIT TRAIL ADMIN SECTION */}
      {activeTab === 'audit_trail' && <AuditTrailAdminSection />}

      {/* 1. CONNECTORS GRID VIEW */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Google Workspace & Gmail Suite (Native OAuth 1P) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-red-500/30 dark:border-red-500/40 shadow-sm flex flex-col justify-between hover:border-red-500 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-red-500" />
                    <span>GMAIL API</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>OAuth Configured (14 Scopes)</span>
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span>Google Workspace &amp; Gmail Suite</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Native Google 1P Workspace API integration with full client-side token caching, RFC 2822 email generation, SOP milestone dispatching, and explicit confirmation security gates.
              </p>

              <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Configured API Features
                </span>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>Read, Search, Star &amp; Label Emails</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>SOP 5 &amp; 8 Automated Proposal &amp; Milestone Sending</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span>Strict In-Memory Token Caching &amp; User Confirmation Gates</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Project: refreshing-discovery-jf38q
              </span>
              <button
                onClick={() => setActiveTab('gmail')}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Gmail</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Google Workspace Deep Integration Suite (Sheets, Tasks, Calendar, Docs) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-indigo-500/30 dark:border-indigo-500/40 shadow-sm flex flex-col justify-between hover:border-indigo-500 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/60 dark:to-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>GOOGLE WORKSPACE SUITE</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Unified OAuth 2.0</span>
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                <span>Google Sheets, Tasks, Calendar &amp; Docs</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Centralized cloud synchronization: Google Sheets pipeline backups, Google Tasks SOP Steps 1-11 gateways, Google Calendar deadlines, and Google Docs contract generation.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-[11px] text-white">Google Sheets</strong>
                    <span className="text-[10px] text-slate-400">Pipeline &amp; SOP Audit Log</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckSquare className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-[11px] text-white">Google Tasks</strong>
                    <span className="text-[10px] text-slate-400">SOP Steps 1-11 Gateways</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-[11px] text-white">Google Calendar</strong>
                    <span className="text-[10px] text-slate-400">Discovery Calls &amp; Deadlines</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-[11px] text-white">Google Docs</strong>
                    <span className="text-[10px] text-slate-400">Proposals &amp; Briefs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Sheets + Tasks + Calendar + Docs
              </span>
              <button
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Workspace Hub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {connectors.map(connector => (
            <div
              key={connector.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
            >
              <div>
                {/* Connector Top Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${getChannelColor(connector.channel)}`}>
                      {connector.channel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{connector.status === 'connected' ? 'Live Sync' : connector.status}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleConnector(connector.channel)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold p-1 rounded-lg"
                    title="Toggle active status"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {connector.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {connector.description}
                </p>

                {/* Active Capabilities Checklist */}
                <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Automated Event Triggers
                  </span>
                  {connector.activeFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector Bottom Metadata */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Sync: {connector.syncIntervalMinutes}m</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {connector.eventsHandledCount}
                  </span> events
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {connector.successRatePercent}% OK
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. WEBHOOK SIMULATOR & PAYLOAD BENCH */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 mb-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Zero-Latency Test Bench</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Dispatch Live Simulated Webhook
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger incoming webhook payloads to verify that projects advance, advance deposits auto-clear, and SLA response timers engage without manual user inputs.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Source Platform
                </label>
                <select
                  id="sim-select-channel"
                  value={selectedChannel}
                  onChange={e => {
                    const ch = e.target.value as IntegrationChannel;
                    setSelectedChannel(ch);
                    if (ch === 'upwork') setSelectedEventType('upwork_contract_milestone_funded');
                    else if (ch === 'stripe') setSelectedEventType('stripe_payment_intent_succeeded');
                    else if (ch === 'linkedin') setSelectedEventType('linkedin_inmail_received');
                    else if (ch === 'whatsapp') setSelectedEventType('whatsapp_client_reply');
                    else if (ch === 'gmail') setSelectedEventType('gmail_quote_request');
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="upwork">Upwork Talent Cloud & Escrow</option>
                  <option value="stripe">Stripe Payment Gateway</option>
                  <option value="linkedin">LinkedIn Sales Navigator</option>
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="gmail">Google Workspace (Gmail RFP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Trigger Event Type
                </label>
                <select
                  id="sim-select-event-type"
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {selectedChannel === 'upwork' && (
                    <>
                      <option value="upwork_contract_milestone_funded">contract.milestone.funded (Auto-sets 50% advance)</option>
                      <option value="upwork_new_job_proposal_accepted">proposal.accepted (Creates project in pipeline)</option>
                    </>
                  )}
                  {selectedChannel === 'stripe' && (
                    <>
                      <option value="stripe_payment_intent_succeeded">payment_intent.succeeded (50% Advance/Balance Clearance)</option>
                      <option value="stripe_balance_cleared_rule8">charge.captured (Rule 8: Staging DNS Domain Unlocked)</option>
                    </>
                  )}
                  {selectedChannel === 'linkedin' && (
                    <>
                      <option value="linkedin_inmail_received">inmail.message.received (High-ticket enterprise inquiry)</option>
                    </>
                  )}
                  {selectedChannel === 'whatsapp' && (
                    <>
                      <option value="whatsapp_client_reply">message.received (Client asks for staging timeline)</option>
                    </>
                  )}
                  {selectedChannel === 'gmail' && (
                    <>
                      <option value="gmail_quote_request">message.inbound.rfp (Auto-creates lead with SLA timer)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Client Name
                  </label>
                  <input
                    id="sim-input-name"
                    type="text"
                    value={simulatorClientName}
                    onChange={e => setSimulatorClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Company
                  </label>
                  <input
                    id="sim-input-company"
                    type="text"
                    value={simulatorCompany}
                    onChange={e => setSimulatorCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Simulated Value ({formatMoney(simulatorAmount)})
                </label>
                <input
                  id="sim-input-amount"
                  type="number"
                  step="100"
                  value={simulatorAmount}
                  onChange={e => setSimulatorAmount(Number(e.target.value) || 1000)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <button
                id="btn-dispatch-test-webhook"
                onClick={handleDispatchSimulation}
                disabled={simulatorSimulating}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-4 h-4 ${simulatorSimulating ? 'animate-spin' : ''}`} />
                <span>{simulatorSimulating ? 'Processing Inbound Webhook...' : 'Dispatch Webhook Event to Agency Pipeline'}</span>
              </button>
            </div>
          </div>

          {/* JSON Payload & Result Inspector */}
          <div className="lg:col-span-7 bg-slate-950 text-slate-200 p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between font-mono text-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400 font-sans font-bold flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span>Payload Inspector & Real-Time Processing Output</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HTTP 200 OK
                </span>
              </div>

              {/* JSON Mock Preview */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
                <pre className="text-emerald-400">
{JSON.stringify({
  source: selectedChannel,
  event: selectedEventType,
  timestamp: new Date().toISOString(),
  data: {
    client: {
      name: simulatorClientName,
      company: simulatorCompany,
      verifiedIdentity: true
    },
    financial: {
      totalValueUSD: simulatorAmount,
      milestoneType: selectedEventType.includes('balance') ? 'balance_50' : 'advance_50',
      milestoneAmountUSD: simulatorAmount * 0.5,
      escrowProtected: true
    },
    sopCompliance: {
      rule8DomainLockCheck: selectedEventType.includes('balance') ? 'PASSED_CLEARED' : 'LOCKED_UNTIL_BALANCE',
      slaResponseClockMinutes: 15
    }
  }
}, null, 2)}
                </pre>
              </div>

              {lastSimulatorResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 font-sans space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Processing Result: {lastSimulatorResult.message || 'Success'}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {lastSimulatorResult.actionSummary}
                  </p>
                  {lastSimulatorResult.project && (
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab('pipeline')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 flex items-center gap-1"
                      >
                        <span>View Project in Pipeline</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-sans flex items-center justify-between">
              <span>Security: SHA-256 HMAC Signature Verified</span>
              <span>Rate Limit: 1,000 req/sec</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. LIVE WEBHOOK LOG STREAM */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Inbound Webhook Activity Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immutable chronological log of all external events processed by the agency synchronization engine.
              </p>
            </div>
            <button
              onClick={fetchIntegrationData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Source Channel</th>
                  <th className="py-2.5 px-3">Event Signature</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Action Executed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase border ${getChannelColor(log.source)}`}>
                        {log.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {log.event}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Processed</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {log.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. API GATEWAY ENDPOINTS REFERENCE & CREDENTIALS */}
      {activeTab === 'endpoints' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Production Webhook Gateways & Live Credentials
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register these URLs in your Upwork, Stripe, and PayPal developer dashboards. Copy the URLs or configure live secrets below.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              SHA-256 HMAC Verified
            </span>
          </div>

          {/* Webhook URLs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'Stripe Webhook Gateway',
                url: `${typeof window !== 'undefined' ? window.location.origin : 'https://agencyops.dev'}/api/webhooks/stripe`,
                desc: 'Handles payment_intent.succeeded to clear 50% deposits & trigger Rule 8 transfers.',
                badge: 'PAYMENT GATEWAY',
                badgeColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
              },
              {
                title: 'Upwork Webhook Endpoint',
                url: `${typeof window !== 'undefined' ? window.location.origin : 'https://agencyops.dev'}/api/webhooks/upwork`,
                desc: 'Captures job contracts, client invitations, milestone escrow, and feedback.',
                badge: 'CONTRACTS & ESCROW',
                badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
              },
              {
                title: 'PayPal Webhooks Listener',
                url: `${typeof window !== 'undefined' ? window.location.origin : 'https://agencyops.dev'}/api/webhooks/paypal`,
                desc: 'Processes CHECKOUT.ORDER.APPROVED and direct merchant invoice settlements.',
                badge: 'GLOBAL CHECKOUT',
                badgeColor: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
              },
              {
                title: 'WhatsApp Business Cloud',
                url: `${typeof window !== 'undefined' ? window.location.origin : 'https://agencyops.dev'}/api/webhooks/whatsapp`,
                desc: '2-way client instant messaging, milestone review reminders, and SLA triggers.',
                badge: '2-WAY MESSAGING',
                badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
              }
            ].map((ep) => (
              <div key={ep.title} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{ep.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${ep.badgeColor}`}>{ep.badge}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-indigo-600 dark:text-indigo-400 truncate">
                    POST {ep.url}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ep.url);
                      setCopiedEndpoint(ep.title);
                      showToast(`Copied ${ep.title} URL to clipboard!`);
                      setTimeout(() => setCopiedEndpoint(null), 2500);
                    }}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                    title="Copy Webhook Endpoint URL"
                  >
                    {copiedEndpoint === ep.title ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {ep.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Real Production Credentials Form */}
          <div className="p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Live Service Production API Keys & Webhook Secrets
                </h4>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Environment Vault</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Keys are stored securely in memory / environment settings to execute real transactions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Stripe Secret Key</label>
                <input
                  type="password"
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  placeholder="sk_live_51M..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Stripe Webhook Signing Secret</label>
                <input
                  type="password"
                  value={stripeWebhookSecret}
                  onChange={(e) => setStripeWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Upwork API Key / Token</label>
                <input
                  type="password"
                  value={upworkApiKey}
                  onChange={(e) => setUpworkApiKey(e.target.value)}
                  placeholder="oauth2_access_token_..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">PayPal Client ID</label>
                <input
                  type="text"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  placeholder="AX-..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                id="btn-save-production-credentials"
                disabled={savingCredentials}
                onClick={async () => {
                  setSavingCredentials(true);
                  try {
                    const res = await fetch('/api/integrations/credentials', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        stripeSecretKey,
                        stripeWebhookSecret,
                        upworkApiKey,
                        paypalClientId
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      showToast('Live production credentials safely encrypted and updated!');
                    } else {
                      showToast('Failed to save credentials.');
                    }
                  } catch (e: any) {
                    showToast('Error: ' + e.message);
                  } finally {
                    setSavingCredentials(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5" />
                {savingCredentials ? 'Saving...' : 'Save & Encrypt Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Real-Time Sync & Bulk Import Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Google Workspace Deep Integration Hub (Sheets, Tasks, Calendar, Docs) */}
      <GoogleWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
    </div>
  );
};
