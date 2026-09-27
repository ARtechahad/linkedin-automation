import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ApiToken } from '../types';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Send,
  Code,
  Terminal,
  RefreshCw,
  Clock,
  CheckCircle2,
  ExternalLink,
  Lock,
  Globe2,
  Building2,
  Sparkles
} from 'lucide-react';

export const ApiTokenManagementSection: React.FC = () => {
  const { showToast, refreshProjects, setActiveTab, role, currentUser } = useApp();

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [newTokenName, setNewTokenName] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['leads:write', 'realestate:write']);
  const [expiresInDays, setExpiresInDays] = useState<number>(90);
  const [recentlyCreatedToken, setRecentlyCreatedToken] = useState<{ rawToken: string; name: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Ingest Tester State
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [testPayload, setTestPayload] = useState<string>(JSON.stringify({
    clientName: "Jonathan Sterling",
    clientEmail: "sterling@sterling-realty.com",
    clientPhone: "+1 (305) 555-0199",
    clientCompany: "Sterling Luxury Miami Properties",
    websiteType: "corporate",
    purpose: "Luxury waterfront IDX real estate portal with automated property valuations and VIP investor deal room.",
    budget: 1850,
    source: "python_idx_scraper",
    propertyDetails: {
      mlsId: "MIA-99201",
      location: "Star Island, Miami Beach, FL",
      assetType: "Single Family Ultra-Luxury Villa",
      askingPrice: "$14,500,000"
    },
    assignedCollaborators: ["partner@vance-capital.com"]
  }, null, 2));
  const [isTestingIngest, setIsTestingIngest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      const res = await fetch('/api/api-tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
        // Auto-select first active token for test playground
        const active = (data.tokens || []).find((t: ApiToken) => !t.revokedAt);
        if (active && !selectedApiKey) {
          setSelectedApiKey(active.tokenPrefix);
        }
      }
    } catch (e) {
      console.error('Failed to load API tokens:', e);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) {
      showToast('Please specify a descriptive name for this API automation key.');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('alm_nexus_token') ? { Authorization: `Bearer ${localStorage.getItem('alm_nexus_token')}` } : {})
        },
        body: JSON.stringify({
          name: newTokenName.trim(),
          permissions: selectedPermissions,
          expiresInDays
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecentlyCreatedToken({
          rawToken: data.rawToken,
          name: data.token.name
        });
        setSelectedApiKey(data.rawToken);
        setNewTokenName('');
        showToast(`API Token "${data.token.name}" generated successfully.`);
        await fetchTokens();
      } else {
        showToast(`Error: ${data.error || 'Failed to generate token'}`);
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently revoke API Key "${name}"? Any external n8n workflows or Python scrapers using this key will be denied.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/api-tokens/${id}`, {
        method: 'DELETE',
        headers: {
          ...(localStorage.getItem('alm_nexus_token') ? { Authorization: `Bearer ${localStorage.getItem('alm_nexus_token')}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`API Key "${name}" revoked.`);
        await fetchTokens();
      } else {
        showToast(`Revocation error: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleCopy = (text: string, type: 'token' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 3000);
    } else {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 3000);
    }
    showToast('Copied to clipboard!');
  };

  const handleExecuteLiveIngest = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(testPayload);
    } catch (err: any) {
      showToast(`Invalid JSON syntax in payload: ${err.message}`);
      return;
    }

    const keyToUse = recentlyCreatedToken?.rawToken || selectedApiKey;
    if (!keyToUse) {
      showToast('Please generate or select an API Key first.');
      return;
    }

    try {
      setIsTestingIngest(true);
      setTestResult(null);

      const res = await fetch('/api/v1/leads/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': keyToUse
        },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      setTestResult({
        status: res.status,
        ok: res.ok,
        data
      });

      if (res.ok && data.success) {
        showToast(`🎉 Ingestion Success! Ingested ${data.count} lead into Discovery pipeline.`);
        await refreshProjects();
      } else {
        showToast(`Ingestion failed (${res.status}): ${data.error || 'Check API key & payload'}`);
      }
    } catch (e: any) {
      setTestResult({
        status: 500,
        ok: false,
        data: { error: e.message }
      });
      showToast(`Network request failed: ${e.message}`);
    } finally {
      setIsTestingIngest(false);
    }
  };

  const pythonSnippet = `# Inbound Lead Ingest - External Python Scraper Script
import requests
import json

API_ENDPOINT = "http://localhost:3000/api/v1/leads/ingest"
API_KEY = "${recentlyCreatedToken?.rawToken || 'sk_live_YOUR_GENERATED_API_KEY'}"

# Newly extracted real estate listing or freelance lead
payload = {
    "clientName": "Jonathan Sterling",
    "clientEmail": "sterling@sterling-realty.com",
    "clientCompany": "Sterling Luxury Real Estate Miami",
    "websiteType": "corporate",
    "purpose": "Luxury commercial listing portal with investor deal room and virtual 3D property tours",
    "budget": 1850,
    "source": "python_idx_scraper",
    "propertyDetails": {
        "mlsId": "IDX-Miami-9921",
        "location": "Brickell Avenue, Miami, FL",
        "valuation": "$4.5M"
    },
    "assignedCollaborators": ["partner@vance-capital.com"]
}

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

response = requests.post(API_ENDPOINT, json=payload, headers=headers)
print("Response Status:", response.status_code)
print("Pipeline Injection Result:", response.json())`;

  const curlSnippet = `curl -X POST "http://localhost:3000/api/v1/leads/ingest" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${recentlyCreatedToken?.rawToken || 'sk_live_YOUR_GENERATED_API_KEY'}" \\
  -d '{
    "clientName": "Elena Rostova",
    "clientEmail": "elena@monacoyachts.mc",
    "clientCompany": "Monaco Yachting & Maritime Charters",
    "websiteType": "ecommerce",
    "purpose": "Bespoke superyacht charter booking engine with crypto escrow payments",
    "budget": 2400,
    "source": "n8n_web_crawler",
    "assignedCollaborators": ["partner@vance-capital.com"]
  }'`;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 p-6 rounded-2xl border border-purple-500/20 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  API Token Generation & Inbound Automation Gateway
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  BD Head & Admin Restricted
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                Generate cryptographically secure SHA-256 API tokens to authorize external n8n workflows, Python web scrapers, and Real Estate IDX spiders to push leads directly into the Discovery Pipeline and PostgreSQL database.
              </p>
            </div>
          </div>
          <button
            onClick={fetchTokens}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTokens ? 'animate-spin' : ''}`} />
            <span>Refresh Keys</span>
          </button>
        </div>
      </div>

      {/* One-Time Token Reveal Alert */}
      {recentlyCreatedToken && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  New API Key Generated: {recentlyCreatedToken.name}
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Copy this key now. For enterprise security, we hash tokens with SHA-256 and only store the hash in PostgreSQL. You will not be able to retrieve the full secret key again.
                </p>
              </div>
            </div>
            <button
              onClick={() => setRecentlyCreatedToken(null)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 font-mono text-xs">
            <span className="truncate flex-1 text-slate-800 dark:text-slate-100 font-bold select-all">
              {recentlyCreatedToken.rawToken}
            </span>
            <button
              onClick={() => handleCopy(recentlyCreatedToken.rawToken, 'token')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 shadow-xs"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied!' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Two Column Grid: Generate Token Form + Active Tokens Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Token Generator Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Create Automation Token
            </h4>
          </div>

          <form onSubmit={handleGenerateToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Token Name / External Service
              </label>
              <input
                type="text"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                placeholder="e.g. n8n Real Estate Scraper"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Token Scopes &amp; Capabilities
              </label>
              <div className="space-y-2">
                {[
                  { id: 'leads:write', label: 'Push Inbound Leads (/api/v1/leads/ingest)' },
                  { id: 'realestate:write', label: 'Push Real Estate Property & IDX Scrapes' },
                  { id: 'deals:read', label: 'Query Deal Sheet Valuation Status' }
                ].map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, perm.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                        }
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Token Expiration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={30}>30 Days</option>
                <option value={90}>90 Days (Recommended)</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !newTokenName.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isGenerating ? 'Hashing & Generating...' : 'Generate Inbound API Key'}</span>
            </button>
          </form>
        </div>

        {/* Existing Tokens Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Active PostgreSQL API Tokens ({tokens.filter(t => !t.revokedAt).length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">
              Stored in Table <code className="font-mono text-purple-600 dark:text-purple-400 font-semibold">agency_api_tokens</code>
            </span>
          </div>

          {tokens.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No API tokens generated yet. Generate your first key to connect n8n or Python.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                    <th className="pb-2 font-semibold">Token Name</th>
                    <th className="pb-2 font-semibold">Key Identifier</th>
                    <th className="pb-2 font-semibold">Permissions</th>
                    <th className="pb-2 font-semibold">Created / Expiry</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {tokens.map((token) => {
                    const isRevoked = Boolean(token.revokedAt);
                    return (
                      <tr key={token.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {token.name}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            by {token.createdBy}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {token.tokenPrefix}...
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {(token.permissions || ['leads:write']).map((p) => (
                              <span key={p} className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px]">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 text-[11px] text-slate-500">
                          <span>{new Date(token.createdAt).toLocaleDateString()}</span>
                          {token.expiresAt && (
                            <span className="block text-[10px] text-slate-400">
                              Exp: {new Date(token.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {isRevoked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Revoked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {!isRevoked && (
                            <button
                              onClick={() => handleRevokeToken(token.id, token.name)}
                              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold transition"
                              title="Permanently Revoke Token"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Webhook Ingestion Playground */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Inbound Webhook Live Playground &amp; Real Estate Scraper Ingest
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Endpoint: <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">POST /api/v1/leads/ingest</code>
              </p>
            </div>
          </div>
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTestPayload(JSON.stringify({
                  clientName: "Alexander Vance",
                  clientEmail: "vance@apexholdings.us",
                  clientCompany: "Apex Commercial Real Estate Holdings",
                  websiteType: "corporate",
                  purpose: "Ultra-luxury institutional real estate portal with verified property deeds, investor room & virtual tours",
                  budget: 2200,
                  source: "python_idx_spider",
                  propertyDetails: {
                    mlsId: "IDX-Brickell-994",
                    location: "Brickell Financial District, Miami",
                    propertyType: "Commercial Mixed-Use Plaza",
                    valuation: "$18.5M"
                  },
                  assignedCollaborators: ["partner@vance-capital.com"]
                }, null, 2));
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
            >
              Real Estate IDX Preset
            </button>
            <button
              onClick={() => {
                setTestPayload(JSON.stringify({
                  clientName: "Nadia Petrov",
                  clientEmail: "nadia@petrov-couture.fr",
                  clientCompany: "Petrov Paris Haute Couture",
                  websiteType: "ecommerce",
                  purpose: "High-end bespoke Parisian fashion boutique with multi-currency checkout & private client fitting booking",
                  budget: 1600,
                  source: "n8n_crawler",
                  assignedCollaborators: ["partner@vance-capital.com"]
                }, null, 2));
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
            >
              E-Commerce Preset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Payload Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>JSON Payload (Lead or Array of Leads)</span>
              <span className="text-[11px] text-slate-400">Header: X-API-Key: sk_live_...</span>
            </div>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={12}
              className="w-full p-3 font-mono text-xs rounded-xl bg-slate-900 text-emerald-400 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
            />
            <button
              onClick={handleExecuteLiveIngest}
              disabled={isTestingIngest}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isTestingIngest ? 'Ingesting into Database...' : 'Execute Inbound Ingest Test (HTTP POST)'}</span>
            </button>
          </div>

          {/* Live Response & Pipeline Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Server Response &amp; Audit Log Confirmation</span>
              {testResult && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  HTTP {testResult.status}
                </span>
              )}
            </div>

            <div className="h-[285px] overflow-y-auto p-3 font-mono text-xs rounded-xl bg-slate-900 text-slate-200 border border-slate-700">
              {testResult ? (
                <pre className="whitespace-pre-wrap text-emerald-400 leading-relaxed">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Terminal className="w-8 h-8 mb-2 opacity-30" />
                  <span>Click "Execute Inbound Ingest Test" to simulate n8n / Python scraper ingestion.</span>
                </div>
              )}
            </div>

            {testResult?.ok && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Lead successfully injected into Discovery Pipeline!
                </span>
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className="font-bold underline hover:text-emerald-700"
                >
                  View in Pipeline &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer Snippets (Python & cURL) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Python Snippet */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                Python Scraper Integration (requests)
              </h5>
            </div>
            <button
              onClick={() => handleCopy(pythonSnippet, 'code')}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedCode === pythonSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Python Code</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
            {pythonSnippet}
          </pre>
        </div>

        {/* cURL Snippet */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                n8n Webhook / cURL Ingest Payload
              </h5>
            </div>
            <button
              onClick={() => handleCopy(curlSnippet, 'code')}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedCode === curlSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy cURL Command</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
            {curlSnippet}
          </pre>
        </div>

      </div>
    </div>
  );
};
