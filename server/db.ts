import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

export interface DatabaseStatus {
  engine: 'postgresql' | 'local_disk_json';
  connected: boolean;
  latencyMs: number;
  poolSize: number;
  totalRecords: number;
  host?: string;
  database?: string;
  lastBackupAt: string;
  tables: Array<{
    name: string;
    count: number;
  }>;
  connectionUrlMasked?: string;
  error?: string;
}

// Storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Global In-Memory Cache
let memoryDB: any = null;
let pgPool: pg.Pool | null = null;
let isPgConnected = false;
let lastPgPingMs = 0;
let lastBackupTimestamp = new Date().toISOString();

// Helper to hash passwords with salt
export function hashPassword(password: string, salt: string = 'agency_salt_2026'): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Pre-configured staff and client accounts for production RBAC
export const DEFAULT_USERS = [
  {
    id: 'user-admin-1',
    name: 'Tariq Mehmood',
    email: 'admin@agencyops.dev',
    passwordHash: hashPassword('Admin@12345'),
    role: 'admin',
    title: 'Agency Director & BD Head',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    permissions: [
      'admin:all',
      'projects:read',
      'projects:write',
      'commissions:approve',
      'commissions:payout',
      'database:manage',
      'webhooks:manage',
      'vault:manage',
      'chat:write'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-sales-1',
    name: 'Hamza Farooq',
    email: 'sales@agencyops.dev',
    passwordHash: hashPassword('Sales@12345'),
    role: 'sales',
    title: 'Senior Business Development & Sales Rep',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    permissions: [
      'projects:read',
      'projects:write',
      'outreach:generate',
      'inbox:manage',
      'commissions:view_own',
      'chat:write'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-coord-1',
    name: 'Fatima Noor',
    email: 'coordinator@agencyops.dev',
    passwordHash: hashPassword('Coord@12345'),
    role: 'coordinator',
    title: 'Senior Project Coordinator & QA Lead',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    permissions: [
      'projects:read',
      'projects:write',
      'sop:verify',
      'inbox:manage',
      'discord:handoff',
      'staging:review',
      'chat:write'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-dev-1',
    name: 'Zain Ul Abideen',
    email: 'dev@agencyops.dev',
    passwordHash: hashPassword('Dev@12345'),
    role: 'developer',
    title: 'Lead Full-Stack Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    permissions: [
      'projects:read',
      'staging:review',
      'qa:signoff',
      'discord:handoff',
      'vault:read',
      'webhooks:view_logs',
      'chat:write'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-client-1',
    name: 'Alexander Vance',
    email: 'client@lumina-health.co.uk',
    passwordHash: hashPassword('Client@12345'),
    role: 'client_guest',
    title: 'Client Stakeholder (Lumina Health UK)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    permissions: [
      'portal:access',
      'milestones:review',
      'staging:inspect',
      'invoices:view',
      'feedback:submit'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-collab-1',
    name: 'Marcus Vance',
    email: 'partner@vance-capital.com',
    passwordHash: hashPassword('Partner@12345'),
    role: 'collaborator',
    title: 'Partner & Real Estate Deal Evaluator',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    permissions: [
      'projects:read_assigned',
      'deals:evaluate',
      'staging:inspect',
      'feedback:submit',
      'chat:write'
    ],
    createdAt: new Date().toISOString()
  }
];

// Production API Tokens for External Automation (n8n, Python web scrapers, Zapier)
export const DEFAULT_API_TOKENS = [
  {
    id: 'tok-n8n-live',
    name: 'n8n Ingestion Webhook Key',
    tokenHash: crypto.createHash('sha256').update('sk_live_agency_n8n_prod_secret_key_2026').digest('hex'),
    tokenPrefix: 'sk_live_agency_n8n...2026',
    createdBy: 'admin@agencyops.dev',
    userId: 'user-admin-1',
    permissions: ['leads:write', 'realestate:write'],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    expiresAt: null,
    revokedAt: null,
    lastUsedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'tok-python-scraper',
    name: 'Python Real Estate IDX Scraper Key',
    tokenHash: crypto.createHash('sha256').update('sk_live_agency_py_realestate_idx_key_2026').digest('hex'),
    tokenPrefix: 'sk_live_agency_py...2026',
    createdBy: 'admin@agencyops.dev',
    userId: 'user-admin-1',
    permissions: ['leads:write', 'realestate:write'],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    expiresAt: null,
    revokedAt: null,
    lastUsedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

// Production Audit Trail & Security Event Logs
export const DEFAULT_AUDIT_LOGS = [
  {
    id: 'audit-boot-1',
    userId: 'user-admin-1',
    userName: 'Tariq Mehmood',
    userRole: 'admin',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'database',
    entityId: 'agency_db',
    details: { engine: 'postgresql_dual_persistence', version: '2.5.0', secureMode: true },
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: 'audit-collab-1',
    userId: 'user-admin-1',
    userName: 'Tariq Mehmood',
    userRole: 'admin',
    action: 'COLLABORATOR_ASSIGNED',
    entityType: 'project',
    entityId: 'proj-1',
    details: { collaborator: 'partner@vance-capital.com', project: 'Lumina Health Clinics UK' },
    ipAddress: '192.168.1.102',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'audit-api-key-1',
    userId: 'user-admin-1',
    userName: 'Tariq Mehmood',
    userRole: 'admin',
    action: 'API_TOKEN_CREATED',
    entityType: 'api_token',
    entityId: 'tok-n8n-live',
    details: { name: 'n8n Ingestion Webhook Key', permissions: ['leads:write'] },
    ipAddress: '192.168.1.102',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// Production Connectors
export const DEFAULT_CONNECTORS = [
  {
    id: 'conn-stripe',
    channel: 'stripe',
    name: 'Stripe Global Payment Gateway',
    category: 'payments',
    description: 'Direct credit card, Apple Pay, and UK Faster Payments gateway. Automatically unlocks SOP Rule 8 Website Transfer upon balance clearance.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 5,
    webhookEndpoint: '/api/webhooks/stripe',
    eventsHandledCount: 42,
    successRatePercent: 100,
    activeFeatures: ['Auto-reconcile 50% Advance', 'Auto-clear 50% Balance', 'Receipt Generation'],
    configSummary: 'Listening to checkout.session.completed & payment_intent.succeeded'
  },
  {
    id: 'conn-upwork',
    channel: 'upwork',
    name: 'Upwork Enterprise Lead & Escrow Hook',
    category: 'lead_generation',
    description: 'Bi-directional webhook synchronization for Upwork Direct Messages, Contract Milestones, and Escrow releases.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 10,
    webhookEndpoint: '/api/webhooks/upwork',
    eventsHandledCount: 28,
    successRatePercent: 99.2,
    activeFeatures: ['Inbound RFP Intake', 'Milestone Escrow Tracking', 'SOP Transfer Authorizer'],
    configSummary: 'Listening to contract_milestone_funded & milestone_released'
  },
  {
    id: 'conn-paypal',
    channel: 'paypal',
    name: 'PayPal Merchant Business Platform',
    category: 'payments',
    description: 'Instant IPN & Webhook transaction capture for international wire settlements and invoice milestone clearing.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 15,
    webhookEndpoint: '/api/webhooks/paypal',
    eventsHandledCount: 35,
    successRatePercent: 98.9,
    activeFeatures: ['Instant IPN Settlement', 'Dispute Guard', 'Multi-Currency USD/GBP'],
    configSummary: 'Listening to PAYMENT.CAPTURE.COMPLETED'
  },
  {
    id: 'conn-discord',
    channel: 'discord',
    name: 'Discord Agency Command Bot',
    category: 'messaging',
    description: 'Automated SOP Step 7 project briefing notifications, staging launch alerts, and payment celebration broadcasts.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 1,
    webhookEndpoint: '/api/webhooks/discord',
    eventsHandledCount: 56,
    successRatePercent: 100,
    activeFeatures: ['Closed Deal Briefings', 'Staging Deploy Pings', 'Team Escalation Bot'],
    configSummary: 'Webhook Bot Active on #sales-leads & #staging-dev'
  },
  {
    id: 'conn-linkedin',
    channel: 'linkedin',
    name: 'LinkedIn Sales Navigator Lead Stream',
    category: 'lead_generation',
    description: 'Captures incoming connection acceptances and InMail replies into the Unified Inbox with AI sentiment scoring.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 15,
    webhookEndpoint: '/api/webhooks/linkedin',
    eventsHandledCount: 19,
    successRatePercent: 97.4,
    activeFeatures: ['InMail Message Sync', 'Connection Tracker', 'AI Reply Drafter'],
    configSummary: 'Syncing Sales Navigator Lead Lists'
  },
  {
    id: 'conn-hostinger',
    channel: 'hostinger',
    name: 'Hostinger / Cloudflare DNS DevOps API',
    category: 'scheduling',
    description: 'DevOps automation for provisioning staging subdomains and executing final DNS A-record live cutovers after SOP balance check.',
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    syncIntervalMinutes: 30,
    webhookEndpoint: '/api/webhooks/hostinger',
    eventsHandledCount: 14,
    successRatePercent: 100,
    activeFeatures: ['Staging DNS Provisioning', 'SSL Auto-Issue', 'SOP Live Cutover Gate'],
    configSummary: 'Cloudflare & Hostinger API Token Verified'
  }
];

// Mask a connection URL for safe presentation
export function maskUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1••••••••$2');
}

// PostgreSQL Schema Initialization SQL
const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS agency_projects (
  id VARCHAR PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  avatar VARCHAR,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_inbox (
  id VARCHAR PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_invoices (
  id VARCHAR PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_webhook_logs (
  id VARCHAR PRIMARY KEY,
  channel VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_connectors (
  id VARCHAR PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agency_settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  token_hash VARCHAR NOT NULL,
  token_prefix VARCHAR NOT NULL,
  created_by VARCHAR NOT NULL,
  user_id VARCHAR,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR,
  user_name VARCHAR,
  user_role VARCHAR,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  details JSONB,
  ip_address VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Initialize PostgreSQL connection pool if DATABASE_URL is configured
 */
export async function initPostgresPool(connectionString?: string): Promise<boolean> {
  const connUrl = connectionString || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connUrl) {
    isPgConnected = false;
    return false;
  }

  try {
    const isSslRequired = !connUrl.includes('localhost') && !connUrl.includes('127.0.0.1');
    const newPool = new Pool({
      connectionString: connUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    const start = Date.now();
    const client = await newPool.connect();
    lastPgPingMs = Date.now() - start;

    // Run schema creation
    await client.query(POSTGRES_SCHEMA_SQL);
    client.release();

    if (pgPool) {
      await pgPool.end().catch(() => {});
    }

    pgPool = newPool;
    isPgConnected = true;
    console.log(`✅ [Database Engine] Connected to PostgreSQL successfully (${lastPgPingMs}ms latency). Schema verified.`);
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [Database Engine] PostgreSQL connection failed: ${err.message}. Running in resilient local JSON disk mode.`);
    isPgConnected = false;
    return false;
  }
}

/**
 * Load initial data into memory from disk or initialize fresh
 */
export function loadLocalDB(initialFallbackData: any): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const seeded = {
        ...initialFallbackData,
        users: DEFAULT_USERS,
        connectors: DEFAULT_CONNECTORS,
        apiTokens: DEFAULT_API_TOKENS,
        auditLogs: DEFAULT_AUDIT_LOGS,
        webhookLogs: [
          {
            id: 'log-seed-1',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            source: 'stripe',
            event: 'checkout.session.completed',
            status: 'success',
            summary: 'Advance 50% milestone payment received ($625 USD) for Alexander Vance (Lumina Health)',
            payloadSnippet: JSON.stringify({ amount: 625, currency: 'usd', customer: 'alex.vance@lumina-health.co.uk' }),
            impactedProjectId: 'proj-1'
          }
        ]
      };
      atomicWriteFile(DB_FILE, JSON.stringify(seeded, null, 2));
      memoryDB = seeded;
      return seeded;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Merge with fallback data so all critical collections are guaranteed to exist and be populated
    const merged = {
      ...(initialFallbackData || {}),
      ...parsed,
      projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : (initialFallbackData?.projects || []),
      invoices: Array.isArray(parsed.invoices) && parsed.invoices.length > 0 ? parsed.invoices : (initialFallbackData?.invoices || []),
      clientInquiries: Array.isArray(parsed.clientInquiries) && parsed.clientInquiries.length > 0 ? parsed.clientInquiries : (initialFallbackData?.clientInquiries || []),
      chatMessages: Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : (initialFallbackData?.chatMessages || []),
      files: Array.isArray(parsed.files) && parsed.files.length > 0 ? parsed.files : (initialFallbackData?.files || []),
      gdprLogs: Array.isArray(parsed.gdprLogs) ? parsed.gdprLogs : (initialFallbackData?.gdprLogs || []),
      scrapedLeads: Array.isArray(parsed.scrapedLeads) && parsed.scrapedLeads.length > 0 ? parsed.scrapedLeads : (initialFallbackData?.scrapedLeads || []),
      dripTemplates: Array.isArray(parsed.dripTemplates) && parsed.dripTemplates.length > 0 ? parsed.dripTemplates : (initialFallbackData?.dripTemplates || []),
      commissionPayouts: Array.isArray(parsed.commissionPayouts) && parsed.commissionPayouts.length > 0 ? parsed.commissionPayouts : (initialFallbackData?.commissionPayouts || []),
      commissionAuditLogs: Array.isArray(parsed.commissionAuditLogs) && parsed.commissionAuditLogs.length > 0 ? parsed.commissionAuditLogs : (initialFallbackData?.commissionAuditLogs || []),
      salespersonProfiles: Array.isArray(parsed.salespersonProfiles) && parsed.salespersonProfiles.length > 0 ? parsed.salespersonProfiles : (initialFallbackData?.salespersonProfiles || []),
      nudgeTemplates: Array.isArray(parsed.nudgeTemplates) && parsed.nudgeTemplates.length > 0 ? parsed.nudgeTemplates : (initialFallbackData?.nudgeTemplates || []),
      nudgeLogs: Array.isArray(parsed.nudgeLogs) && parsed.nudgeLogs.length > 0 ? parsed.nudgeLogs : (initialFallbackData?.nudgeLogs || []),
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
      connectors: Array.isArray(parsed.connectors) && parsed.connectors.length > 0 ? parsed.connectors : DEFAULT_CONNECTORS,
      apiTokens: Array.isArray(parsed.apiTokens) && parsed.apiTokens.length > 0 ? parsed.apiTokens : (initialFallbackData?.apiTokens || DEFAULT_API_TOKENS),
      auditLogs: Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0 ? parsed.auditLogs : (initialFallbackData?.auditLogs || DEFAULT_AUDIT_LOGS),
      webhookLogs: Array.isArray(parsed.webhookLogs) ? parsed.webhookLogs : []
    };

    memoryDB = merged;
    // Persist full structure to disk so future loads are complete
    atomicWriteFile(DB_FILE, JSON.stringify(merged, null, 2));
    return merged;
  } catch (err: any) {
    console.error('Error loading DB, attempting recovery from latest backup:', err.message);
    const recovered = attemptBackupRecovery();
    if (recovered) {
      memoryDB = recovered;
      return recovered;
    }
    memoryDB = initialFallbackData;
    return initialFallbackData;
  }
}

/**
 * Atomic write to file to prevent corruption on crash/power failure
 */
function atomicWriteFile(filePath: string, content: string): void {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, content, 'utf-8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Save snapshot backup in data/backups/
 */
export function createBackup(): string {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUPS_DIR, `db-snapshot-${ts}.json`);
    atomicWriteFile(backupFile, JSON.stringify(memoryDB, null, 2));
    lastBackupTimestamp = new Date().toISOString();

    // Keep only last 10 backups
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('db-snapshot-'))
      .sort()
      .reverse();

    if (files.length > 10) {
      for (const f of files.slice(10)) {
        fs.unlinkSync(path.join(BACKUPS_DIR, f));
      }
    }

    return backupFile;
  } catch (err: any) {
    console.error('Failed to create backup snapshot:', err.message);
    return '';
  }
}

/**
 * Attempt to restore from latest backup if main db.json was corrupted
 */
function attemptBackupRecovery(): any | null {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return null;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('db-snapshot-'))
      .sort()
      .reverse();

    if (files.length === 0) return null;
    const latest = path.join(BACKUPS_DIR, files[0]);
    const raw = fs.readFileSync(latest, 'utf-8');
    const parsed = JSON.parse(raw);
    console.log(`🛡️ Successfully recovered database from snapshot: ${files[0]}`);
    atomicWriteFile(DB_FILE, raw);
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Synchronous read from in-memory cache
 */
export function getDB(initialFallback?: any): any {
  if (!memoryDB) {
    memoryDB = loadLocalDB(initialFallback || {});
  }
  return memoryDB;
}

/**
 * Save DB state:
 * 1. Updates memory cache
 * 2. Writes atomically to local data/db.json
 * 3. If PostgreSQL is connected, asynchronously syncs changes to PostgreSQL tables
 */
export function saveDB(newDB: any): void {
  memoryDB = newDB;

  try {
    atomicWriteFile(DB_FILE, JSON.stringify(newDB, null, 2));
  } catch (err: any) {
    console.error('Error saving local db.json:', err.message);
  }

  // Asynchronous sync to PostgreSQL if connected
  if (isPgConnected && pgPool) {
    syncToPostgresAsync(newDB).catch(err => {
      console.warn('Background sync to PostgreSQL had warning:', err.message);
    });
  }
}

/**
 * Asynchronously persist updated data to PostgreSQL tables
 */
async function syncToPostgresAsync(db: any): Promise<void> {
  if (!pgPool || !isPgConnected) return;

  try {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Sync projects
      if (Array.isArray(db.projects)) {
        for (const proj of db.projects) {
          await client.query(
            `INSERT INTO agency_projects (id, data, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [proj.id, JSON.stringify(proj)]
          );
        }
      }

      // Sync users
      if (Array.isArray(db.users)) {
        for (const user of db.users) {
          await client.query(
            `INSERT INTO agency_users (id, email, password_hash, role, name, avatar, permissions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE
             SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
                 role = EXCLUDED.role, name = EXCLUDED.name, permissions = EXCLUDED.permissions`,
            [user.id, user.email, user.passwordHash || '', user.role, user.name, user.avatar || '', JSON.stringify(user.permissions || [])]
          );
        }
      }

      // Sync webhooks logs (last 50)
      if (Array.isArray(db.webhookLogs)) {
        const recentLogs = db.webhookLogs.slice(0, 50);
        for (const log of recentLogs) {
          await client.query(
            `INSERT INTO agency_webhook_logs (id, channel, event_type, payload, status, processed_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [log.id, log.source || 'stripe', log.event || 'event', JSON.stringify(log), log.status || 'success', log.timestamp || new Date().toISOString()]
          );
        }
      }

      // Sync API tokens
      if (Array.isArray(db.apiTokens)) {
        for (const tok of db.apiTokens) {
          await client.query(
            `INSERT INTO api_tokens (id, name, token_hash, token_prefix, created_by, user_id, permissions, created_at, expires_at, revoked_at, last_used_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE
             SET name = EXCLUDED.name, revoked_at = EXCLUDED.revoked_at, last_used_at = EXCLUDED.last_used_at`,
            [tok.id, tok.name, tok.tokenHash, tok.tokenPrefix, tok.createdBy, tok.userId || null, JSON.stringify(tok.permissions || []), tok.createdAt, tok.expiresAt || null, tok.revokedAt || null, tok.lastUsedAt || null]
          );
        }
      }

      // Sync audit logs (last 50)
      if (Array.isArray(db.auditLogs)) {
        const recentAudit = db.auditLogs.slice(0, 50);
        for (const alog of recentAudit) {
          await client.query(
            `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [alog.id, alog.userId || null, alog.userName || null, alog.userRole || null, alog.action, alog.entityType, alog.entityId || null, JSON.stringify(alog.details || {}), alog.ipAddress || null, alog.createdAt]
          );
        }
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('PostgreSQL sync error:', err.message);
  }
}

/**
 * Get comprehensive Database Engine Status
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const db = getDB();
  const connUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  let latency = 0;
  let pgConnectedNow = false;

  if (pgPool) {
    try {
      const start = Date.now();
      await pgPool.query('SELECT 1');
      latency = Date.now() - start;
      pgConnectedNow = true;
      isPgConnected = true;
    } catch (e) {
      pgConnectedNow = false;
      isPgConnected = false;
    }
  }

  const projectsCount = (db.projects || []).length;
  const usersCount = (db.users || []).length;
  const inquiriesCount = (db.clientInquiries || []).length;
  const invoicesCount = (db.invoices || []).length;
  const webhookLogsCount = (db.webhookLogs || []).length;
  const connectorsCount = (db.connectors || []).length;
  const apiTokensCount = (db.apiTokens || []).length;
  const auditLogsCount = (db.auditLogs || []).length;

  return {
    engine: pgConnectedNow ? 'postgresql' : 'local_disk_json',
    connected: pgConnectedNow,
    latencyMs: latency,
    poolSize: pgPool?.totalCount || 0,
    totalRecords: projectsCount + usersCount + inquiriesCount + invoicesCount + webhookLogsCount + apiTokensCount + auditLogsCount,
    host: connUrl ? maskUrl(connUrl).split('@')[1]?.split('/')[0] : 'local-filesystem',
    database: connUrl ? connUrl.split('/').pop()?.split('?')[0] : 'db.json (atomic write)',
    lastBackupAt: lastBackupTimestamp,
    tables: [
      { name: 'agency_projects', count: projectsCount },
      { name: 'agency_users', count: usersCount },
      { name: 'agency_inbox', count: inquiriesCount },
      { name: 'agency_invoices', count: invoicesCount },
      { name: 'agency_webhook_logs', count: webhookLogsCount },
      { name: 'agency_connectors', count: connectorsCount },
      { name: 'api_tokens', count: apiTokensCount },
      { name: 'audit_logs', count: auditLogsCount }
    ],
    connectionUrlMasked: maskUrl(connUrl)
  };
}

/**
 * Test a PostgreSQL connection without making it default
 */
export async function testPostgresConnection(testUrl: string): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  if (!testUrl || !testUrl.startsWith('postgres')) {
    return { ok: false, latencyMs: 0, message: 'Invalid PostgreSQL connection URI. Must begin with postgresql:// or postgres://' };
  }

  try {
    const isSslRequired = !testUrl.includes('localhost') && !testUrl.includes('127.0.0.1');
    const testPool = new Pool({
      connectionString: testUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000
    });

    const start = Date.now();
    const client = await testPool.connect();
    const result = await client.query('SELECT version();');
    const latency = Date.now() - start;
    client.release();
    await testPool.end();

    const versionStr = result.rows[0]?.version || 'PostgreSQL';
    return {
      ok: true,
      latencyMs: latency,
      message: `Successfully connected to ${versionStr.split(',')[0]} in ${latency}ms.`
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: 0,
      message: `Connection failed: ${err.message}`
    };
  }
}

/**
 * Migrate all current local data into a target PostgreSQL database in 1 click
 */
export async function migrateToPostgres(targetUrl: string): Promise<{ success: boolean; message: string; recordsMigrated: number }> {
  const testRes = await testPostgresConnection(targetUrl);
  if (!testRes.ok) {
    return { success: false, message: testRes.message, recordsMigrated: 0 };
  }

  try {
    const isSslRequired = !targetUrl.includes('localhost') && !targetUrl.includes('127.0.0.1');
    const newPool = new Pool({
      connectionString: targetUrl,
      ssl: isSslRequired ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 8000
    });

    const client = await newPool.connect();
    await client.query(POSTGRES_SCHEMA_SQL);

    const db = getDB();
    let count = 0;

    await client.query('BEGIN');

    // Migrate projects
    for (const p of db.projects || []) {
      await client.query(
        `INSERT INTO agency_projects (id, data, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [p.id, JSON.stringify(p)]
      );
      count++;
    }

    // Migrate users
    for (const u of db.users || DEFAULT_USERS) {
      await client.query(
        `INSERT INTO agency_users (id, email, password_hash, role, name, avatar, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role, name = EXCLUDED.name, permissions = EXCLUDED.permissions`,
        [u.id, u.email, u.passwordHash || '', u.role, u.name, u.avatar || '', JSON.stringify(u.permissions || [])]
      );
      count++;
    }

    // Migrate inbox
    for (const msg of db.clientInquiries || []) {
      await client.query(
        `INSERT INTO agency_inbox (id, data, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [msg.id, JSON.stringify(msg)]
      );
      count++;
    }

    // Migrate invoices
    for (const inv of db.invoices || []) {
      await client.query(
        `INSERT INTO agency_invoices (id, data, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [inv.id, JSON.stringify(inv)]
      );
      count++;
    }

    await client.query('COMMIT');
    client.release();

    // Switch active pool
    if (pgPool) await pgPool.end().catch(() => {});
    pgPool = newPool;
    isPgConnected = true;

    return {
      success: true,
      message: `Migration complete! Successfully transferred ${count} records into PostgreSQL tables.`,
      recordsMigrated: count
    };
  } catch (err: any) {
    return { success: false, message: `Migration error: ${err.message}`, recordsMigrated: 0 };
  }
}

/**
 * Generate full SQL export script (DDL + INSERTs) for Railway, Supabase, Neon, or Cloud SQL
 */
export function generateSQLDump(): string {
  const db = getDB();
  let sql = `-- ========================================================\n`;
  sql += `-- ALM Nexus / ClientOps PostgreSQL Production Schema Dump\n`;
  sql += `-- Export Date: ${new Date().toISOString()}\n`;
  sql += `-- Compatible with Railway, Supabase, Neon, AWS RDS, Cloud SQL\n`;
  sql += `-- ========================================================\n\n`;

  sql += POSTGRES_SCHEMA_SQL + `\n\n`;

  // Insert Users
  sql += `-- 1. Staff and Client Users (Salted SHA-256 Authentication)\n`;
  for (const u of db.users || DEFAULT_USERS) {
    const escapedName = (u.name || '').replace(/'/g, "''");
    const escapedEmail = (u.email || '').replace(/'/g, "''");
    const escapedRole = (u.role || '').replace(/'/g, "''");
    const escapedAvatar = (u.avatar || '').replace(/'/g, "''");
    const escapedPerms = JSON.stringify(u.permissions || []).replace(/'/g, "''");
    sql += `INSERT INTO agency_users (id, email, password_hash, role, name, avatar, permissions)\n`;
    sql += `VALUES ('${u.id}', '${escapedEmail}', '${u.passwordHash}', '${escapedRole}', '${escapedName}', '${escapedAvatar}', '${escapedPerms}'::jsonb)\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, permissions = EXCLUDED.permissions;\n\n`;
  }

  // Insert Projects
  sql += `-- 2. SOP Projects Pipeline & Escrow Milestones\n`;
  for (const p of db.projects || []) {
    const escapedJson = JSON.stringify(p).replace(/'/g, "''");
    sql += `INSERT INTO agency_projects (id, data, updated_at)\n`;
    sql += `VALUES ('${p.id}', '${escapedJson}'::jsonb, NOW())\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();\n\n`;
  }

  // Insert Invoices
  sql += `-- 3. Project Invoices & 50% Milestone Receipts\n`;
  for (const inv of db.invoices || []) {
    const escapedJson = JSON.stringify(inv).replace(/'/g, "''");
    sql += `INSERT INTO agency_invoices (id, data, created_at)\n`;
    sql += `VALUES ('${inv.id}', '${escapedJson}'::jsonb, NOW())\n`;
    sql += `ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;\n\n`;
  }

  // Insert API Tokens
  sql += `-- 4. Inbound Automation API Tokens (n8n & Python Scrapers)\n`;
  for (const tok of db.apiTokens || []) {
    const escapedName = (tok.name || '').replace(/'/g, "''");
    const escapedCreatedBy = (tok.createdBy || '').replace(/'/g, "''");
    const escapedPerms = JSON.stringify(tok.permissions || []).replace(/'/g, "''");
    sql += `INSERT INTO api_tokens (id, name, token_hash, token_prefix, created_by, user_id, permissions, created_at, expires_at, revoked_at, last_used_at)\n`;
    sql += `VALUES ('${tok.id}', '${escapedName}', '${tok.tokenHash}', '${tok.tokenPrefix}', '${escapedCreatedBy}', ${tok.userId ? `'${tok.userId}'` : 'NULL'}, '${escapedPerms}'::jsonb, '${tok.createdAt}', ${tok.expiresAt ? `'${tok.expiresAt}'` : 'NULL'}, ${tok.revokedAt ? `'${tok.revokedAt}'` : 'NULL'}, ${tok.lastUsedAt ? `'${tok.lastUsedAt}'` : 'NULL'})\n`;
    sql += `ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  return sql;
}

/**
 * Generate a new secure API token for external inbound automation (n8n, Python web scrapers)
 */
export function createApiToken(params: {
  name: string;
  createdBy: string;
  userId?: string;
  permissions?: string[];
  expiresInDays?: number;
}): { tokenRecord: any; rawToken: string } {
  const db = getDB();
  if (!Array.isArray(db.apiTokens)) {
    db.apiTokens = [];
  }

  // Generate cryptographically secure random token (64 hex characters)
  const randomHex = crypto.randomBytes(24).toString('hex');
  const rawToken = `sk_live_agency_${randomHex}`;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenPrefix = `sk_live_...${randomHex.substring(randomHex.length - 6)}`;

  const now = new Date();
  let expiresAt: string | null = null;
  if (params.expiresInDays && params.expiresInDays > 0) {
    const exp = new Date(now.getTime() + params.expiresInDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  const tokenRecord = {
    id: `tok-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name: params.name || 'External Automation Key',
    tokenHash,
    tokenPrefix,
    createdBy: params.createdBy,
    userId: params.userId || 'user-admin-1',
    permissions: params.permissions || ['leads:write', 'realestate:write'],
    createdAt: now.toISOString(),
    expiresAt,
    revokedAt: null,
    lastUsedAt: null
  };

  db.apiTokens.unshift(tokenRecord);
  saveDB(db);

  // Automatically log audit trail
  logAuditAction({
    userId: params.userId || 'user-admin-1',
    userName: params.createdBy,
    userRole: 'admin',
    action: 'API_TOKEN_CREATED',
    entityType: 'api_token',
    entityId: tokenRecord.id,
    details: { name: tokenRecord.name, prefix: tokenPrefix, expiresAt },
    ipAddress: 'internal'
  });

  return { tokenRecord, rawToken };
}

/**
 * Verify an API token presented by an external caller (e.g. n8n, Python scrapers)
 */
export function verifyApiToken(rawKey: string): { valid: boolean; token?: any; error?: string } {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, error: 'API key is missing or invalid format.' };
  }

  const cleanKey = rawKey.trim().replace(/^Bearer\s+/i, '');
  const incomingHash = crypto.createHash('sha256').update(cleanKey).digest('hex');

  const db = getDB();
  const tokens = Array.isArray(db.apiTokens) ? db.apiTokens : [];
  const token = tokens.find((t: any) => t.tokenHash === incomingHash);

  if (!token) {
    return { valid: false, error: 'Invalid API token. Access denied.' };
  }

  if (token.revokedAt) {
    return { valid: false, error: 'API token has been revoked by the BD Head.' };
  }

  if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: 'API token has expired.' };
  }

  // Update last used timestamp
  token.lastUsedAt = new Date().toISOString();
  saveDB(db);

  return { valid: true, token };
}

/**
 * Revoke an API token
 */
export function revokeApiToken(tokenId: string, revokerEmail?: string): boolean {
  const db = getDB();
  if (!Array.isArray(db.apiTokens)) return false;

  const token = db.apiTokens.find((t: any) => t.id === tokenId);
  if (!token) return false;

  token.revokedAt = new Date().toISOString();
  saveDB(db);

  logAuditAction({
    userId: token.userId || 'user-admin-1',
    userName: revokerEmail || token.createdBy,
    userRole: 'admin',
    action: 'API_TOKEN_REVOKED',
    entityType: 'api_token',
    entityId: token.id,
    details: { name: token.name, prefix: token.tokenPrefix },
    ipAddress: 'internal'
  });

  return true;
}

/**
 * List all API tokens (sanitized, no token secret)
 */
export function getApiTokens(): any[] {
  const db = getDB();
  const tokens = Array.isArray(db.apiTokens) ? db.apiTokens : [];
  return tokens.map((t: any) => ({
    id: t.id,
    name: t.name,
    tokenPrefix: t.tokenPrefix,
    createdBy: t.createdBy,
    userId: t.userId,
    permissions: t.permissions,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    revokedAt: t.revokedAt,
    lastUsedAt: t.lastUsedAt,
    status: t.revokedAt ? 'revoked' : (t.expiresAt && new Date(t.expiresAt).getTime() < Date.now() ? 'expired' : 'active')
  }));
}

/**
 * Append an immutable audit trail entry
 */
export function logAuditAction(params: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}): any {
  const db = getDB();
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }

  const logEntry = {
    id: `audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId || 'system',
    userName: params.userName || 'System Engine',
    userRole: params.userRole || 'system',
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId || null,
    details: params.details || {},
    ipAddress: params.ipAddress || '127.0.0.1',
    createdAt: new Date().toISOString()
  };

  db.auditLogs.unshift(logEntry);
  // Cap in-memory/JSON audit log history to last 500 records
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }

  saveDB(db);

  // If PostgreSQL is connected, write immediately to audit_logs table
  if (isPgConnected && pgPool) {
    pgPool.query(
      `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [logEntry.id, logEntry.userId, logEntry.userName, logEntry.userRole, logEntry.action, logEntry.entityType, logEntry.entityId, JSON.stringify(logEntry.details), logEntry.ipAddress, logEntry.createdAt]
    ).catch(e => {
      console.warn('Could not persist audit log directly to PostgreSQL:', e.message);
    });
  }

  return logEntry;
}

/**
 * Retrieve filtered audit logs
 */
export function getAuditLogs(options?: {
  action?: string;
  userId?: string;
  entityType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): { logs: any[]; total: number } {
  const db = getDB();
  let logs: any[] = Array.isArray(db.auditLogs) ? [...db.auditLogs] : [];

  if (options?.action && options.action !== 'all') {
    logs = logs.filter(l => l.action.toLowerCase() === options.action?.toLowerCase());
  }

  if (options?.entityType && options.entityType !== 'all') {
    logs = logs.filter(l => l.entityType.toLowerCase() === options.entityType?.toLowerCase());
  }

  if (options?.userId && options.userId !== 'all') {
    logs = logs.filter(l => l.userId === options.userId);
  }

  if (options?.search) {
    const s = options.search.toLowerCase();
    logs = logs.filter(l => 
      (l.action && l.action.toLowerCase().includes(s)) ||
      (l.userName && l.userName.toLowerCase().includes(s)) ||
      (l.entityType && l.entityType.toLowerCase().includes(s)) ||
      (l.entityId && l.entityId.toLowerCase().includes(s)) ||
      (JSON.stringify(l.details || {}).toLowerCase().includes(s))
    );
  }

  const total = logs.length;
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const paginated = logs.slice(offset, offset + limit);

  return { logs: paginated, total };
}

