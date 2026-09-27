import React, { useState } from 'react';
import { 
  Calculator, 
  Users, 
  TrendingUp, 
  Plus, 
  Trash2, 
  DollarSign, 
  Percent, 
  Clock, 
  CheckCircle2, 
  FileText,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Copy,
  Check
} from 'lucide-react';
import { DeveloperRoleAllocation, ProjectCostEstimate } from '../../types';
import { INITIAL_ROLE_BENCHMARKS } from '../../data/salesBdData';

interface RateCardEstimatorProps {
  onOpenContractWithEstimate?: (price: number, scope: string) => void;
  onShowToast: (msg: string) => void;
}

export const RateCardEstimator: React.FC<RateCardEstimatorProps> = ({
  onOpenContractWithEstimate,
  onShowToast
}) => {
  const [projectName, setProjectName] = useState('Enterprise FinTech App & Portal');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [roles, setRoles] = useState<DeveloperRoleAllocation[]>(INITIAL_ROLE_BENCHMARKS);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Math Calculations
  let totalHours = 0;
  let totalInternalCost = 0;
  let totalGrossBilling = 0;

  roles.forEach(r => {
    const roleHours = r.headcount * r.hoursPerWeek * durationWeeks;
    totalHours += roleHours;
    totalInternalCost += roleHours * r.internalHourlyCost;
    totalGrossBilling += roleHours * r.clientHourlyRate;
  });

  const discountAmount = totalGrossBilling * (discountPercent / 100);
  const finalClientBilling = totalGrossBilling - discountAmount;
  const grossProfit = finalClientBilling - totalInternalCost;
  const grossMarginPercent = finalClientBilling > 0 ? (grossProfit / finalClientBilling) * 100 : 0;
  const advance50 = finalClientBilling * 0.5;
  const balance50 = finalClientBilling * 0.5;

  const handleUpdateRole = (id: string, field: keyof DeveloperRoleAllocation, val: any) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleAddRole = () => {
    const newRole: DeveloperRoleAllocation = {
      id: `role-${Date.now()}`,
      roleTitle: 'Custom Specialist / Engineer',
      seniority: 'Senior',
      headcount: 1,
      hoursPerWeek: 30,
      internalHourlyCost: 18,
      clientHourlyRate: 48
    };
    setRoles([...roles, newRole]);
    onShowToast('New role allocation added to rate card.');
  };

  const handleDeleteRole = (id: string) => {
    if (roles.length <= 1) {
      onShowToast('Must retain at least one role allocation.');
      return;
    }
    setRoles(roles.filter(r => r.id !== id));
  };

  const copyBreakdown = () => {
    const summary = `COMMERCIAL ESTIMATE: ${projectName}
Duration: ${durationWeeks} Weeks | Total Engineering Hours: ${totalHours}h
-----------------------------------------------------------------
${roles.filter(r => r.headcount > 0).map(r => `• ${r.headcount}x ${r.roleTitle} (${r.seniority}): ${r.hoursPerWeek}h/wk @ $${r.clientHourlyRate}/h ($${(r.headcount * r.hoursPerWeek * durationWeeks * r.clientHourlyRate).toLocaleString()})`).join('\n')}
-----------------------------------------------------------------
Total Client Value: $${Math.round(finalClientBilling).toLocaleString()} USD
- Milestone 1 (50% Advance Kickoff): $${Math.round(advance50).toLocaleString()} USD
- Milestone 2 (50% Staging Balance): $${Math.round(balance50).toLocaleString()} USD
Gross Profit Margin: ${grossMarginPercent.toFixed(1)}%`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    onShowToast('Commercial rate card estimate copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Settings */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Developer Rate Card &amp; Profit Margin Estimator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate internal engineering costs, client pricing, and gross margins to prevent underbidding.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyBreakdown}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            {onOpenContractWithEstimate && (
              <button
                onClick={() => onOpenContractWithEstimate(Math.round(finalClientBilling), projectName)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create SOW with this Price</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Name / Scope Tag
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              placeholder="e.g. HealthTech Consultation App"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sprint Duration (Weeks)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={24}
                value={durationWeeks}
                onChange={e => setDurationWeeks(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shrink-0">
                {durationWeeks} wks
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Commercial Discount: {discountPercent}%
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shrink-0">
                -${Math.round(discountAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Total Engineering Hours
          </span>
          <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            {totalHours.toLocaleString()}h
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            across {roles.reduce((acc, r) => acc + r.headcount, 0)} squad seats
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
            Internal Agency Cost
          </span>
          <span className="text-xl font-extrabold font-mono text-slate-700 dark:text-slate-300">
            ${Math.round(totalInternalCost).toLocaleString()}
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            Developer payroll &amp; overhead
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60">
          <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block mb-1">
            Client Final Quotation
          </span>
          <span className="text-xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
            ${Math.round(finalClientBilling).toLocaleString()}
          </span>
          <span className="block text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
            50% = ${Math.round(advance50).toLocaleString()} deposit
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block mb-1">
            Agency Gross Profit
          </span>
          <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
            ${Math.round(grossProfit).toLocaleString()}
          </span>
          <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            Retained commercial margin
          </span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          grossMarginPercent >= 55 
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : grossMarginPercent >= 40
            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <span className="text-[11px] font-semibold block mb-1">
            Gross Profit Margin
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold font-mono">
              {grossMarginPercent.toFixed(1)}%
            </span>
            {grossMarginPercent < 40 && (
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" title="Margin below agency standard benchmark (45%)" />
            )}
          </div>
          <span className="block text-[10px] opacity-80 mt-0.5">
            {grossMarginPercent >= 55 ? 'Optimal Agency Health' : grossMarginPercent >= 40 ? 'Acceptable' : 'Low Margin Warning'}
          </span>
        </div>
      </div>

      {/* Role Allocation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Engineering Squad Composition &amp; Hourly Benchmarks
            </h4>
          </div>
          <button
            onClick={handleAddRole}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Specialist</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="p-3">Role &amp; Seniority</th>
                <th className="p-3 text-center">Headcount</th>
                <th className="p-3 text-center">Hrs / Week</th>
                <th className="p-3 text-right">Internal Cost</th>
                <th className="p-3 text-right">Client Rate</th>
                <th className="p-3 text-right">Role Total</th>
                <th className="p-3 text-right">Role Margin</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {roles.map(role => {
                const roleHours = role.headcount * role.hoursPerWeek * durationWeeks;
                const cost = roleHours * role.internalHourlyCost;
                const billing = roleHours * role.clientHourlyRate;
                const margin = billing > 0 ? ((billing - cost) / billing) * 100 : 0;

                return (
                  <tr key={role.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="p-3">
                      <input
                        type="text"
                        value={role.roleTitle}
                        onChange={e => handleUpdateRole(role.id, 'roleTitle', e.target.value)}
                        className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-hidden focus:border-indigo-500 w-full"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={role.seniority}
                          onChange={e => handleUpdateRole(role.id, 'seniority', e.target.value)}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="Lead">Lead</option>
                          <option value="Senior">Senior</option>
                          <option value="Mid">Mid</option>
                          <option value="Junior">Junior</option>
                        </select>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {roleHours} total hrs
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="inline-flex items-center border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => handleUpdateRole(role.id, 'headcount', Math.max(0, role.headcount - 1))}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-900 dark:text-white">
                          {role.headcount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateRole(role.id, 'headcount', role.headcount + 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={role.hoursPerWeek}
                        onChange={e => handleUpdateRole(role.id, 'hoursPerWeek', Number(e.target.value))}
                        className="w-14 px-2 py-1 text-center font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </td>

                    <td className="p-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={role.internalHourlyCost}
                          onChange={e => handleUpdateRole(role.id, 'internalHourlyCost', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        />
                        <span className="text-slate-400 text-[10px]">/h</span>
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={role.clientHourlyRate}
                          onChange={e => handleUpdateRole(role.id, 'clientHourlyRate', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-slate-400 text-[10px]">/h</span>
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${Math.round(billing).toLocaleString()}
                    </td>

                    <td className="p-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        margin >= 50
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : margin >= 35
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      }`}>
                        {margin.toFixed(0)}%
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition cursor-pointer"
                        title="Remove role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer SOP Step 4 Notice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <span>
            💡 <strong>SOP Guidance</strong>: Never quote fixed projects with less than a 45% projected gross margin to buffer unforeseen scoping edge cases.
          </span>
          <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
            Average Blended Rate: ${(totalHours > 0 ? finalClientBilling / totalHours : 0).toFixed(2)}/hr
          </span>
        </div>
      </div>

    </div>
  );
};
