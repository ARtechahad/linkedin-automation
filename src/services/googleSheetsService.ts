/**
 * Google Sheets REST API Client Service
 * 
 * Provides live bi-directional synchronization, batch lead export,
 * bulk spreadsheet import, and structured SOP milestone logging.
 */

import { getAccessToken } from '../lib/firebase';
import { ProjectLead, WebsiteType, LeadChannel, ProjectStatus } from '../types';

export interface GoogleSpreadsheetMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  autoSync: boolean;
  lastSyncAt: number | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string | null;
}

const STORAGE_CONFIG_KEY = 'agencyops_google_sheets_config';

// Standard Headers for Sheet 1: Pipeline Leads & Deals
export const PIPELINE_HEADERS = [
  'Project ID',
  'Client Name',
  'Company / Brand',
  'Client Email',
  'Client Phone',
  'Acquisition Channel',
  'Website Scope',
  'Deal Value ($ USD)',
  '50% Advance Paid ($)',
  '50% Balance Paid ($)',
  'Pipeline Status',
  'Assigned Salesperson',
  'Commission Rate (%)',
  'Commission Amount ($)',
  'Staging URL',
  'Scope & Purpose',
  'Last Updated'
];

// Standard Headers for Sheet 2: SOP Milestone & Deal Tracking Log
export const MILESTONE_LOG_HEADERS = [
  'Log Timestamp',
  'Project ID',
  'Client Name',
  'Company',
  'Deal Value ($ USD)',
  'Lead Score',
  'SOP Stage 1: Lead Scored',
  'SOP Stage 2: 50% Advance Deposit',
  'SOP Stage 3: Scope & Mockup Review',
  'SOP Stage 4: Staging Deployment',
  'SOP Stage 5: 50% Balance Cleared',
  'SOP Stage 6: QA Checklist Done',
  'SOP Stage 7: Live Domain Handover'
];

class GoogleSheetsService {
  private config: GoogleSheetsSyncConfig = {
    spreadsheetId: null,
    spreadsheetName: null,
    spreadsheetUrl: null,
    autoSync: false,
    lastSyncAt: null,
    syncStatus: 'idle'
  };

  private listeners: Set<(config: GoogleSheetsSyncConfig) => void> = new Set();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (raw) {
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[GoogleSheets] Failed to load config:', e);
    }
  }

  public saveConfig(updates: Partial<GoogleSheetsSyncConfig>) {
    this.config = { ...this.config, ...updates };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(this.config));
      } catch (e) {
        console.warn('[GoogleSheets] Failed to save config:', e);
      }
    }
    this.notify();
  }

  public getConfig(): GoogleSheetsSyncConfig {
    return { ...this.config };
  }

  public subscribe(callback: (config: GoogleSheetsSyncConfig) => void): () => void {
    this.listeners.add(callback);
    callback(this.getConfig());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const cfg = this.getConfig();
    this.listeners.forEach(cb => {
      try {
        cb(cfg);
      } catch (err) {
        console.error('[GoogleSheets] Error in listener:', err);
      }
    });
  }

  /**
   * Helper to perform authenticated Google API calls
   */
  private async fetchGoogleApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No Google authentication token available. Please connect Google Account first.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      throw new Error('Google OAuth token expired or revoked. Please sign in with Google again.');
    }

    return res;
  }

  /**
   * 1. List user's Google Sheets from Google Drive
   */
  public async listSpreadsheets(): Promise<GoogleSpreadsheetMeta[]> {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await this.fetchGoogleApi(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=30`
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Google Sheets (HTTP ${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  /**
   * 2. Create a new structured AgencyOps Pipeline Google Sheet
   */
  public async createPipelineSpreadsheet(
    title: string = `AgencyOps - Client Pipeline (${new Date().toLocaleDateString()})`
  ): Promise<GoogleSpreadsheetMeta> {
    const body = {
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: 'Pipeline Leads & Deals',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        },
        {
          properties: {
            title: 'SOP Milestone & Tracking Log',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    };

    const res = await this.fetchGoogleApi('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Google Sheet (HTTP ${res.status})`);
    }

    const created = await res.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize Header Rows
    await this.fetchGoogleApi(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: "'Pipeline Leads & Deals'!A1:Q1",
              values: [PIPELINE_HEADERS]
            },
            {
              range: "'SOP Milestone & Tracking Log'!A1:M1",
              values: [MILESTONE_LOG_HEADERS]
            }
          ]
        })
      }
    );

    const meta: GoogleSpreadsheetMeta = {
      id: spreadsheetId,
      name: title,
      webViewLink: spreadsheetUrl
    };

    this.saveConfig({
      spreadsheetId,
      spreadsheetName: title,
      spreadsheetUrl,
      lastSyncAt: Date.now(),
      syncStatus: 'synced'
    });

    return meta;
  }

  /**
   * 3. Export full projects array into Google Sheet
   */
  public async exportProjectsToSheet(
    spreadsheetId: string,
    projects: ProjectLead[]
  ): Promise<{ success: boolean; rowsExported: number }> {
    this.saveConfig({ syncStatus: 'syncing', errorMessage: null });

    try {
      // Map projects to Sheet 1: Pipeline Leads & Deals
      const pipelineRows = projects.map(p => {
        const advPaid = p.advancePaid ? (p.advanceAmount || p.finalPrice * 0.5) : 0;
        const balPaid = p.balancePaid ? (p.balanceAmount || p.finalPrice * 0.5) : 0;
        return [
          p.id,
          p.clientName || 'Unnamed Client',
          p.clientCompany || 'Direct Client',
          p.clientEmail || '',
          p.clientPhone || '',
          (p.channel || 'direct').toUpperCase(),
          (p.websiteType || 'landing').toUpperCase(),
          p.finalPrice || 0,
          advPaid,
          balPaid,
          p.status || 'lead',
          p.assignedSalesperson || 'Agency Admin',
          p.commissionRate || 30,
          p.commissionAmount || (p.finalPrice * 0.3),
          p.stagingUrl || '',
          p.purpose || '',
          p.updatedAt ? new Date(p.updatedAt).toLocaleString() : new Date().toLocaleString()
        ];
      });

      // Map projects to Sheet 2: SOP Milestone & Tracking Log
      const milestoneRows = projects.map(p => {
        const advStatus = p.advancePaid ? 'COMPLETED (50%)' : 'PENDING';
        const balStatus = p.balancePaid ? 'COMPLETED (50%)' : 'PENDING';
        const stagingStatus = p.stagingUrl ? `READY (${p.stagingUrl})` : 'IN PROGRESS';
        const qaStatus = (p.advancePaid && p.balancePaid) ? 'PASSED' : 'PENDING REVIEW';
        const transferStatus = p.status === 'transferred' ? 'LIVE DEPLOYED' : 'LOCKED (Gate Check)';
        const leadScore = p.leadScore ? `${p.leadScore.totalScore}/100 (${p.leadScore.tierTag})` : 'UNSCORED';

        return [
          new Date().toISOString(),
          p.id,
          p.clientName,
          p.clientCompany || '',
          p.finalPrice,
          leadScore,
          'PASSED',
          advStatus,
          p.status !== 'lead' ? 'APPROVED' : 'IN REVIEW',
          stagingStatus,
          balStatus,
          qaStatus,
          transferStatus
        ];
      });

      // Clear existing values (keep headers)
      await this.fetchGoogleApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Pipeline Leads & Deals'!A2:Q1000:clear`,
        { method: 'POST' }
      ).catch(() => {});

      // Batch update data rows
      const updateRes = await this.fetchGoogleApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: 'POST',
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: [
              {
                range: "'Pipeline Leads & Deals'!A1:Q1",
                values: [PIPELINE_HEADERS]
              },
              {
                range: `'Pipeline Leads & Deals'!A2:Q${Math.max(2, pipelineRows.length + 1)}`,
                values: pipelineRows.length > 0 ? pipelineRows : [['No active projects in pipeline']]
              },
              {
                range: "'SOP Milestone & Tracking Log'!A1:M1",
                values: [MILESTONE_LOG_HEADERS]
              },
              {
                range: `'SOP Milestone & Tracking Log'!A2:M${Math.max(2, milestoneRows.length + 1)}`,
                values: milestoneRows.length > 0 ? milestoneRows : [['No milestone logs recorded']]
              }
            ]
          })
        }
      );

      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to update sheet rows (HTTP ${updateRes.status})`);
      }

      this.saveConfig({
        spreadsheetId,
        lastSyncAt: Date.now(),
        syncStatus: 'synced',
        errorMessage: null
      });

      return { success: true, rowsExported: projects.length };
    } catch (err: any) {
      console.error('[GoogleSheets] Export error:', err);
      this.saveConfig({
        syncStatus: 'error',
        errorMessage: err.message || 'Failed to export to Google Sheet'
      });
      throw err;
    }
  }

  /**
   * 4. Import raw leads from connected Google Sheet (Bulk Import)
   */
  public async importProjectsFromSheet(
    spreadsheetId: string
  ): Promise<{ importedCount: number; leads: Partial<ProjectLead>[] }> {
    this.saveConfig({ syncStatus: 'syncing', errorMessage: null });

    try {
      const res = await this.fetchGoogleApi(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Pipeline Leads & Deals'!A2:Q1000`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to read sheet data (HTTP ${res.status})`);
      }

      const data = await res.json();
      const rows: any[][] = data.values || [];

      if (rows.length === 0) {
        this.saveConfig({ syncStatus: 'synced' });
        return { importedCount: 0, leads: [] };
      }

      const parsedLeads: Partial<ProjectLead>[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[1]) continue; // Skip empty rows

        const id = (row[0] && row[0].trim()) || `proj_imp_${Date.now()}_${i}`;
        const clientName = row[1]?.trim() || `Imported Lead #${i + 1}`;
        const clientCompany = row[2]?.trim() || '';
        const clientEmail = row[3]?.trim() || '';
        const clientPhone = row[4]?.trim() || '';
        
        const rawChannel = (row[5] || 'upwork').toLowerCase().trim();
        const channel: LeadChannel = ['upwork', 'fiverr', 'linkedin', 'referral', 'cold_email', 'inbound', 'direct'].includes(rawChannel)
          ? rawChannel as LeadChannel
          : 'direct';

        const rawType = (row[6] || 'landing').toLowerCase().trim();
        const websiteType: WebsiteType = ['landing', 'ecommerce', 'corporate'].includes(rawType)
          ? rawType as WebsiteType
          : 'landing';

        const budget = Number(row[7]) || (websiteType === 'ecommerce' ? 600 : websiteType === 'corporate' ? 900 : 250);
        const advPaidAmount = Number(row[8]) || 0;
        const balPaidAmount = Number(row[9]) || 0;

        const rawStatus = (row[10] || 'lead').toLowerCase().trim();
        const status: ProjectStatus = ['lead', 'contacted', 'negotiating', 'advance_paid', 'in_development', 'staging_review', 'revision', 'qa_ready', 'balance_paid', 'transferred', 'completed', 'lost'].includes(rawStatus)
          ? rawStatus as ProjectStatus
          : advPaidAmount > 0 ? 'advance_paid' : 'lead';

        const assignedSalesperson = row[11]?.trim() || 'Tariq Mehmood';
        const commissionRate = Number(row[12]) || 30;
        const stagingUrl = row[14]?.trim() || '';
        const purpose = row[15]?.trim() || `${websiteType.toUpperCase()} website project for ${clientCompany || clientName}`;

        const parsedLead: Partial<ProjectLead> = {
          id,
          clientName,
          clientCompany,
          clientEmail,
          clientPhone,
          channel,
          websiteType,
          finalPrice: budget,
          advancePaid: advPaidAmount > 0,
          advanceAmount: advPaidAmount || budget * 0.5,
          balancePaid: balPaidAmount > 0,
          balanceAmount: balPaidAmount || budget * 0.5,
          status,
          assignedSalesperson,
          commissionRate,
          commissionAmount: budget * (commissionRate / 100),
          stagingUrl,
          purpose,
          hasLogo: true,
          hasContent: false,
          hasImages: true,
          useStockPhotos: true,
          needsContentWriting: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        parsedLeads.push(parsedLead);
      }

      this.saveConfig({
        spreadsheetId,
        lastSyncAt: Date.now(),
        syncStatus: 'synced',
        errorMessage: null
      });

      return {
        importedCount: parsedLeads.length,
        leads: parsedLeads
      };
    } catch (err: any) {
      console.error('[GoogleSheets] Import error:', err);
      this.saveConfig({
        syncStatus: 'error',
        errorMessage: err.message || 'Failed to import from Google Sheet'
      });
      throw err;
    }
  }

  /**
   * 5. Trigger auto-sync if enabled and online
   */
  public async triggerAutoSyncIfConfigured(projects: ProjectLead[]): Promise<void> {
    if (!this.config.autoSync || !this.config.spreadsheetId) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[GoogleSheets] Offline. Auto-sync deferred.');
      return;
    }

    try {
      await this.exportProjectsToSheet(this.config.spreadsheetId, projects);
      console.log('[GoogleSheets] Auto-sync completed successfully.');
    } catch (e: any) {
      console.warn('[GoogleSheets] Auto-sync failed:', e?.message);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
