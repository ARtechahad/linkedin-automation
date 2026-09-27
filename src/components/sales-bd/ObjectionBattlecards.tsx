import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Copy, 
  Check, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Sparkles,
  Filter
} from 'lucide-react';
import { SalesBattlecard, ObjectionCategory } from '../../types';
import { SALES_BATTLECARDS } from '../../data/salesBdData';

interface ObjectionBattlecardsProps {
  onShowToast: (msg: string) => void;
}

export const ObjectionBattlecards: React.FC<ObjectionBattlecardsProps> = ({ onShowToast }) => {
  const [battlecards, setBattlecards] = useState<SalesBattlecard[]>(SALES_BATTLECARDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Battlecard form state
  const [newCategory, setNewCategory] = useState<ObjectionCategory>('pricing');
  const [newTitle, setNewTitle] = useState('');
  const [newSnippet, setNewSnippet] = useState('');
  const [newPsychology, setNewPsychology] = useState('');
  const [newScript, setNewScript] = useState('');
  const [newDoNotSay, setNewDoNotSay] = useState('');
  const [newFollowUp, setNewFollowUp] = useState('');

  const filteredCards = battlecards.filter(card => {
    const matchesCategory = selectedCategory === 'all' || card.category === selectedCategory;
    const matchesSearch = 
      card.objectionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.clientQuerySnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.winningScript.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (card: SalesBattlecard) => {
    navigator.clipboard.writeText(card.winningScript);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Winning objection script copied to clipboard!');
  };

  const handleCreateBattlecard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newScript.trim()) {
      onShowToast('Please provide an Objection Title and Winning Script.');
      return;
    }

    const newCard: SalesBattlecard = {
      id: `bc-${Date.now()}`,
      category: newCategory,
      objectionTitle: newTitle,
      clientQuerySnippet: newSnippet || newTitle,
      rootPsychology: newPsychology || 'Concern regarding value versus financial risk.',
      winningScript: newScript,
      proofPoints: ['SOP Staging gate protection', 'Dedicated senior developer squad', 'Transparent milestone delivery'],
      whatNotToSay: newDoNotSay || 'Do not offer unsolicited discounts.',
      recommendedFollowUpQuestion: newFollowUp || 'What is your primary milestone deadline?'
    };

    setBattlecards([newCard, ...battlecards]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewSnippet('');
    setNewScript('');
    setNewPsychology('');
    setNewDoNotSay('');
    setNewFollowUp('');
    onShowToast('New sales battlecard added to agency knowledge base.');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Sales Objection Handling &amp; Battlecard Cheatsheet</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Battle-tested responses to win international clients when objections arise on calls or messaging.
            </p>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Cancel' : 'Add New Battlecard'}</span>
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
              placeholder="Search objections by keyword (e.g. 'expensive', 'Upwork', '2 weeks')..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Objections' },
              { id: 'pricing', label: 'Pricing & Budget' },
              { id: 'freelancer_comparison', label: 'Freelancers & Upwork' },
              { id: 'agency_credibility', label: 'Trust & Past Trauma' },
              { id: 'timeline', label: 'Timeline Urgency' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Battlecard Form (Conditional) */}
      {isAddingNew && (
        <form onSubmit={handleCreateBattlecard} className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Draft New Sales Battlecard
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="pricing">Pricing &amp; Rates</option>
                <option value="freelancer_comparison">Freelancer / Upwork</option>
                <option value="agency_credibility">Agency Trust &amp; Offshoring</option>
                <option value="timeline">Timeline Urgency</option>
                <option value="tech_stack">Tech Stack Selection</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Objection Headline
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder='e.g. "We don&apos;t want to pay 50% upfront"'
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Winning Script (Word-for-word what the salesperson says) *
            </label>
            <textarea
              rows={3}
              required
              value={newScript}
              onChange={e => setNewScript(e.target.value)}
              placeholder="State the psychological reframing and value proof..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                What NOT to say (Pitfall)
              </label>
              <input
                type="text"
                value={newDoNotSay}
                onChange={e => setNewDoNotSay(e.target.value)}
                placeholder="e.g. Never criticize the client's budget."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recommended Follow-Up Question
              </label>
              <input
                type="text"
                value={newFollowUp}
                onChange={e => setNewFollowUp(e.target.value)}
                placeholder="Question that retains conversational leverage..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
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
              Save Battlecard
            </button>
          </div>
        </form>
      )}

      {/* Battlecards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCards.map(card => (
          <div
            key={card.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition"
          >
            <div className="space-y-3">
              {/* Category & Action */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {card.category.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => handleCopy(card)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === card.id ? 'Script Copied' : 'Copy Script'}</span>
                </button>
              </div>

              {/* Objection Title & Client snippet */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {card.objectionTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border-l-2 border-indigo-500">
                  &ldquo;{card.clientQuerySnippet}&rdquo;
                </p>
              </div>

              {/* Psychology behind objection */}
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px] uppercase tracking-wider mb-0.5">
                  🧠 What the Client is Truly Afraid Of:
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {card.rootPsychology}
                </p>
              </div>

              {/* Winning Script Box */}
              <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 block mb-1">
                  🎯 Winning Counter-Script:
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                  &ldquo;{card.winningScript}&rdquo;
                </p>
              </div>

              {/* What NOT to say & Follow-up */}
              <div className="space-y-1.5 text-[11px] pt-1">
                <div className="flex items-start gap-1.5 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>Pitfall:</strong> {card.whatNotToSay}</span>
                </div>
                <div className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>Recommended Question:</strong> {card.recommendedFollowUpQuestion}</span>
                </div>
              </div>
            </div>

            {/* Proof Points */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-1.5 flex-wrap">
              {card.proofPoints.map((pt, idx) => (
                <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{pt}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
