import React, { useState } from 'react';
import { 
  FolderGit2, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Building2, 
  Code2, 
  TrendingUp, 
  Plus,
  Quote,
  CheckCircle2
} from 'lucide-react';
import { CaseStudy, IndustryCategory } from '../../types';
import { INITIAL_CASE_STUDIES } from '../../data/salesBdData';

interface CaseStudyVaultProps {
  onShowToast: (msg: string) => void;
}

export const CaseStudyVault: React.FC<CaseStudyVaultProps> = ({ onShowToast }) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(INITIAL_CASE_STUDIES);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Case Study Form State
  const [newTitle, setNewTitle] = useState('');
  const [newIndustry, setNewIndustry] = useState<IndustryCategory>('FinTech');
  const [newRegion, setNewRegion] = useState('New York, USA');
  const [newHeroMetric, setNewHeroMetric] = useState('+250% Conversion Increase');
  const [newTechStack, setNewTechStack] = useState('Next.js, TypeScript, PostgreSQL, Tailwind');
  const [newOverview, setNewOverview] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newArchitecture, setNewArchitecture] = useState('');

  const filteredStudies = caseStudies.filter(study => {
    const matchesIndustry = selectedIndustry === 'all' || study.clientIndustry === selectedIndustry;
    const matchesSearch = 
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      study.heroMetric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const copyPitchText = (study: CaseStudy) => {
    const pitch = `CASE STUDY: ${study.title} (${study.clientIndustry} - ${study.clientRegion})
Key Result: ${study.heroMetric}
--------------------------------------------------
Tech Stack: ${study.techStack.join(', ')}
Timeline: ${study.timelineWeeks} Weeks | Budget Tier: ${study.budgetRange}

THE CHALLENGE:
${study.challenge}

OUR TECHNICAL SOLUTION:
${study.solutionArchitecture}

MEASURABLE BUSINESS OUTCOMES:
${study.results.map(r => `• ${r}`).join('\n')}

CLIENT TESTIMONIAL:
"${study.testimonialQuote}" - ${study.testimonialAuthor}`;

    navigator.clipboard.writeText(pitch);
    setCopiedId(study.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('1-Page Case Study Pitch Deck copied to clipboard!');
  };

  const handleCreateCaseStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOverview.trim()) {
      onShowToast('Please provide Title and Overview.');
      return;
    }

    const techArray = newTechStack.split(',').map(t => t.trim()).filter(Boolean);

    const newStudy: CaseStudy = {
      id: `cs-${Date.now()}`,
      title: newTitle,
      clientIndustry: newIndustry,
      clientRegion: newRegion,
      techStack: techArray,
      heroMetric: newHeroMetric,
      overview: newOverview,
      challenge: newChallenge || 'Client had scalability bottlenecks and high latency.',
      solutionArchitecture: newArchitecture || 'Engineered modular React architecture with edge caching.',
      timelineWeeks: 6,
      budgetRange: '$15,000 - $25,000',
      results: [
        'Delivered complete product sprint in 6 weeks with zero QA blockers',
        '99.9% uptime SLA maintained through load spikes',
        'Directly reduced operational churn by over 30%'
      ],
      testimonialQuote: 'Outstanding delivery discipline and modern architecture.',
      testimonialAuthor: 'Director of Technology'
    };

    setCaseStudies([newStudy, ...caseStudies]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewOverview('');
    setNewChallenge('');
    setNewArchitecture('');
    onShowToast('New Case Study published to portfolio vault.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Search */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Dynamic Portfolio &amp; Case Study Vault</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Prove past agency capability with industry-specific case studies, architecture breakdowns, and ROI metrics.
            </p>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Cancel' : 'Add Case Study'}</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search case studies by tech (Next.js, Python), metric, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Verticals' },
              { id: 'FinTech', label: 'FinTech' },
              { id: 'HealthTech', label: 'HealthTech' },
              { id: 'Logistics', label: 'Logistics' },
              { id: 'SaaS & AI', label: 'SaaS & AI' },
              { id: 'eCommerce', label: 'eCommerce' }
            ].map(ind => (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  selectedIndustry === ind.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Case Study Form */}
      {isAddingNew && (
        <form onSubmit={handleCreateCaseStudy} className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Publish New Agency Case Study
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. ApexPay: Global Settlement Hub"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Vertical
              </label>
              <select
                value={newIndustry}
                onChange={e => setNewIndustry(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="Logistics">Logistics</option>
                <option value="SaaS & AI">SaaS &amp; AI</option>
                <option value="eCommerce">eCommerce</option>
                <option value="Real Estate">Real Estate</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hero KPI Metric *
              </label>
              <input
                type="text"
                required
                value={newHeroMetric}
                onChange={e => setNewHeroMetric(e.target.value)}
                placeholder="e.g. +310% Processing Volume in 90 Days"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tech Stack (comma separated)
              </label>
              <input
                type="text"
                value={newTechStack}
                onChange={e => setNewTechStack(e.target.value)}
                placeholder="Next.js, Node.js, PostgreSQL, Docker"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Region
              </label>
              <input
                type="text"
                value={newRegion}
                onChange={e => setNewRegion(e.target.value)}
                placeholder="London, UK or San Francisco, CA"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Overview &amp; Business Context *
            </label>
            <textarea
              rows={2}
              required
              value={newOverview}
              onChange={e => setNewOverview(e.target.value)}
              placeholder="High-level description of what was engineered..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Case Study
            </button>
          </div>
        </form>
      )}

      {/* Case Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudies.map(study => (
          <div
            key={study.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition"
          >
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {study.clientIndustry} • {study.clientRegion}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {study.timelineWeeks} wks
                </span>
              </div>

              {/* Title & Hero Metric */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {study.title}
                </h4>
                <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{study.heroMetric}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {study.overview}
              </p>

              {/* Tech Stack Pills */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Engineered Stack:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {study.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Results bullets */}
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                {study.results.map((res, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{res}</span>
                  </div>
                ))}
              </div>

              {/* Testimonial Quote */}
              {study.testimonialQuote && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border-l-2 border-indigo-500 text-[11px] text-slate-600 dark:text-slate-300 italic">
                  &ldquo;{study.testimonialQuote}&rdquo;
                  <span className="block not-italic font-bold text-slate-800 dark:text-slate-200 mt-1 text-[10px]">
                    — {study.testimonialAuthor}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                Budget: {study.budgetRange}
              </span>
              <button
                onClick={() => copyPitchText(study)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedId === study.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === study.id ? 'Copied Pitch!' : '1-Click Pitch Deck'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
