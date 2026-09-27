import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SOP_SECTIONS } from '../data/sopContent';
import {
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Layers,
  Server,
  Palette,
  MessageSquare,
  Award,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const SOPGuideView: React.FC = () => {
  const { showToast, openAIModal, setActiveTab, t } = useApp();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const copyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(t('copied'));
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getSectionIcon = (id: number) => {
    switch (id) {
      case 1: return MessageSquare;
      case 2: return Palette;
      case 3: return Server;
      case 4: return DollarSign;
      case 5: return CreditCard;
      case 6: return TrendingUp;
      case 7: return ExternalLink;
      case 8: return Layers;
      case 9: return CheckCircle2;
      case 10: return ShieldAlert;
      case 11: return Award;
      default: return CheckCircle2;
    }
  };

  const categories = [
    { id: 'all', label: 'All 11 SOP Sections' },
    { id: 'sales', label: '1. Outreach & Discovery' },
    { id: 'pricing', label: '4-6. Pricing & Commissions' },
    { id: 'dev', label: '8-9. Staging & Transfer' },
    { id: 'standards', label: '10-11. Standards & Retention' }
  ];

  const filteredSections = SOP_SECTIONS.filter(sec => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sales') return [1, 2, 3].includes(sec.id);
    if (activeCategory === 'pricing') return [4, 5, 6].includes(sec.id);
    if (activeCategory === 'dev') return [7, 8, 9].includes(sec.id);
    if (activeCategory === 'standards') return [10, 11].includes(sec.id);
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* SOP Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <span>Official Agency SOP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>International Client Guidelines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            International Client Handling Guide
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Standard operating procedure for web development sales, scoping, client communication, and project coordination. Every employee must follow these exact protocols to maintain flawless quality and trust.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => openAIModal({ mode: 'inquiry_response' })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Reply Generator (Step 1)</span>
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Commission Calculator (Step 6)</span>
            </button>
            <button
              onClick={() => setActiveTab('pipeline')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <span>View Active Client Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative Grid Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Category Pill Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/40 text-slate-300 border border-white/5 hover:border-white/10 hover:bg-slate-800/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 11 SOP Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSections.map(section => {
          const Icon = getSectionIcon(section.id);
          return (
            <div
              key={section.id}
              id={`sop-section-${section.id}`}
              className="glass-card rounded-2xl border border-white/10 p-6 shadow-xl hover:border-indigo-500/30 hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {section.badge}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {section.title}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    #{section.id}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {section.summary}
                </p>

                {/* Key Points Checklist */}
                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
                    Key Guidelines &amp; Questions:
                  </span>
                  {section.keyPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>

                {/* Copyable Example Response if available */}
                {section.exampleResponse && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Standard Response Script:</span>
                      <button
                        onClick={() => copyText(section.exampleResponse!, section.id)}
                        className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {copiedId === section.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Script</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-line leading-relaxed">
                      {section.exampleResponse}
                    </div>
                  </div>
                )}

                {/* Section Specific Visual Enhancements */}
                {section.id === 4 && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">Landing Page</span>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">$200–$300</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Single-page</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">E-commerce</span>
                      <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">$500–$700</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Cart + Gateway</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold">Corporate</span>
                      <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">$800+</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">8–9+ Pages</span>
                    </div>
                  </div>
                )}

                {section.id === 6 && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">&le; $300</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">25%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">$300–$700</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">30%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">&gt; $700</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">35%</span>
                    </div>
                  </div>
                )}

                {section.id === 8 && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Critical Security Rule (SOP 8.3):</strong> Website transfer to client's live domain and hosting will <em>ONLY</em> occur after final payment has been received and verified.
                    </div>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  SOP Requirement v2.4
                </span>
                {section.id === 1 && (
                  <button
                    onClick={() => openAIModal({ mode: 'inquiry_response' })}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Generate AI Reply</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                )}
                {section.id === 4 && (
                  <button
                    onClick={() => openAIModal({ mode: 'pricing_proposal' })}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Draft Proposal Quote</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {section.id === 6 && (
                  <button
                    onClick={() => setActiveTab('commissions')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Calculator</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {section.id === 7 && (
                  <button
                    onClick={() => setActiveTab('pipeline')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Discord Handoff Tool</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer Card */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 p-6 border border-blue-200/80 dark:border-indigo-900/50">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          {t('sopSummary')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          This document serves as the standard operating procedure (SOP) for dealing with international clients across the globe. All employees are expected to:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs font-medium text-slate-800 dark:text-slate-200">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Communicate professionally &amp; courteously</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Collect all essential project info accurately</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Follow pricing &amp; 50/50 payment policies strictly</span>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Maintain strict client data confidentiality</span>
          </div>
        </div>
      </div>

    </div>
  );
};
