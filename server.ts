import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Database & Persistence initialization
import { initPostgresPool, readDB, writeDB, INITIAL_DB } from './server/db';

// Middlewares
import { authenticateToken } from './server/middlewares/auth';

// Modular Route Handlers
import authRoutes from './server/routes/authRoutes';
import { projectRouter, portalRouter, leadScoreRouter } from './server/routes/projectRoutes';
import chatRouter from './server/routes/chatRoutes';
import { fileRouter, gdprRouter } from './server/routes/fileRoutes';
import { aiRouter, inboxRouter } from './server/routes/aiRoutes';
import { scraperRouter, ingestRouter } from './server/routes/scraperRoutes';
import { dripRouter, nudgeRouter } from './server/routes/dripRoutes';
import { invoiceRouter, commissionRouter, analyticsRouter } from './server/routes/invoiceRoutes';
import { webhookRouter, integrationRouter } from './server/routes/webhookRoutes';
import {
  databaseRouter,
  apiTokensRouter,
  auditLogsRouter,
  agencyRouter,
  generalRouter
} from './server/routes/databaseRoutes';

dotenv.config();

const app = express();
const PORT = 3000;

// Global Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(authenticateToken);

// ==========================================
// MOUNT MODULAR API ROUTERS
// ==========================================

// Authentication & Users
app.use('/api/auth', authRoutes);

// Projects, SOP Transfer Gate, Collaborators, & Leads Scoring
app.use('/api/projects', projectRouter);
app.use('/api/portal', portalRouter);
app.use('/api/leads', leadScoreRouter);

// Team Chat & Messages
app.use('/api/chat', chatRouter);

// File Vault & GDPR Compliance
app.use('/api/files', fileRouter);
app.use('/api/gdpr', gdprRouter);

// AI Assistant & Unified Communications Inbox
app.use('/api/ai', aiRouter);
app.use('/api/inbox', inboxRouter);

// Agent-Reach Scraper & External Inbound Ingest (n8n, Python)
app.use('/api/scraper', scraperRouter);
app.use('/api/v1/leads', ingestRouter);

// Smart Drip Campaigns & Automated Nudges
app.use('/api/drip', dripRouter);
app.use('/api/nudges', nudgeRouter);

// Invoices, Commission Ledger & Executive Analytics
app.use('/api/invoices', invoiceRouter);
app.use('/api/commissions', commissionRouter);
app.use('/api/analytics', analyticsRouter);

// Webhooks & Gateway Connectors
app.use('/api/webhooks', webhookRouter);
app.use('/api/integrations', integrationRouter);

// Database Operations, API Tokens, Audit Logs, Agency Mode, Health & Test Runner
app.use('/api/database', databaseRouter);
app.use('/api/api-tokens', apiTokensRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/agency', agencyRouter);
app.use('/api', generalRouter);

// Export shared database functions for any legacy external bindings
export { readDB, writeDB, INITIAL_DB };

// ==========================================
// VITE DEV SERVER & PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  // Initialize PostgreSQL pool if DATABASE_URL configured
  await initPostgresPool();

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} at http://0.0.0.0:${PORT}`);
  });
}

startServer();
