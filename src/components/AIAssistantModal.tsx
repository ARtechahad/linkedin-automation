import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Globe,
  Sliders,
  Server,
  Cloud,
  Zap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { generateAI } from '../services/aiService';

export const AIAssistantModal: React.FC = () => {
  const {
    isAIModalOpen,
    setIsAIModalOpen,
    aiInitialData,
    showToast,
    aiSettings,
    setIsAISettingsModalOpen
  } = useApp();

  const [mode, setMode] = useState<string>('inquiry_response');
  const [clientName, setClientName] = useState('');
  const [websiteType, setWebsiteType] = useState('landing');
  const [channel, setChannel] = useState('Upwork');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<{ provider: string; model: string; isFallback: boolean; fallbackReason?: string } | null>(null);

  useEffect(() => {
    if (aiInitialData) {
      if (aiInitialData.clientName) setClientName(aiInitialData.clientName);
      if (aiInitialData.websiteType) setWebsiteType(aiInitialData.websiteType);
      if (aiInitialData.channel) setChannel(aiInitialData.channel);
      if (aiInitialData.mode) setMode(aiInitialData.mode);
    }
  }, [aiInitialData]);

  if (!isAIModalOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedText('');
    setGenerationMeta(null);
    try {
      const result = await generateAI(
        {
          taskType: 'proposal',
          mode,
          clientName: clientName.trim() || 'Client',
          websiteType,
          channel,
          additionalNotes
        },
        aiSettings
      );

      setGeneratedText(result.text);
      setGenerationMeta({
        provider: result.providerUsed,
        model: result.modelUsed,
        isFallback: result.isFallback,
        fallbackReason: result.fallbackReason
      });

      if (result.isFallback) {
        showToast('Offline SOP fallback template loaded (Zero-downtime).');
      } else {
        showToast(`Draft generated successfully via ${result.providerUsed.toUpperCase()}!`);
      }
    } catch (e: any) {
      setGeneratedText('Error connecting to AI service: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                SOP AI Sales &amp; Coordination Assistant
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-500">
                  Enforcing International SOP Rules 1-11
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                {/* Active Provider Badge */}
                <button
                  type="button"
                  onClick={() => setIsAISettingsModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded hover:underline transition bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  title="Configure AI Provider"
                >
                  {aiSettings.provider === 'local' ? (
                    <>
                      <Server className="w-3 h-3 text-emerald-500" />
                      <span>Local Ollama ({aiSettings.localModel})</span>
                    </>
                  ) : aiSettings.provider === 'cloud' ? (
                    <>
                      <Cloud className="w-3 h-3 text-blue-500" />
                      <span>Cloud ({aiSettings.cloudService})</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Offline SOP Rules</span>
                    </>
                  )}
                  <Sliders className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAIModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Select SOP Action Type:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMode('inquiry_response')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                  mode === 'inquiry_response'
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Inquiry Reply (SOP 1)
              </button>
              <button
                type="button"
                onClick={() => setMode('pricing_proposal')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                  mode === 'pricing_proposal'
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Quote Pitch (SOP 4)
              </button>
              <button
                type="button"
                onClick={() => setMode('hosting_guide')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                  mode === 'hosting_guide'
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Hosting Guide (SOP 3)
              </button>
              <button
                type="button"
                onClick={() => setMode('staging_review')}
                className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                  mode === 'staging_review'
                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Staging Ready (SOP 8)
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Client / Prospect Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Website Category
              </label>
              <select
                value={websiteType}
                onChange={e => setWebsiteType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="landing">Landing Page ($200-$300)</option>
                <option value="ecommerce">E-commerce ($500-$700)</option>
                <option value="corporate">Corporate Site ($800+)</option>
                <option value="custom">Custom Web Application</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Channel
              </label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Upwork">Upwork Direct Proposal</option>
                <option value="LinkedIn">LinkedIn InMail / DM</option>
                <option value="Email">Email Communication</option>
                <option value="WhatsApp">WhatsApp Business</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Additional Context / Specific Requirements
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Client mentioned they need Stripe checkout and multi-language support. Staging link ready."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Executing AI Dispatcher...' : 'Generate SOP-Compliant Message'}</span>
          </button>

          {/* Fallback Notice if used */}
          {generationMeta?.isFallback && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Offline SOP Fallback Triggered:</strong> {generationMeta.fallbackReason || 'Switched to pre-built templates seamlessly.'}
              </span>
            </div>
          )}

          {/* Generated Result Output */}
          {generatedText && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Generated Output:
                  </span>
                  {generationMeta && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Engine: <strong>{generationMeta.provider}</strong> ({generationMeta.model})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-all">
                {generatedText}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>50% Advance &amp; Staging Domain SOP Protocol Protected</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAIModalOpen(false)}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
