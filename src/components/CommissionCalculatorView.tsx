import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateCommission } from '../data/sopContent';
import {
  TrendingUp,
  DollarSign,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const CommissionCalculatorView: React.FC = () => {
  const { projects, updateProject, role, showToast, t } = useApp();
  const [projectValue, setProjectValue] = useState<number>(650);
  const [highPerformerTier, setHighPerformerTier] = useState<boolean>(false);

  const calc = calculateCommission(projectValue, highPerformerTier);
  const agencyNet = Number((projectValue - calc.amount).toFixed(2));

  const handleMarkPaid = async (projectId: string) => {
    if (role !== 'admin') {
      showToast('Admin role required to approve commission payouts.');
      return;
    }
    await updateProject(projectId, { commissionStatus: 'paid' });
    showToast('Commission payout marked as Paid.');
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('commissions')}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              SOP Section 6
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard employee commission structure based on total closed deal values.
          </p>
        </div>

        {/* High Performer Toggle */}
        <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            id="toggle-high-performer-tier"
            type="checkbox"
            checked={highPerformerTier}
            onChange={e => setHighPerformerTier(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {t('highPerformer')}
          </span>
        </label>
      </div>

      {/* Interactive Calculator Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Controls Column */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-commission-project-value" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t('projectValue')}
              </label>
              <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                ${projectValue} USD
              </span>
            </div>

            {/* Slider */}
            <input
              id="slider-commission-project-value"
              type="range"
              min="150"
              max="2500"
              step="50"
              value={projectValue}
              onChange={e => setProjectValue(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>$150 (Landing)</span>
              <span>$700 (E-com)</span>
              <span>$1200+ (Corporate)</span>
              <span>$2500+</span>
            </div>
          </div>

          {/* Quick Preset Buttons matching SOP Section 4 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">
              SOP Section 4 Quick Pricing Presets:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-preset-landing"
                onClick={() => setProjectValue(250)}
                className={`p-2 rounded-xl text-xs font-semibold border transition ${
                  projectValue === 250
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Landing ($250)
              </button>
              <button
                id="btn-preset-ecommerce"
                onClick={() => setProjectValue(600)}
                className={`p-2 rounded-xl text-xs font-semibold border transition ${
                  projectValue === 600
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                E-Commerce ($600)
              </button>
              <button
                id="btn-preset-corporate"
                onClick={() => setProjectValue(950)}
                className={`p-2 rounded-xl text-xs font-semibold border transition ${
                  projectValue === 950
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Corporate ($950)
              </button>
            </div>
          </div>

          {/* SOP Tiers Indicator Breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className={`p-3 rounded-xl border text-center transition ${
              projectValue <= 300
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
            }`}>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">&le; $300</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {highPerformerTier ? '40%' : '25%'}
              </span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Tier 1</span>
            </div>

            <div className={`p-3 rounded-xl border text-center transition ${
              projectValue > 300 && projectValue <= 700
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
            }`}>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">$300 – $700</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {highPerformerTier ? '42%' : '30%'}
              </span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Tier 2</span>
            </div>

            <div className={`p-3 rounded-xl border text-center transition ${
              projectValue > 700
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
            }`}>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">&gt; $700</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {highPerformerTier ? '45%' : '35%'}
              </span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Tier 3</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
            <strong>SOP Rule 6 Provision:</strong> If an employee consistently performs well and demonstrates reliability, the commission rate may be increased up to 40–45% at management discretion.
          </div>
        </div>

        {/* Calculation Result Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Payout Calculation
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {calc.tierName}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-indigo-100">{t('payoutAmount')}</span>
            <div className="text-4xl font-extrabold font-mono tracking-tight">
              ${calc.amount} USD
            </div>
            <span className="text-xs text-indigo-200 block">
              {calc.percentage}% of ${projectValue} total project value
            </span>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-2.5 text-xs text-indigo-100">
            <div className="flex justify-between">
              <span>Agency Retained Gross:</span>
              <span className="font-mono font-bold text-white">${agencyNet}</span>
            </div>
            <div className="flex justify-between">
              <span>50% Advance Trigger:</span>
              <span className="font-mono text-emerald-300 font-semibold">${(calc.amount * 0.5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>50% Delivery Trigger:</span>
              <span className="font-mono text-emerald-300 font-semibold">${(calc.amount * 0.5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span>Step 11 Recurring Retainer:</span>
              <span className="font-mono text-indigo-200">+ $50 – $150 / mo</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/20 text-[11px] text-indigo-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Commissions are credited upon 50% advance clearance and disbursed after final handover.</span>
          </div>
        </div>

      </div>

      {/* Real-time Employee Commission Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Active Project Commission Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Recorded commissions for each client project in the pipeline.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {role === 'admin' ? '🔑 Admin Mode Active' : '👀 View Only Mode'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Assigned Salesperson</th>
                <th className="p-3">Project Value</th>
                <th className="p-3">Commission Rate</th>
                <th className="p-3">Commission Amount</th>
                <th className="p-3">Payout Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {p.clientName}
                    <span className="block text-[10px] text-slate-500 uppercase">{p.websiteType}</span>
                  </td>
                  <td className="p-3">{p.assignedSalesperson}</td>
                  <td className="p-3 font-mono font-bold">${p.finalPrice}</td>
                  <td className="p-3 font-mono">{p.commissionRate}%</td>
                  <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${p.commissionAmount}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.commissionStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {p.commissionStatus === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {p.commissionStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {p.commissionStatus !== 'paid' ? (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                      >
                        Approve Payout
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Completed</span>
                    )}
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
