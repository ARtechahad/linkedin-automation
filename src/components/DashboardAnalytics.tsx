import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  Award,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Users,
  Repeat,
  ArrowUpRight,
  Filter,
  Calendar,
  Zap,
  Flame,
  Clock,
  BarChart2,
  PieChart,
  Radio,
  Sliders,
  Timer
} from 'lucide-react';
import { AnalyticsFilterState, HeatmapCell } from '../types';

export const DashboardAnalytics: React.FC = () => {
  const { projects, t, formatMoney, scaleMode, setScaleMode, currency, setActiveTab } = useApp();

  const [filters, setFilters] = useState<AnalyticsFilterState>({
    dateRange: 'all',
    salesperson: 'all',
    dealTier: 'all'
  });

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        dateRange: filters.dateRange,
        salesperson: filters.salesperson,
        tier: filters.dealTier
      }).toString();
      const res = await fetch(`/api/analytics/advanced?${query}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Error loading advanced analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [filters]);

  // Client-side computations from live projects state
  const safeProjects = Array.isArray(projects) ? projects : [];
  const totalPipeline = safeProjects.reduce((acc, p) => acc + (p.finalPrice || 0), 0);
  const closedRevenue = safeProjects
    .filter(p => p.domainTransferred || p.status === 'completed')
    .reduce((acc, p) => acc + (p.finalPrice || 0), 0);
  const advanceCollected = safeProjects.reduce((acc, p) => acc + (p.advancePaid ? (p.advanceAmount || 0) : 0), 0);
  const balanceCollected = safeProjects.reduce((acc, p) => acc + (p.balancePaid ? (p.balanceAmount || 0) : 0), 0);
  const totalCollectedCash = advanceCollected + balanceCollected;
  const totalCommissions = safeProjects.reduce((acc, p) => acc + (p.commissionAmount || 0), 0);
  const avgDealSize = safeProjects.length ? Math.round(totalPipeline / safeProjects.length) : 0;
  const activeStaging = safeProjects.filter(p => p.status === 'staging_dev' || p.status === 'client_review').length;

  // Lead score tiers breakdown
  const leadScoreBreakdown = {
    vip: safeProjects.filter(p => p.leadScore?.tierTag === 'vip').length,
    hot: safeProjects.filter(p => p.leadScore?.tierTag === 'hot').length,
    warm: safeProjects.filter(p => !p.leadScore || p.leadScore?.tierTag === 'warm').length,
    cold: safeProjects.filter(p => p.leadScore?.tierTag === 'cold').length
  };

  // Commission by tier
  const tier1Revenue = safeProjects.filter(p => (p.finalPrice || 0) <= 300).reduce((a, b) => a + (b.finalPrice || 0), 0);
  const tier2Revenue = safeProjects.filter(p => (p.finalPrice || 0) > 300 && (p.finalPrice || 0) <= 700).reduce((a, b) => a + (b.finalPrice || 0), 0);
  const tier3Revenue = safeProjects.filter(p => (p.finalPrice || 0) > 700).reduce((a, b) => a + (b.finalPrice || 0), 0);

  // Unique sales reps for filter dropdown
  const uniqueReps = Array.from(new Set(safeProjects.map(p => p.assignedSalesperson).filter(Boolean)));

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = ['Morning (08-12)', 'Midday (12-16)', 'Afternoon (16-20)', 'Night (20-00)'];

  const heatmapList: HeatmapCell[] = analyticsData?.heatmap || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('analytics')} & Dynamic Performance Heatmaps</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-channel deal analytics, SOP Section 6 commission payouts, and sales team velocity matrices.
          </p>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Filters:</span>
          </div>

          <select
            id="filter-analytics-daterange"
            value={filters.dateRange}
            onChange={e => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
          </select>

          <select
            id="filter-analytics-salesperson"
            value={filters.salesperson}
            onChange={e => setFilters(prev => ({ ...prev, salesperson: e.target.value }))}
            className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Sales Reps</option>
            {uniqueReps.map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>

          <select
            id="filter-analytics-tier"
            value={filters.dealTier}
            onChange={e => setFilters(prev => ({ ...prev, dealTier: e.target.value as any }))}
            className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Tiers (1-3)</option>
            <option value="tier1">Tier 1 (&le; $300 - 25%)</option>
            <option value="tier2">Tier 2 ($301-$700 - 30%)</option>
            <option value="tier3">Tier 3 (&gt; $700 - 35-45%)</option>
          </select>
        </div>
      </div>

      {/* Enterprise Agency Scale & SLA Compliance Command Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Scale Mode Switcher */}
        <div className="md:col-span-8 p-4 rounded-2xl bg-indigo-950 text-white border border-indigo-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Agency Scale Mode
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {scaleMode.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Toggle between datasets to simulate realistic pipeline volumes for enterprise agencies vs. boutique sprints.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setScaleMode('enterprise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scaleMode === 'enterprise'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              Enterprise ($178k+)
            </button>
            <button
              onClick={() => setScaleMode('boutique')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scaleMode === 'boutique'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              Boutique ($24k)
            </button>
            <button
              onClick={() => setScaleMode('sandbox')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scaleMode === 'sandbox'
                  ? 'bg-white text-indigo-950 shadow-sm'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-800'
              }`}
            >
              Sandbox ($3.1k)
            </button>
          </div>
        </div>

        {/* 15-Minute SLA Compliance Card */}
        <div className="md:col-span-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-indigo-500" />
              <span>15-Min Lead SLA Compliance</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              94.8% SLA
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                6.4 min
              </div>
              <span className="text-[11px] text-slate-400">Average First Response Time</span>
            </div>
            <button
              onClick={() => setActiveTab('inbox')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              View Inbound SLA &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Pipeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold">{t('totalPipeline')}</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {formatMoney(totalPipeline)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Avg Deal Size:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatMoney(avgDealSize)}</strong>
          </div>
        </div>

        {/* Closed Cash Collected */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold">Cash Collected (50/50 Milestones)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatMoney(totalCollectedCash)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Adv: {formatMoney(advanceCollected)}</span>
            <span>Bal: {formatMoney(balanceCollected)}</span>
          </div>
        </div>

        {/* Team Commissions (SOP 6) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold">Team Commissions (SOP 6)</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatMoney(totalCommissions)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Applied Tiers:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">25%, 30%, 35-45%</span>
          </div>
        </div>

        {/* Active Staging Builds */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-semibold">Active Staging Deployments</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {activeStaging}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SOP Security Gate: Enforced</span>
          </div>
        </div>

      </div>

      {/* Dynamic Activity Heatmap (7 Days x 4 Time Slots) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Deal Velocity & Team Activity Heatmap (7-Day Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive visualization of deals initiated, staging reviews conducted, and milestone closures across day/time brackets.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Low</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" />
              <span className="w-3 h-3 rounded-xs bg-indigo-200 dark:bg-indigo-900/60" />
              <span className="w-3 h-3 rounded-xs bg-indigo-400 dark:bg-indigo-700" />
              <span className="w-3 h-3 rounded-xs bg-indigo-600 dark:bg-indigo-500" />
            </div>
            <span>High Velocity</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-400 py-2 px-3 text-[11px] w-36">Time Slot</th>
                {days.map(d => (
                  <th key={d} className="font-bold text-slate-700 dark:text-slate-300 py-2 px-3">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slots.map(slot => (
                <tr key={slot}>
                  <td className="text-left py-2.5 px-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {slot}
                  </td>
                  {days.map(day => {
                    const match = heatmapList.find(cell => cell.day === day && cell.timeSlot === slot);
                    const count = match?.activityCount || 0;
                    const val = match?.revenueValue || 0;

                    let bgClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-400';
                    if (count === 1) bgClass = 'bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold';
                    else if (count === 2) bgClass = 'bg-indigo-300/80 dark:bg-indigo-800/70 text-indigo-950 dark:text-indigo-100 font-black';
                    else if (count >= 3) bgClass = 'bg-indigo-600 text-white font-black shadow-xs';

                    return (
                      <td key={day} className="p-1">
                        <div
                          onMouseEnter={() => setHoveredCell(match || { day, timeSlot: slot, activityCount: count, revenueValue: val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer hover:scale-105 ${bgClass}`}
                        >
                          <span className="text-[11px]">{count > 0 ? `${count} deals` : '—'}</span>
                          {val > 0 && (
                            <span className="text-[9px] opacity-80 font-mono">${val}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hovered cell info ticker */}
        {hoveredCell && (
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-xs flex items-center justify-between text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                <strong>{hoveredCell.day}</strong> • {hoveredCell.timeSlot}
              </span>
            </div>
            <span>
              Recorded Activity: <strong>{hoveredCell.activityCount} deals / sprint milestones</strong> (Volume: ${hoveredCell.revenueValue || 0} USD)
            </span>
          </div>
        )}
      </div>

      {/* 2-Column: AI Lead Scoring Distribution (Left) & Sales Leaderboard (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: AI Lead Scoring Engine Distribution (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>AI Smart Lead Scoring & Priority Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated multi-factor evaluation (Budget, Scope, Assets, Urgency)
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {projects.length} Total Leads
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* VIP */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 text-center space-y-1">
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 block">⚡ VIP Deals</span>
              <div className="text-xl font-black text-amber-900 dark:text-amber-100">{leadScoreBreakdown.vip}</div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">Score &ge; 88 &amp; $700+</span>
            </div>

            {/* Hot */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20 border border-rose-200 dark:border-rose-800/60 text-center space-y-1">
              <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 block">🔥 Hot Leads</span>
              <div className="text-xl font-black text-rose-900 dark:text-rose-100">{leadScoreBreakdown.hot}</div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400">Score 78 - 87</span>
            </div>

            {/* Warm */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/60 text-center space-y-1">
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 block">⚠️ Warm Leads</span>
              <div className="text-xl font-black text-blue-900 dark:text-blue-100">{leadScoreBreakdown.warm}</div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">Score 50 - 77</span>
            </div>

            {/* Cold */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border border-slate-200 dark:border-slate-700/60 text-center space-y-1">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">❄️ Cold Leads</span>
              <div className="text-xl font-black text-slate-900 dark:text-white">{leadScoreBreakdown.cold}</div>
              <span className="text-[10px] text-slate-500">Score &lt; 50</span>
            </div>

          </div>

          {/* SOP Recommendation breakdown */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>SOP Action Priority:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Sales team must prioritize VIP and Hot deals within 15 minutes to initiate Discovery and dispatch the 50% advance invoice before sprint slots are allocated.
            </p>
          </div>

        </div>

        {/* Right: Sales Rep Leaderboard & Tier Distribution (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Sales Representative Performance Leaderboard</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking deals closed and SOP Section 6 commission payouts
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600">SOP Tier 1-3</span>
          </div>

          <div className="space-y-3 text-xs">
            {analyticsData?.repLeaderboard && analyticsData.repLeaderboard.length > 0 ? (
              analyticsData.repLeaderboard.map((rep: any, idx: number) => (
                <div
                  key={rep.name}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {rep.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {rep.dealsCount} deals (T1: {rep.tier1Deals}, T2: {rep.tier2Deals}, T3: {rep.tier3Deals})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm block">
                      ${rep.commissionsEarned?.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total Volume: ${rep.totalRevenue}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No sales representative data for current filter criteria.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
