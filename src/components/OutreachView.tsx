import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScrapedLead, ScraperConfig, AIOutreachRequest, AIOutreachResponse, DripFollowUpStage } from '../types';
import { generateAI, generateOfflineFallback } from '../services/aiService';
import {
  Radar,
  Search,
  Sparkles,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  History,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  MessageSquare,
  Mail,
  Zap,
  Tag,
  Kanban,
  Server,
  Cloud
} from 'lucide-react';

export const OutreachView: React.FC = () => {
  const {
    refreshProjects,
    role,
    showToast,
    setActiveTab,
    outreachInitialData,
    aiSettings,
    setIsAISettingsModalOpen
  } = useApp();

  // Sub-tabs: 'scraper' | 'generator' | 'drip'
  const [activeSubTab, setActiveSubTab] = useState<'scraper' | 'generator' | 'drip'>('scraper');

  // ==========================================
  // 1. SCRAPER STATE
  // ==========================================
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [scraperConfig, setScraperConfig] = useState<ScraperConfig>({
    keywords: [
      'web developer needed',
      'e-commerce store setup',
      'Shopify expert',
      'Next.js landing page',
      'WordPress redesign'
    ],
    platforms: ['linkedin', 'upwork', 'twitter', 'freelancer'],
    autoInject: false,
    minBudget: 250,
    isScanningActive: true,
    lastScanTime: new Date().toISOString(),
    scanIntervalMinutes: 15
  });
  const [isScanning, setIsScanning] = useState(false);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [scraperFilterPlatform, setScraperFilterPlatform] = useState<string>('all');
  const [scraperSearchQuery, setScraperSearchQuery] = useState('');
  const [injectingLeadId, setInjectingLeadId] = useState<string | null>(null);

  // ==========================================
  // 2. AI OUTREACH GENERATOR STATE
  // ==========================================
  const [outreachForm, setOutreachForm] = useState<AIOutreachRequest>({
    channel: 'linkedin_connect',
    leadName: '',
    companyName: '',
    industry: 'Technology / SaaS',
    websiteType: 'corporate',
    problemOrNeed: 'Need an experienced web developer to design and deploy a responsive, high-converting website with custom staging preview.',
    portfolioUrl: 'https://clientops.agency/case-studies',
    valueHook: 'Private staging link within 5 days, 50/50 payment milestone protection, complete QA.',
    tone: 'consultative'
  });
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [generatedOutreach, setGeneratedOutreach] = useState<AIOutreachResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ==========================================
  // 3. SMART DRIP CAMPAIGN STATE
  // ==========================================
  const [dripCampaigns, setDripCampaigns] = useState<any[]>([]);
  const [dripTemplates, setDripTemplates] = useState<any[]>([]);
  const [isTriggeringDrip, setIsTriggeringDrip] = useState(false);
  const [selectedDripHistory, setSelectedDripHistory] = useState<{ clientName: string; history: any[] } | null>(null);

  // Load initial data from server
  useEffect(() => {
    fetchScraperLeads();
    fetchDripCampaigns();
  }, []);

  // When navigated with pre-filled lead data from pipeline or scraper
  useEffect(() => {
    if (outreachInitialData) {
      setOutreachForm(prev => ({
        ...prev,
        channel: outreachInitialData.channel === 'upwork' ? 'upwork_proposal' : 'linkedin_connect',
        leadName: outreachInitialData.clientName || prev.leadName,
        companyName: outreachInitialData.companyName || prev.companyName,
        websiteType: outreachInitialData.websiteType || prev.websiteType,
        problemOrNeed: outreachInitialData.purpose || prev.problemOrNeed
      }));
      setActiveSubTab('generator');
    }
  }, [outreachInitialData]);

  // Fetch Scraper data
  const fetchScraperLeads = async () => {
    try {
      const res = await fetch('/api/scraper/leads');
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        if (data.config) setScraperConfig(data.config);
      }
    } catch (err) {
      console.error('Error loading scraper leads:', err);
    }
  };

  // Fetch Drip Campaigns
  const fetchDripCampaigns = async () => {
    try {
      const res = await fetch('/api/drip/campaigns');
      const data = await res.json();
      if (data.success) {
        setDripCampaigns(data.campaigns || []);
        if (data.templates) setDripTemplates(data.templates);
      }
    } catch (err) {
      console.error('Error loading drip campaigns:', err);
    }
  };

  // Trigger Live Scan
  const handleRunLiveScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scraper/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        showToast(`⚡ Scraper scan finished: ${data.newlyFoundCount} new lead(s) discovered!`);
        await fetchScraperLeads();
        // Refresh global pipeline if any were auto-injected
        if (data.autoInjectedCount > 0) {
          await refreshProjects();
        }
      } else {
        showToast('Scan completed. No new unlisted leads found.');
      }
    } catch (err) {
      console.error('Live scan error:', err);
      showToast('Scan failed to complete.');
    } finally {
      setIsScanning(false);
    }
  };

  // Save Scraper Config
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/scraper/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scraperConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Scraper keywords & auto-inject settings updated.');
        setShowConfigModal(false);
      }
    } catch (err) {
      console.error('Error updating scraper config:', err);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    const kw = newKeywordInput.trim();
    if (!scraperConfig.keywords.includes(kw)) {
      setScraperConfig(prev => ({
        ...prev,
        keywords: [...prev.keywords, kw]
      }));
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setScraperConfig(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== kw)
    }));
  };

  // Inject lead into Discovery Pipeline
  const handleInjectLead = async (lead: ScrapedLead) => {
    setInjectingLeadId(lead.id);
    try {
      const res = await fetch(`/api/scraper/inject/${lead.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Injected "${lead.authorName}" directly into Discovery column!`);
        // Update local leads list
        setLeads(prev =>
          prev.map(l => (l.id === lead.id ? { ...l, injectedToPipeline: true, injectedProjectId: data.project?.id } : l))
        );
        // Refresh projects in global context
        await refreshProjects();
      } else {
        showToast(data.message || 'Failed to inject lead.');
      }
    } catch (err) {
      console.error('Error injecting lead:', err);
      showToast('Error injecting lead to pipeline.');
    } finally {
      setInjectingLeadId(null);
    }
  };

  // Generate AI Outreach
  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    try {
      const result = await generateAI(
        {
          taskType: 'outreach',
          clientName: outreachForm.clientName,
          companyName: outreachForm.clientCompany,
          channel: outreachForm.channel,
          websiteType: outreachForm.websiteType,
          leadSnippet: outreachForm.jobPostSnippet || outreachForm.customInstructions,
          jobPostTitle: outreachForm.jobPostTitle
        },
        aiSettings
      );

      setGeneratedOutreach({
        channel: outreachForm.channel,
        connectionRequestSnippet: result.connectionRequestSnippet || `Hi ${outreachForm.clientName}, saw your project regarding ${outreachForm.websiteType || 'web development'}. Would love to connect and share relevant client case studies!`,
        connectionCharCount: (result.connectionRequestSnippet || '').length,
        introductoryMessage: result.text,
        followUpNudge: result.followUpNudge || `Hi ${outreachForm.clientName}, following up on my previous note. We have a dedicated staging slot reserved for next week—let me know if you'd like to inspect a demo!`,
        recommendedSubject: result.suggestedSubject || `Web Development Proposal for ${outreachForm.clientCompany || outreachForm.clientName}`,
        modelUsed: `${result.providerUsed} (${result.modelUsed})`
      });

      if (result.isFallback) {
        showToast('Offline SOP fallback template loaded (Zero-downtime).');
      } else {
        showToast(`AI Outreach drafted according to SOP standards via ${result.providerUsed.toUpperCase()}!`);
      }
    } catch (err) {
      console.warn('AI outreach generation failed, applying emergency fallback:', err);
      const fallback = generateOfflineFallback({
        taskType: 'outreach',
        clientName: outreachForm.clientName,
        companyName: outreachForm.clientCompany,
        channel: outreachForm.channel,
        websiteType: outreachForm.websiteType,
        jobPostTitle: outreachForm.jobPostTitle
      });
      setGeneratedOutreach({
        channel: outreachForm.channel,
        connectionRequestSnippet: fallback.connectionRequestSnippet || '',
        connectionCharCount: (fallback.connectionRequestSnippet || '').length,
        introductoryMessage: fallback.text,
        followUpNudge: fallback.followUpNudge || '',
        recommendedSubject: fallback.suggestedSubject || 'Proposal',
        modelUsed: 'offline-sop-rules'
      });
      showToast('SOP emergency fallback template applied.');
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Global Drip Trigger Cycle
  const handleTriggerDripCycle = async () => {
    setIsTriggeringDrip(true);
    try {
      const res = await fetch('/api/drip/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Drip executed: ${data.executedCount} follow-ups sent!`);
        await fetchDripCampaigns();
      }
    } catch (err) {
      console.error('Error triggering drip cycle:', err);
    } finally {
      setIsTriggeringDrip(false);
    }
  };

  // Send single drip follow-up
  const handleSendSingleDrip = async (projectId: string, clientName: string) => {
    try {
      const res = await fetch(`/api/drip/send-now/${projectId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Follow-up email dispatched to ${clientName}!`);
        await fetchDripCampaigns();
      }
    } catch (err) {
      console.error('Error dispatching drip message:', err);
    }
  };

  // Toggle Drip for project
  const handleToggleDrip = async (projectId: string) => {
    try {
      const res = await fetch(`/api/drip/toggle/${projectId}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await fetchDripCampaigns();
      }
    } catch (err) {
      console.error('Error toggling drip status:', err);
    }
  };

  // Filtered scraped leads
  const filteredLeads = leads.filter(l => {
    const matchesPlatform = scraperFilterPlatform === 'all' || l.platform === scraperFilterPlatform;
    const matchesSearch =
      scraperSearchQuery === '' ||
      l.title.toLowerCase().includes(scraperSearchQuery.toLowerCase()) ||
      l.authorName.toLowerCase().includes(scraperSearchQuery.toLowerCase()) ||
      l.companyName.toLowerCase().includes(scraperSearchQuery.toLowerCase()) ||
      l.postSnippet.toLowerCase().includes(scraperSearchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                <Radar className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Agent-Reach: Automated Lead Generation & Outreach
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Phase 1 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Automated social scraping from LinkedIn & Upwork, AI cold message drafting with LinkedIn 300-char limits, and a smart 50% advance delay drip campaign engine.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('scraper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'scraper'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>Platform Scraper</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('generator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'generator'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Outreach Generator</span>
            </button>

            <button
              onClick={() => setActiveSubTab('drip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'drip'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span>50% Advance Drip Engine</span>
              {dripCampaigns.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                  {dripCampaigns.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SOCIAL & PLATFORM SCRAPER VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'scraper' && (
        <div className="space-y-6">
          {/* Status & Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Total Scraped Opportunities</p>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{leads.length}</h4>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  {leads.filter(l => l.matchScore >= 95).length} High-Intent (≥95%)
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Radar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Injected to Discovery Column</p>
                <h4 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {leads.filter(l => l.injectedToPipeline).length}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Direct into Kanban Pipeline</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Kanban className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Monitored Keywords</p>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {scraperConfig.keywords.length}
                </h4>
                <p className="text-[10px] text-indigo-500 truncate max-w-[160px] mt-0.5">
                  "{scraperConfig.keywords[0]}", ...
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Tag className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Auto-Inject Status</p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      scraperConfig.autoInject ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {scraperConfig.autoInject ? 'Instant Auto-Inject ON' : 'Manual Review Gate'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Min Budget: ${scraperConfig.minBudget} USD
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Configure Scraper"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Bar & Search / Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search leads, keywords, companies..."
                  value={scraperSearchQuery}
                  onChange={e => setScraperSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Platform filter tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                {['all', 'linkedin', 'upwork', 'twitter', 'freelancer'].map(plat => (
                  <button
                    key={plat}
                    onClick={() => setScraperFilterPlatform(plat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition cursor-pointer ${
                      scraperFilterPlatform === plat
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {plat === 'all' ? 'All Platforms' : plat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Keywords & Rules</span>
              </button>

              <button
                onClick={handleRunLiveScan}
                disabled={isScanning}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Live Streams...' : 'Run Live Scan Now'}</span>
              </button>
            </div>
          </div>

          {/* Scraped Leads List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Radar className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching leads found</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click "Run Live Scan Now" to scan LinkedIn & Upwork for active keywords.
                </p>
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isLinkedIn = lead.platform === 'linkedin';
                const isUpwork = lead.platform === 'upwork';
                const isTwitter = lead.platform === 'twitter';

                return (
                  <div
                    key={lead.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Bar: Platform + Match Score + Estimated Budget */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isLinkedIn
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                : isUpwork
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isTwitter
                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            }`}
                          >
                            <span>●</span>
                            <span>{lead.platform}</span>
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                            {lead.matchScore}% Match
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            ${lead.estimatedBudget} USD
                          </span>
                          <span className="block text-[9px] uppercase font-semibold text-slate-400">
                            {lead.detectedWebsiteType}
                          </span>
                        </div>
                      </div>

                      {/* Lead Title & Snippet */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-2">
                        {lead.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        "{lead.postSnippet}"
                      </p>

                      {/* Author & Matched Keyword */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.authorName}</span>
                          {lead.authorTitle && <span className="text-slate-400"> • {lead.authorTitle}</span>}
                          {lead.companyName && <span className="block text-[10px] text-slate-400">{lead.companyName}</span>}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                          <Tag className="w-3 h-3" />
                          <span>Matched: "{lead.matchedKeyword}"</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium"
                      >
                        <span>View Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-1.5">
                        {/* AI Outreach prefill button */}
                        <button
                          onClick={() => {
                            setOutreachForm(prev => ({
                              ...prev,
                              channel: lead.platform === 'upwork' ? 'upwork_proposal' : 'linkedin_connect',
                              leadName: lead.authorName,
                              companyName: lead.companyName,
                              websiteType: lead.detectedWebsiteType || 'custom',
                              problemOrNeed: lead.postSnippet
                            }));
                            setActiveSubTab('generator');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>AI Outreach</span>
                        </button>

                        {/* Pipeline Inject button */}
                        {lead.injectedToPipeline ? (
                          <button
                            onClick={() => setActiveTab('pipeline')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>In Discovery</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleInjectLead(lead)}
                            disabled={injectingLeadId === lead.id}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{injectingLeadId === lead.id ? 'Injecting...' : 'Inject to Pipeline'}</span>
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
      )}

      {/* ======================================================== */}
      {/* 2. AI COLD OUTREACH & CONNECTION GENERATOR VIEW */}
      {/* ======================================================== */}
      {activeSubTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Side (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Target Prospect & Outreach Parameters</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically draft tailored connection notes (≤300 chars) and introductory proposals following SOP Rule 1.
              </p>
            </div>

            {/* Channel Selection */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Outreach Channel Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'linkedin_connect', label: 'LinkedIn Connect', desc: 'Strictly ≤ 300 char note' },
                  { id: 'upwork_proposal', label: 'Upwork Proposal', desc: 'Milestone & staging focus' },
                  { id: 'cold_email', label: 'B2B Cold Email', desc: 'High open-rate subject' },
                  { id: 'twitter_dm', label: 'Twitter / X DM', desc: 'Conversational pitch' }
                ].map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setOutreachForm(prev => ({ ...prev, channel: ch.id as any }))}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      outreachForm.channel === ch.id
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{ch.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{ch.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prospect Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Prospect / Lead Name
                </label>
                <input
                  type="text"
                  value={outreachForm.leadName}
                  onChange={e => setOutreachForm(prev => ({ ...prev, leadName: e.target.value }))}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={outreachForm.companyName}
                  onChange={e => setOutreachForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. CloudPulse Tech"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Website Type & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Website Type
                </label>
                <select
                  value={outreachForm.websiteType}
                  onChange={e => setOutreachForm(prev => ({ ...prev, websiteType: e.target.value as any }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="landing">Landing Page ($250)</option>
                  <option value="ecommerce">E-commerce ($650)</option>
                  <option value="corporate">Corporate Multi-page ($950+)</option>
                  <option value="custom">Custom Web Application</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Outreach Tone
                </label>
                <select
                  value={outreachForm.tone}
                  onChange={e => setOutreachForm(prev => ({ ...prev, tone: e.target.value as any }))}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="consultative">Consultative & Authoritative</option>
                  <option value="direct">Direct & High-Converting</option>
                  <option value="friendly">Friendly & Collaborative</option>
                </select>
              </div>
            </div>

            {/* Client Need or Pain Point */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Detected Client Need or Pain Point
              </label>
              <textarea
                rows={3}
                value={outreachForm.problemOrNeed}
                onChange={e => setOutreachForm(prev => ({ ...prev, problemOrNeed: e.target.value }))}
                placeholder="What did the client state in their post or RFP?"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Value Hook */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Value Hook / Staging & Payment Security
              </label>
              <input
                type="text"
                value={outreachForm.valueHook}
                onChange={e => setOutreachForm(prev => ({ ...prev, valueHook: e.target.value }))}
                placeholder="e.g. Dedicated staging link within 5 days, 50% advance protection"
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Submit Button & AI Provider Indicator */}
            <div className="space-y-1.5">
              <button
                onClick={handleGenerateOutreach}
                disabled={isGeneratingOutreach}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingOutreach ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
                <span>
                  {isGeneratingOutreach
                    ? 'Drafting Tailored Messages...'
                    : aiSettings.provider === 'local'
                    ? `Draft via Local AI (${aiSettings.localModel})`
                    : aiSettings.provider === 'cloud'
                    ? `Draft with Cloud AI (${aiSettings.cloudService})`
                    : 'Draft with Offline SOP Templates'}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                <span>Active Provider:</span>
                <button
                  type="button"
                  onClick={() => setIsAISettingsModalOpen(true)}
                  className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {aiSettings.provider === 'local' ? (
                    <>
                      <Server className="w-2.5 h-2.5 text-emerald-500" />
                      <span>Ollama ({aiSettings.localModel})</span>
                    </>
                  ) : aiSettings.provider === 'cloud' ? (
                    <>
                      <Cloud className="w-2.5 h-2.5 text-blue-500" />
                      <span>Cloud ({aiSettings.cloudService})</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      <span>Offline SOP</span>
                    </>
                  )}
                  <Sliders className="w-2.5 h-2.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Side (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {!generatedOutreach ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Ready to draft customized client outreach
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Fill in the prospect details on the left or select any lead from the Scraper tab to generate personalized connection notes and proposals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. LinkedIn Connection Snippet (strictly <= 300 chars) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        LinkedIn Connection Request Note
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Character limit watchdog */}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          generatedOutreach.connectionCharCount <= 300
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                        }`}
                      >
                        {generatedOutreach.connectionCharCount} / 300 chars
                      </span>

                      <button
                        onClick={() => handleCopy(generatedOutreach.connectionRequestSnippet, 'snippet')}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition"
                      >
                        {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-sans text-slate-800 dark:text-slate-200 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 leading-relaxed select-all">
                    {generatedOutreach.connectionRequestSnippet}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    LinkedIn strictly truncates invitations longer than 300 characters. This snippet is verified to fit without truncation.
                  </p>
                </div>

                {/* 2. Full Introductory Message / Upwork Proposal */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Full Introductory Message & Scope Proposal
                      </h4>
                    </div>

                    <button
                      onClick={() => handleCopy(generatedOutreach.introductoryMessage, 'intro')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedKey === 'intro' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'intro' ? 'Copied' : 'Copy Proposal'}</span>
                    </button>
                  </div>

                  {generatedOutreach.recommendedSubject && (
                    <div className="text-[11px] p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 font-medium">
                      <span className="font-bold">Suggested Subject: </span>
                      <span>{generatedOutreach.recommendedSubject}</span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed select-all">
                    {generatedOutreach.introductoryMessage}
                  </div>
                </div>

                {/* 3. 48-Hour Follow-Up Nudge */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        48-Hour Follow-Up Nudge (if no reply)
                      </h4>
                    </div>

                    <button
                      onClick={() => handleCopy(generatedOutreach.followUpNudge, 'nudge')}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedKey === 'nudge' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'nudge' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-xs font-sans text-slate-800 dark:text-slate-200 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 leading-relaxed select-all">
                    {generatedOutreach.followUpNudge}
                  </p>
                </div>

                {/* Quick Share to Team Chat */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                  <span className="text-indigo-900 dark:text-indigo-200 font-medium">
                    Share this drafted outreach pitch with the sales & coordination desk in Team Chat?
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await fetch('/api/chat/messages', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            senderId: 'user-sales-1',
                            senderName: 'Sales Specialist',
                            senderRole: role || 'sales',
                            channel: 'sales-leads',
                            content: `🎯 **AI Outreach Drafted for ${outreachForm.leadName || 'Prospect'} (${outreachForm.companyName || 'Lead'})**\nChannel: ${outreachForm.channel}\n\nSnippet:\n"${generatedOutreach.connectionRequestSnippet}"\n\nFull Proposal Pitch:\n${generatedOutreach.introductoryMessage.slice(0, 300)}...`
                          })
                        });
                        showToast('Shared outreach draft to #sales-leads chat!');
                      } catch (err) {
                        showToast('Failed to post to chat.');
                      }
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition cursor-pointer"
                  >
                    Share in Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SMART FOLLOW-UP SCHEDULER & DRIP CAMPAIGN ENGINE */}
      {/* ======================================================== */}
      {activeSubTab === 'drip' && (
        <div className="space-y-6">
          {/* Watchdog Notice Header */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  50% Advance Payment Watchdog & Automated Drip Sequence
                </h4>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed max-w-2xl">
                  According to SOP Section 5, engineering work cannot begin without a 50% advance payment. If a client delays past 24 hours, the system automatically triggers standardized multi-stage follow-ups (Day 1, 3, 5, 7) to hold their sprint slot and protect agency cash flow.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleTriggerDripCycle}
                disabled={isTriggeringDrip}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isTriggeringDrip ? 'animate-spin' : ''}`} />
                <span>{isTriggeringDrip ? 'Evaluating Sequences...' : 'Run Drip Cycle Now'}</span>
              </button>
            </div>
          </div>

          {/* Drip Stages Timeline Overview */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Standardized 4-Stage Advance Follow-Up Sequence
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  stage: 1,
                  days: 'Day 1 (24h)',
                  title: 'Sprint Slot Reservation',
                  desc: 'Confirms sprint reservation & provides secure PayPal/Payoneer payment details.'
                },
                {
                  stage: 2,
                  days: 'Day 3 (72h)',
                  title: 'Staging Server Hold',
                  desc: 'Highlights dedicated private staging environment readiness to maintain momentum.'
                },
                {
                  stage: 3,
                  days: 'Day 5 (120h)',
                  title: 'Technical Audit & Soft Urgency',
                  desc: 'Shares complimentary SEO/mobile checklist & reminds of 4-project per sprint limit.'
                },
                {
                  stage: 4,
                  days: 'Day 7 (168h)',
                  title: 'Graceful Scope Archival',
                  desc: 'Polite breakup notice that safely closes the open estimate while leaving door open.'
                }
              ].map(s => (
                <div
                  key={s.stage}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Stage {s.stage}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{s.days}</span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white pt-1">{s.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Client Campaigns Table / Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Clients with Pending 50% Advance ({dripCampaigns.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Auto-dispatches at specified intervals
              </span>
            </div>

            {dripCampaigns.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  All Client Advance Payments are Up to Date!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  No scoped projects currently have overdue 50% advance deposits.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dripCampaigns.map(camp => {
                  return (
                    <div
                      key={camp.projectId}
                      className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                    >
                      {/* Left info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {camp.clientName}
                          </h5>
                          <span className="text-[10px] text-slate-400">({camp.clientCompany})</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {camp.daysPendingAdvance} days pending
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            Total: <strong className="text-slate-700 dark:text-slate-300">${camp.finalPrice}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            50% Advance Due:{' '}
                            <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                              ${camp.advanceAmount} USD
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="capitalize">{camp.websiteType}</span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {/* Current Stage Badge */}
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                            Stage {camp.currentStage} / 4
                          </span>
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {camp.history.length} email(s) sent
                          </span>
                        </div>

                        {/* History button */}
                        {camp.history.length > 0 && (
                          <button
                            onClick={() =>
                              setSelectedDripHistory({ clientName: camp.clientName, history: camp.history })
                            }
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                          >
                            <History className="w-3 h-3 text-slate-400" />
                            <span>Logs ({camp.history.length})</span>
                          </button>
                        )}

                        {/* Toggle active switch */}
                        <button
                          onClick={() => handleToggleDrip(camp.projectId)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            camp.dripEnabled
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300'
                          }`}
                        >
                          {camp.dripEnabled ? 'Pause Drip' : 'Resume Drip'}
                        </button>

                        {/* Send Now Button */}
                        <button
                          onClick={() => handleSendSingleDrip(camp.projectId, camp.clientName)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Stage {camp.currentStage} Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Scraper Keywords & Auto-Inject Rules */}
      {/* ======================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Social & Platform Scraper Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Keyword Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Monitored Intent Keywords (LinkedIn & Upwork):
              </label>

              <div className="flex flex-wrap gap-1.5">
                {scraperConfig.keywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 text-xs font-medium"
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-rose-500 cursor-pointer ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Keyword Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder='Add keyword (e.g. "Shopify store setup")'
                  value={newKeywordInput}
                  onChange={e => setNewKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleAddKeyword}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Auto Inject Toggle */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                  Direct Pipeline Auto-Injection
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically insert newly discovered leads into Kanban Discovery column.
                </p>
              </div>
              <input
                type="checkbox"
                checked={scraperConfig.autoInject}
                onChange={e =>
                  setScraperConfig(prev => ({ ...prev, autoInject: e.target.checked }))
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Min Budget Threshold */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Project Budget ($ USD)
              </label>
              <input
                type="number"
                value={scraperConfig.minBudget}
                onChange={e =>
                  setScraperConfig(prev => ({ ...prev, minBudget: Number(e.target.value) || 0 }))
                }
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Drip Campaign History Logs */}
      {/* ======================================================== */}
      {selectedDripHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Follow-Up Drip Log: {selectedDripHistory.clientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDripHistory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedDripHistory.history.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Stage {h.stage} Dispatched
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Subject: {h.subject}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {h.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDripHistory(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
