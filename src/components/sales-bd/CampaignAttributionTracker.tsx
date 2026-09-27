import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Layers, 
  Sparkles, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  ArrowUpRight,
  Target
} from 'lucide-react';
import { CampaignAttribution, CampaignChannel } from '../../types';
import { INITIAL_CAMPAIGNS } from '../../data/salesBdData';

interface CampaignAttributionTrackerProps {
  onShowToast: (msg: string) => void;
}

export const CampaignAttributionTracker: React.FC<CampaignAttributionTrackerProps> = ({ onShowToast }) => {
  const [campaigns, setCampaigns] = useState<CampaignAttribution[]>(INITIAL_CAMPAIGNS);
  const [isAdding, setIsAdding] = useState(false);

  // Math aggregates
  const totalMonthlySpend = campaigns.reduce((acc, c) => acc + c.monthlySpendUSD, 0);
  const totalRevenue = campaigns.reduce((acc, c) => acc + c.totalRevenueUSD, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leadsGenerated, 0);
  const totalDeals = campaigns.reduce((acc, c) => acc + c.closedDeals, 0);
  const blendedCAC = totalDeals > 0 ? totalMonthlySpend / totalDeals : 0;
  const overallROI = totalMonthlySpend > 0 ? totalRevenue / totalMonthlySpend : 0;

  // New campaign state
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState<CampaignChannel>('clutch');
  const [newSpend, setNewSpend] = useState(500);
  const [newLeads, setNewLeads] = useState(15);
  const [newDeals, setNewDeals] = useState(2);
  const [newRevenue, setNewRevenue] = useState(16000);

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('Please specify campaign channel name.');
      return;
    }

    const calculatedCac = newDeals > 0 ? Math.round(newSpend / newDeals) : newSpend;
    const calculatedRoi = newSpend > 0 ? Number((newRevenue / newSpend).toFixed(1)) : 0;
    const avgDeal = newDeals > 0 ? Math.round(newRevenue / newDeals) : newRevenue;

    const newCamp: CampaignAttribution = {
      id: `camp-${Date.now()}`,
      channelName: newName,
      channelKey: newKey,
      monthlySpendUSD: newSpend,
      leadsGenerated: newLeads,
      qualifiedDeals: Math.round(newLeads * 0.6),
      closedDeals: newDeals,
      totalRevenueUSD: newRevenue,
      avgDealSizeUSD: avgDeal,
      cacUSD: calculatedCac,
      roiMultiplier: calculatedRoi,
      status: 'active'
    };

    setCampaigns([...campaigns, newCamp]);
    setIsAdding(false);
    setNewName('');
    onShowToast(`Campaign channel "${newName}" added.`);
  };

  const handleUpdateSpend = (id: string, spend: number) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const cac = c.closedDeals > 0 ? Math.round(spend / c.closedDeals) : spend;
      const roi = spend > 0 ? Number((c.totalRevenueUSD / spend).toFixed(1)) : 0;
      return { ...c, monthlySpendUSD: spend, cacUSD: cac, roiMultiplier: roi };
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Stats */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Campaign &amp; Lead Source Attribution (ROI &amp; CAC Tracker)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Measure exact client acquisition costs (CAC) and ROI multiplier across B2B directories and outbound channels.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancel' : 'Track New Channel'}</span>
          </button>
        </div>

        {/* Aggregate KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              Monthly Growth Spend
            </span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
              ${totalMonthlySpend.toLocaleString()}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              across {campaigns.length} acquisition channels
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block mb-0.5">
              Closed Attributed Revenue
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
              ${totalRevenue.toLocaleString()}
            </span>
            <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              from {totalDeals} closed contracts
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block mb-0.5">
              Blended CAC
            </span>
            <span className="text-xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
              ${Math.round(blendedCAC).toLocaleString()}
            </span>
            <span className="block text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
              Cost to acquire 1 signed client
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold block mb-0.5">
              Agency ROI Multiplier
            </span>
            <span className="text-xl font-extrabold font-mono text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>{overallROI.toFixed(1)}x</span>
            </span>
            <span className="block text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">
              Every $1 in ad spend returns ${(overallROI).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Add New Channel Form */}
      {isAdding && (
        <form onSubmit={handleAddCampaign} className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Add Acquisition Channel / Campaign
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Channel Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. GoodFirms Sponsored Listing"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={newKey}
                onChange={e => setNewKey(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="clutch">Clutch.co / Directories</option>
                <option value="linkedin_inmail">LinkedIn InMail</option>
                <option value="upwork_enterprise">Upwork Enterprise</option>
                <option value="referral_partner">Referrals &amp; VCs</option>
                <option value="google_inbound">Google Ads / SEO</option>
                <option value="cold_email">Cold Email Outreach</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Spend ($ USD)
              </label>
              <input
                type="number"
                value={newSpend}
                onChange={e => setNewSpend(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Leads Generated
              </label>
              <input
                type="number"
                value={newLeads}
                onChange={e => setNewLeads(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closed Deals
              </label>
              <input
                type="number"
                value={newDeals}
                onChange={e => setNewDeals(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attributed Revenue ($)
              </label>
              <input
                type="number"
                value={newRevenue}
                onChange={e => setNewRevenue(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Campaign
            </button>
          </div>
        </form>
      )}

      {/* Attribution Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="p-3.5">Acquisition Channel</th>
                <th className="p-3.5 text-right">Monthly Spend</th>
                <th className="p-3.5 text-center">Inbound Leads</th>
                <th className="p-3.5 text-center">Deals Closed</th>
                <th className="p-3.5 text-right">Attributed Revenue</th>
                <th className="p-3.5 text-right">Unit CAC</th>
                <th className="p-3.5 text-right">ROI Multiplier</th>
                <th className="p-3.5 text-center">Scaling Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-sans">
              {campaigns.map(camp => (
                <tr key={camp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{camp.channelName}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mt-0.5">
                      {camp.channelKey.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>$</span>
                      <input
                        type="number"
                        value={camp.monthlySpendUSD}
                        onChange={e => handleUpdateSpend(camp.id, Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-right font-bold text-xs"
                      />
                    </div>
                  </td>

                  <td className="p-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {camp.leadsGenerated}
                  </td>

                  <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {camp.closedDeals}
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${camp.totalRevenueUSD.toLocaleString()}
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ${camp.cacUSD.toLocaleString()}
                  </td>

                  <td className="p-3.5 text-right font-mono font-extrabold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      camp.roiMultiplier >= 40
                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {camp.roiMultiplier}x
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      camp.status === 'scaling'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
