import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Coins, 
  Server, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft, 
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { 
  fetchLiveForexRates, 
  diagnoseClientDomain, 
  getClientGeoAndBusinessHours,
  ForexRatesData,
  DomainDiagnosticReport,
  ClientGeoInfo
} from '../services/freeApis';
import { useApp } from '../context/AppContext';

export const FreeApiToolsView: React.FC = () => {
  const { showToast, isDark } = useApp();

  // 1. Forex State
  const [forexData, setForexData] = useState<ForexRatesData | null>(null);
  const [loadingForex, setLoadingForex] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(500);
  const [convertFrom, setConvertFrom] = useState<string>('USD');
  const [convertTo, setConvertTo] = useState<string>('AED');

  // 2. DNS Diagnostics State
  const [testDomain, setTestDomain] = useState<string>('lumina-health.co.uk');
  const [dnsReport, setDnsReport] = useState<DomainDiagnosticReport | null>(null);
  const [loadingDns, setLoadingDns] = useState(false);

  // 3. Client Timezone Radar State
  const [selectedCountry, setSelectedCountry] = useState<string>('GB');
  const [geoInfo, setGeoInfo] = useState<ClientGeoInfo | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Initial loads
  useEffect(() => {
    loadForex();
    handleDiagnoseDomain('lumina-health.co.uk');
    loadGeo('GB');
  }, []);

  const loadForex = async () => {
    setLoadingForex(true);
    const data = await fetchLiveForexRates();
    setForexData(data);
    setLoadingForex(false);
    if (data) {
      showToast('Live exchange rates updated via Open Exchange Rates API.');
    }
  };

  const handleDiagnoseDomain = async (domainToTest?: string) => {
    const target = domainToTest || testDomain;
    if (!target) return;
    setLoadingDns(true);
    const report = await diagnoseClientDomain(target);
    setDnsReport(report);
    setLoadingDns(false);
  };

  const loadGeo = async (code: string) => {
    setLoadingGeo(true);
    const info = await getClientGeoAndBusinessHours(code);
    setGeoInfo(info);
    setLoadingGeo(false);
  };

  // Convert calculation
  const calculatedResult = () => {
    if (!forexData?.rates) return 0;
    const fromRate = forexData.rates[convertFrom] || 1;
    const toRate = forexData.rates[convertTo] || 1;
    // convert from source to USD then USD to target
    const inUSD = convertAmount / fromRate;
    return Math.round(inUSD * toRate * 100) / 100;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Globe2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Global Agency Live Network &amp; Utilities
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              100% Free Public APIs
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Zero-key public API integrations: Real-time international currency conversion rates, Cloudflare DNS-over-HTTPS propagation diagnostics for SOP Rule 8 domain handover, and client timezone office hour radars.
          </p>
        </div>

        <button
          onClick={() => {
            loadForex();
            handleDiagnoseDomain();
            loadGeo(selectedCountry);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingForex || loadingDns ? 'animate-spin' : ''}`} />
          <span>Refresh All APIs</span>
        </button>
      </div>

      {/* Grid: 3 Interactive Tool Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Live Currency Converter & Forex Hub */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Forex Converter</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">open.er-api.com API</span>
                </div>
              </div>
              <button
                onClick={loadForex}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition"
                title="Refresh Rates"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingForex ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Input form */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Deal Amount
                </label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={e => setConvertAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">From</label>
                  <select
                    value={convertFrom}
                    onChange={e => setConvertFrom(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    {forexData?.rates && Object.keys(forexData.rates).map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">To</label>
                  <select
                    value={convertTo}
                    onChange={e => setConvertTo(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    {forexData?.rates && Object.keys(forexData.rates).map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Converted Output Display */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold block">
                  Converted Deal Valuation
                </span>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono mt-0.5">
                  {calculatedResult().toLocaleString()} {convertTo}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  1 {convertFrom} = {((forexData?.rates?.[convertTo] || 1) / (forexData?.rates?.[convertFrom] || 1)).toFixed(4)} {convertTo}
                </span>
              </div>
            </div>
          </div>

          {/* Quick reference table */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-1.5">
              Live Major Rates against USD:
            </span>
            <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-center">GBP: {forexData?.rates?.GBP?.toFixed(2)}</span>
              <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-center">EUR: {forexData?.rates?.EUR?.toFixed(2)}</span>
              <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-center">AED: {forexData?.rates?.AED?.toFixed(2)}</span>
              <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-center">AUD: {forexData?.rates?.AUD?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 2. SOP Rule 8: Cloudflare DNS Propagation Inspector */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Domain DNS Cutover Inspector</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Cloudflare DNS over HTTPS</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                SOP Rule 8
              </span>
            </div>

            {/* Domain input */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Client Target Domain
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={testDomain}
                    onChange={e => setTestDomain(e.target.value)}
                    placeholder="e.g. clientdomain.com"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleDiagnoseDomain()}
                    disabled={loadingDns}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {loadingDns ? 'Testing...' : 'Inspect'}
                  </button>
                </div>
              </div>

              {/* Diagnostic Results */}
              {dnsReport && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Resolution Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      dnsReport.status === 'propagated'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {dnsReport.status} ({dnsReport.dnsResponseTimeMs}ms)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-0.5">Resolved A-Records:</span>
                    <div className="space-y-1 font-mono text-[11px] text-cyan-600 dark:text-cyan-300">
                      {dnsReport.resolvedIps.map((ip, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{ip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Nameservers: </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{dnsReport.nameservers[0] || 'Cloudflare DNS'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              💡 SOP Rule 8 verifies DNS cutover to ensure the client&apos;s live domain points cleanly to the production build before releasing admin access.
            </span>
          </div>
        </div>

        {/* 3. International Client Timezone Radar */}
        <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client Timezone Radar</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Geo IP &amp; Local Business Clock</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Country Selector */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Target Client Market
                </label>
                <select
                  value={selectedCountry}
                  onChange={e => {
                    setSelectedCountry(e.target.value);
                    loadGeo(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="GB">🇬🇧 United Kingdom (London - GMT)</option>
                  <option value="US">🇺🇸 United States (New York - EST)</option>
                  <option value="AE">🇦🇪 United Arab Emirates (Dubai - GST)</option>
                  <option value="AU">🇦🇺 Australia (Sydney - AEST)</option>
                  <option value="CA">🇨🇦 Canada (Toronto - EST)</option>
                  <option value="DE">🇩🇪 Germany (Frankfurt - CET)</option>
                  <option value="FR">🇫🇷 France (Paris - CET)</option>
                  <option value="PK">🇵🇰 Pakistan (Karachi - PKT)</option>
                  <option value="IN">🇮🇳 India (Mumbai - IST)</option>
                </select>
              </div>

              {/* Radar Status Display */}
              {geoInfo && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1.5">
                  <span className="text-[10px] text-purple-600 dark:text-purple-300 uppercase tracking-wider font-bold block">
                    {geoInfo.countryName} Current Time
                  </span>
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-200 font-mono tracking-wider">
                    {geoInfo.localTimeString}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${geoInfo.isBusinessHours ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {geoInfo.businessHoursNotice}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              ⚡ Outbound outreach response rates increase by 42% when emails and WhatsApp pings land between 9:30 AM and 11:30 AM in the client&apos;s local timezone.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
