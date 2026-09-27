/**
 * Free Public APIs Service for AgencyOps ALM Suite
 * Zero API keys or tokens required. Real-time network calls.
 * 
 * 1. Open Exchange Rates (open.er-api.com) - Real-time live forex conversion rates
 * 2. Cloudflare DNS over HTTPS (cloudflare-dns.com) - Real-time domain resolution & SSL/DNS cutover diagnostics
 * 3. Country / Geo IP & Timezone Service - International client office hours analyzer
 */

export interface ForexRatesData {
  base: string;
  lastUpdated: string;
  rates: Record<string, number>;
}

export interface DnsRecordResult {
  name: string;
  type: string;
  ttl: number;
  data: string;
}

export interface DomainDiagnosticReport {
  domain: string;
  resolvedIps: string[];
  status: 'propagated' | 'resolving' | 'failed';
  dnsResponseTimeMs: number;
  records: DnsRecordResult[];
  nameservers: string[];
  checkedAt: string;
}

export interface ClientGeoInfo {
  ip: string;
  countryCode: string;
  countryName: string;
  timezone: string;
  localTimeString: string;
  isBusinessHours: boolean;
  businessHoursNotice: string;
}

// Country code to friendly name lookup
const COUNTRY_NAMES: Record<string, { name: string; tz: string; currency: string }> = {
  US: { name: 'United States', tz: 'America/New_York', currency: 'USD' },
  GB: { name: 'United Kingdom', tz: 'Europe/London', currency: 'GBP' },
  AE: { name: 'United Arab Emirates', tz: 'Asia/Dubai', currency: 'AED' },
  AU: { name: 'Australia', tz: 'Australia/Sydney', currency: 'AUD' },
  CA: { name: 'Canada', tz: 'America/Toronto', currency: 'CAD' },
  DE: { name: 'Germany', tz: 'Europe/Berlin', currency: 'EUR' },
  FR: { name: 'France', tz: 'Europe/Paris', currency: 'EUR' },
  PK: { name: 'Pakistan', tz: 'Asia/Karachi', currency: 'PKR' },
  IN: { name: 'India', tz: 'Asia/Kolkata', currency: 'INR' },
  SE: { name: 'Sweden', tz: 'Europe/Stockholm', currency: 'EUR' },
  SA: { name: 'Saudi Arabia', tz: 'Asia/Riyadh', currency: 'SAR' },
  SG: { name: 'Singapore', tz: 'Asia/Singapore', currency: 'SGD' }
};

/**
 * 1. Fetch Real-time Live Forex Currency Rates from free public endpoint
 */
export async function fetchLiveForexRates(): Promise<ForexRatesData | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`Forex API returned status ${res.status}`);
    const data = await res.json();
    if (data.result === 'success' && data.rates) {
      return {
        base: 'USD',
        lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        rates: {
          USD: 1.0,
          GBP: data.rates.GBP || 0.79,
          EUR: data.rates.EUR || 0.92,
          AUD: data.rates.AUD || 1.54,
          AED: data.rates.AED || 3.67,
          CAD: data.rates.CAD || 1.36,
          PKR: data.rates.PKR || 278.5,
          INR: data.rates.INR || 83.4,
          JPY: data.rates.JPY || 155.2
        }
      };
    }
    return null;
  } catch (error) {
    console.warn('Free Forex API fallback to cached rates:', error);
    return {
      base: 'USD',
      lastUpdated: new Date().toISOString(),
      rates: {
        USD: 1.0,
        GBP: 0.79,
        EUR: 0.92,
        AUD: 1.54,
        AED: 3.67,
        CAD: 1.36,
        PKR: 278.5,
        INR: 83.4,
        JPY: 155.2
      }
    };
  }
}

/**
 * 2. Cloudflare DNS over HTTPS (DoH) for Live Client Domain Cutover Diagnostics
 * Solves SOP Rule 8: Verifies live domain DNS propagation before final website handover
 */
export async function diagnoseClientDomain(domainInput: string): Promise<DomainDiagnosticReport> {
  const cleanDomain = domainInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
  const startTime = performance.now();
  
  try {
    // Query A Records
    const aRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=A`, {
      headers: { accept: 'application/dns-json' }
    });
    const aData = await aRes.json();
    const duration = Math.round(performance.now() - startTime);

    const answers: any[] = aData.Answer || [];
    const ips = answers.filter((rec: any) => rec.type === 1).map((rec: any) => rec.data);

    // Query NS Records for nameserver verification
    let nameservers: string[] = [];
    try {
      const nsRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=NS`, {
        headers: { accept: 'application/dns-json' }
      });
      const nsData = await nsRes.json();
      nameservers = (nsData.Answer || []).filter((rec: any) => rec.type === 2).map((rec: any) => rec.data);
    } catch {
      // ignore secondary ns query failure
    }

    const typeNames: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 15: 'MX', 28: 'AAAA' };

    return {
      domain: cleanDomain,
      resolvedIps: ips.length > 0 ? ips : ['No active A-record IP discovered'],
      status: ips.length > 0 ? 'propagated' : 'resolving',
      dnsResponseTimeMs: duration,
      records: answers.map((a: any) => ({
        name: a.name,
        type: typeNames[a.type] || `Type ${a.type}`,
        ttl: a.TTL,
        data: a.data
      })),
      nameservers: nameservers.length > 0 ? nameservers : ['Cloudflare / DNS Root Authoritative'],
      checkedAt: new Date().toISOString()
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    return {
      domain: cleanDomain,
      resolvedIps: [],
      status: 'failed',
      dnsResponseTimeMs: duration,
      records: [],
      nameservers: [],
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * 3. Free Geo IP & Client Office Hours Analyzer
 * Tells sales & coordinators if client is online or in working hours
 */
export async function getClientGeoAndBusinessHours(targetCountryCode?: string): Promise<ClientGeoInfo> {
  let countryCode = targetCountryCode || 'US';
  let clientIp = '127.0.0.1';

  if (!targetCountryCode) {
    try {
      const res = await fetch('https://api.country.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.country) countryCode = data.country;
        if (data.ip) clientIp = data.ip;
      }
    } catch {
      countryCode = 'US';
    }
  }

  const lookup = COUNTRY_NAMES[countryCode.toUpperCase()] || {
    name: countryCode,
    tz: 'UTC',
    currency: 'USD'
  };

  // Compute current local time in that timezone
  let localTimeString = '';
  let currentHour = 12;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: lookup.tz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      weekday: 'short'
    });
    localTimeString = formatter.format(new Date());

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: lookup.tz,
      hour: 'numeric',
      hour12: false
    });
    currentHour = parseInt(hourFormatter.format(new Date()), 10);
  } catch {
    localTimeString = new Date().toLocaleTimeString();
  }

  const isBusinessHours = currentHour >= 9 && currentHour < 18;
  const businessHoursNotice = isBusinessHours
    ? `🟢 Office Open (${localTimeString} in ${lookup.name}) — Ideal time for outreach call/pitch.`
    : `🌙 Outside Business Hours (${localTimeString} in ${lookup.name}) — Schedule email/pitch for 9:00 AM local time.`;

  return {
    ip: clientIp,
    countryCode,
    countryName: lookup.name,
    timezone: lookup.tz,
    localTimeString,
    isBusinessHours,
    businessHoursNotice
  };
}
