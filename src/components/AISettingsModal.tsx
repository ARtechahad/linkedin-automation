import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Cloud,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Terminal,
  Key,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { AISettings, AIProviderType, CloudAIService } from '../types';
import {
  getSavedAISettings,
  saveAISettings,
  testLocalOllama,
  testCloudProvider,
  generateAI
} from '../services/aiService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<AISettings>(getSavedAISettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string; latency?: number } | null>(null);
  const [detectedLocalModels, setDetectedLocalModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'provider' | 'advanced' | 'test'>('provider');

  // Interactive Live Prompt Playground
  const [testPrompt, setTestPrompt] = useState('Draft a 50% advance milestone follow-up for a corporate website client.');
  const [playgroundOutput, setPlaygroundOutput] = useState('');
  const [isGeneratingPlayground, setIsGeneratingPlayground] = useState(false);
  const [playgroundMeta, setPlaygroundMeta] = useState<{ provider: string; model: string; fallback: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedAISettings();
      setSettings(current);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderSelect = (provider: AIProviderType) => {
    setSettings(prev => ({
      ...prev,
      provider,
      lastConnectionStatus: 'untested',
      statusMessage: provider === 'manual' ? 'Offline SOP Mode Active' : 'Ready'
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    if (settings.provider === 'local') {
      const res = await testLocalOllama(settings.localEndpoint, settings.localModel);
      setTestResult({
        ok: res.ok,
        message: res.message,
        latency: res.latencyMs
      });
      if (res.models && res.models.length > 0) {
        setDetectedLocalModels(res.models);
      }
      setSettings(prev => ({
        ...prev,
        lastConnectionStatus: res.ok ? 'connected' : 'error',
        lastTestedAt: new Date().toISOString(),
        statusMessage: res.ok ? `Connected to Ollama (${res.latencyMs}ms)` : 'Connection Failed'
      }));
    } else if (settings.provider === 'cloud') {
      const res = await testCloudProvider(settings.cloudService, settings.cloudApiKey || '', settings.cloudModel);
      setTestResult({
        ok: res.ok,
        message: res.message,
        latency: res.latencyMs
      });
      setSettings(prev => ({
        ...prev,
        lastConnectionStatus: res.ok ? 'connected' : 'error',
        lastTestedAt: new Date().toISOString(),
        statusMessage: res.ok ? `Cloud API Verified (${res.latencyMs}ms)` : 'API Check Failed'
      }));
    } else {
      setTestResult({
        ok: true,
        message: 'Manual / Offline mode requires no network connection. All SOP rules run instantly in-memory.',
        latency: 0
      });
    }
    setIsTesting(false);
  };

  const handleRunPlayground = async () => {
    setIsGeneratingPlayground(true);
    setPlaygroundOutput('');
    setPlaygroundMeta(null);
    try {
      const res = await generateAI(
        {
          taskType: 'general',
          prompt: testPrompt,
          clientName: 'Alexander Vance',
          websiteType: 'corporate',
          channel: 'linkedin'
        },
        settings
      );
      setPlaygroundOutput(res.text);
      setPlaygroundMeta({
        provider: res.providerUsed,
        model: res.modelUsed,
        fallback: res.isFallback
      });
    } catch (err: any) {
      setPlaygroundOutput(`Generation Error: ${err.message}`);
    } finally {
      setIsGeneratingPlayground(false);
    }
  };

  const handleSave = () => {
    saveAISettings(settings);
    if (onSettingsUpdated) {
      onSettingsUpdated(settings);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hybrid &amp; Local-First AI Architecture
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Zero-Downtime
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch seamlessly between Local Ollama, Cloud LLMs, and 100% Offline SOP Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Nav Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 px-6">
          <button
            onClick={() => setActiveTab('provider')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'provider'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-900/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Provider Selection
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'advanced'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-900/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Fallback &amp; Reliability
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white/60 dark:bg-slate-900/60'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Live Playground
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'provider' && (
            <div className="space-y-5">
              
              {/* 3 Main Choice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* 1. Local AI */}
                <div
                  onClick={() => handleProviderSelect('local')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    settings.provider === 'local'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Server className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                        Local-First
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Local AI (Ollama)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Runs locally on your machine with Ollama or LM Studio. Zero API fees &amp; 100% data privacy.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Default: localhost:11434
                  </div>
                </div>

                {/* 2. Cloud AI */}
                <div
                  onClick={() => handleProviderSelect('cloud')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    settings.provider === 'cloud'
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300">
                        High-Speed
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cloud AI
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Gemini 3.8 Flash, Groq ultra-fast Llama, or OpenRouter for maximum model flexibility.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Gemini Flash / Groq / OpenRouter
                  </div>
                </div>

                {/* 3. Manual / Offline */}
                <div
                  onClick={() => handleProviderSelect('manual')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    settings.provider === 'manual'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300">
                        Zero-Fail
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Manual / Offline Mode
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Deterministic SOP rule templates. Works 100% offline with zero dependencies or API keys.
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Instantaneous 0ms Response
                  </div>
                </div>
              </div>

              {/* Provider Configuration Forms */}
              {settings.provider === 'local' && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Local Ollama / Custom API Configuration
                    </h5>
                    <a
                      href="https://ollama.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Install Ollama</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={settings.localEndpoint}
                        onChange={e => setSettings(prev => ({ ...prev, localEndpoint: e.target.value }))}
                        placeholder="http://localhost:11434"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Default for Ollama is <code className="text-emerald-600 dark:text-emerald-400">http://localhost:11434</code> (or LM Studio <code className="text-emerald-600 dark:text-emerald-400">http://localhost:1234/v1</code>)
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={settings.localModel}
                        onChange={e => setSettings(prev => ({ ...prev, localModel: e.target.value }))}
                        placeholder="llama3.2, qwen2.5, mistral"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Recommended: <span className="font-semibold">llama3.2</span>, <span className="font-semibold">qwen2.5:7b</span>, or <span className="font-semibold">mistral</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Model Badges if detected */}
                  {detectedLocalModels.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-2">
                        Detected Models:
                      </span>
                      <div className="inline-flex flex-wrap gap-1 mt-1">
                        {detectedLocalModels.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, localModel: m }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                              settings.localModel === m
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pro Tip */}
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">CORS Notice:</span> If connecting directly from a browser, start Ollama with:
                      <code className="block mt-1 font-mono text-[10px] bg-slate-200 dark:bg-slate-900 p-1 rounded">
                        OLLAMA_ORIGINS="*" ollama serve
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {settings.provider === 'cloud' && (
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/10 space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud AI Provider &amp; API Key Settings
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cloud Service
                      </label>
                      <select
                        value={settings.cloudService}
                        onChange={e => {
                          const svc = e.target.value as CloudAIService;
                          let defaultModel = 'gemini-3.8-flash';
                          if (svc === 'groq') defaultModel = 'llama-3.3-70b-versatile';
                          if (svc === 'openrouter') defaultModel = 'anthropic/claude-3.5-sonnet';
                          setSettings(prev => ({
                            ...prev,
                            cloudService: svc,
                            cloudModel: defaultModel
                          }));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="gemini">Google Gemini (Default: 3.8 Flash)</option>
                        <option value="groq">Groq (Ultra-Fast Llama 3.3)</option>
                        <option value="openrouter">OpenRouter (Multi-Model Gateway)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Model Identifier
                      </label>
                      <input
                        type="text"
                        value={settings.cloudModel}
                        onChange={e => setSettings(prev => ({ ...prev, cloudModel: e.target.value }))}
                        placeholder="gemini-3.8-flash"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      API Key (Optional for Built-in Gemini)
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.cloudApiKey || ''}
                        onChange={e => setSettings(prev => ({ ...prev, cloudApiKey: e.target.value }))}
                        placeholder={settings.cloudService === 'gemini' ? 'Uses server GEMINI_API_KEY if left blank' : 'Enter API Key (e.g. gsk_...)'}
                        className="w-full pl-8 pr-10 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {settings.cloudService === 'gemini'
                        ? 'Leave blank to use the secure server-side environment Gemini API.'
                        : `Key is stored locally in your browser session for direct authenticated calls.`}
                    </p>
                  </div>
                </div>
              )}

              {settings.provider === 'manual' && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Offline SOP Rules Engine Active
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The entire application functions with 100% fidelity without any external AI model:
                  </p>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                    <li><strong className="text-slate-900 dark:text-white">Upwork &amp; InMail Proposals:</strong> Generated from battle-tested agency templates (SOP Rules 1, 4, and 5).</li>
                    <li><strong className="text-slate-900 dark:text-white">Smart Sentiment &amp; Intent:</strong> Analyzed deterministically via weighted keyword scoring (pricing, revisions, hesitations).</li>
                    <li><strong className="text-slate-900 dark:text-white">Lead Scoring &amp; Priorities:</strong> Computed from budget thresholds, urgency timeline, and scope completeness.</li>
                  </ul>
                </div>
              )}

              {/* Test Connection Button & Output */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection...' : `Test ${settings.provider === 'local' ? 'Local Ollama' : settings.provider === 'cloud' ? 'Cloud API' : 'Engine'}`}</span>
                </button>

                {testResult && (
                  <div className={`text-xs flex items-center gap-1.5 font-medium ${
                    testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate max-w-md">{testResult.message}</span>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Automatic Fallback to Offline SOP Engine
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      If Local Ollama is offline or Cloud API returns an error / rate-limit, seamlessly switch to built-in agency templates without crashing.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="chk-fallback"
                    checked={settings.fallbackToManual}
                    onChange={e => setSettings(prev => ({ ...prev, fallbackToManual: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 mt-1 cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temperature (Creativity): {settings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.temperature}
                    onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Strict SOP Adherence (0.0)</span>
                    <span>Balanced (0.7)</span>
                    <span>Creative Pitching (1.0)</span>
                  </div>
                </div>
              </div>

              {/* Zero Failure Architecture Explainer */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                <h5 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Enterprise Zero-Failure Guarantee
                </h5>
                <p className="text-xs text-indigo-950/80 dark:text-indigo-300/80 leading-relaxed">
                  Every AI-powered endpoint (Upwork Proposal Generator, Client Sentiment Classifier, Lead Scoring Matrix, and 15-Minute SLA Auto-Reply) executes through our centralized dispatcher:
                </p>
                <div className="font-mono text-[10px] bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 text-slate-800 dark:text-slate-200 space-y-1">
                  <div>1. Selected Provider Call (Local Ollama / Cloud LLM)</div>
                  <div className="text-amber-600 dark:text-amber-400">↳ If connection timeout / error → Trigger Fallback Rule</div>
                  <div className="text-emerald-600 dark:text-emerald-400">↳ Return High-Converting Pre-Built SOP Template (Zero Crash)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Prompt (Simulate Live AI Call)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={e => setTestPrompt(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleRunPlayground}
                    disabled={isGeneratingPlayground}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingPlayground ? 'animate-pulse' : ''}`} />
                    <span>{isGeneratingPlayground ? 'Generating...' : 'Run Test'}</span>
                  </button>
                </div>
              </div>

              {/* Output */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Dispatcher Output:
                  </label>
                  {playgroundMeta && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Provider: <strong className="text-indigo-600 dark:text-indigo-400">{playgroundMeta.provider}</strong> • Model: {playgroundMeta.model} {playgroundMeta.fallback && '(Fallback Used)'}
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap min-h-[140px] max-h-[220px] overflow-y-auto">
                  {playgroundOutput || (
                    <span className="text-slate-400 italic">Click "Run Test" to observe how the selected provider and fallback system responds...</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              settings.provider === 'local'
                ? 'bg-emerald-500'
                : settings.provider === 'cloud'
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`}></span>
            <span>
              Active: <strong className="text-slate-800 dark:text-slate-200">{settings.provider === 'local' ? `Local Ollama (${settings.localModel})` : settings.provider === 'cloud' ? `Cloud (${settings.cloudService})` : 'Offline SOP Rules'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Save AI Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
