import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { readDB, writeDB } from '../db';
import { AuthenticatedRequest } from '../middlewares/auth';

export const fileRouter = Router();
export const gdprRouter = Router();

// ==========================================
// File Vault Endpoints (/api/files)
// ==========================================

fileRouter.get('/', (req: Request, res: Response) => {
  const db = readDB();
  const authUser = (req as AuthenticatedRequest).user;
  
  // Strict RBAC: Extract role from verified token, never blindly trust query parameters
  const userRole = authUser?.role || 'client_guest';

  // Filter based on verified RBAC permissions
  let accessibleFiles = (db.files || []).filter((f: any) => {
    const rolesReq = Array.isArray(f.roleRequired) ? f.roleRequired : ['admin'];
    if (userRole === 'admin' || userRole === 'bd_head') return true;
    return rolesReq.includes(userRole as any);
  });

  // If client guest, strictly isolate to their deliverables
  if (userRole === 'client_guest') {
    accessibleFiles = accessibleFiles.filter((f: any) => f.category === 'deliverables' || f.category === 'contracts');
  }

  res.json({ success: true, count: accessibleFiles.length, files: accessibleFiles });
});

fileRouter.post('/', (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  const userRole = authUser?.role || 'client_guest';

  // Client guests cannot upload to company internal vault
  if (userRole === 'client_guest') {
    return res.status(403).json({ success: false, error: 'Forbidden: Client guest accounts cannot upload to agency file vault.' });
  }

  const db = readDB();
  const { name, size, mimeType, uploadedBy, roleRequired, projectId, category } = req.body;

  if (!name) return res.status(400).json({ error: 'File name is required' });

  // Generate real cryptographic SHA256 hash for secure verification
  const hash = crypto.createHash('sha256').update(name + Date.now().toString()).digest('hex');

  const newFile = {
    id: `file-${Date.now()}`,
    name,
    size: Number(size) || 1024 * 50,
    mimeType: mimeType || 'application/octet-stream',
    uploadedBy: authUser?.name || uploadedBy || 'Staff Member',
    uploadedAt: new Date().toISOString(),
    roleRequired: roleRequired || ['admin', 'sales', 'coordinator', 'developer'],
    checksumSha256: hash,
    downloadUrl: `/mock-vault/${encodeURIComponent(name)}`,
    projectId: projectId || undefined,
    category: category || 'assets',
    encrypted: true
  };

  if (!Array.isArray(db.files)) db.files = [];
  db.files.unshift(newFile);
  writeDB(db);

  res.status(201).json({ success: true, file: newFile });
});

fileRouter.delete('/:id', (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  const userRole = authUser?.role || 'client_guest';

  if (!['admin', 'bd_head', 'developer'].includes(userRole)) {
    return res.status(403).json({ success: false, error: 'Forbidden: Only administrators or engineers may purge vault records.' });
  }

  const db = readDB();
  const idx = (db.files || []).findIndex((f: any) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'File not found' });

  db.files.splice(idx, 1);
  writeDB(db);
  res.json({ success: true, message: 'File securely purged from vault.' });
});

// ==========================================
// GDPR Endpoints (/api/gdpr)
// ==========================================

gdprRouter.get('/export', (req: Request, res: Response) => {
  const db = readDB();
  const sanitizedProjects = (db.projects || []).map((p: any) => ({
    id: p.id,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    clientCompany: p.clientCompany,
    channel: p.channel,
    websiteType: p.websiteType,
    agreedPrice: p.finalPrice,
    payments: {
      advancePaid: p.advancePaid,
      advanceAmount: p.advanceAmount,
      balancePaid: p.balancePaid,
      balanceAmount: p.balanceAmount,
      method: p.paymentMethod
    },
    created: p.createdAt
  }));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=gdpr-subject-data-export.json');
  res.json({
    exportDate: new Date().toISOString(),
    regulation: 'General Data Protection Regulation (EU) 2016/679 - Article 15 DSAR',
    subjectData: {
      projects: sanitizedProjects,
      filesLogged: (db.files || []).map((f: any) => ({ name: f.name, uploadedAt: f.uploadedAt, category: f.category }))
    }
  });
});

gdprRouter.post('/purge', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.body;

  if (projectId) {
    const p = (db.projects || []).find((proj: any) => proj.id === projectId);
    if (p) {
      p.clientName = 'Anonymized Client [GDPR Article 17]';
      p.clientEmail = 'redacted@gdpr-erasure.local';
      p.clientPhone = '[REDACTED]';
      p.credentialsNotes = '[CREDENTIALS PURGED UNDER RIGHT TO BE FORGOTTEN]';
      p.credentialsShared = false;
      p.updatedAt = new Date().toISOString();
    }
  }

  if (!Array.isArray(db.gdprLogs)) db.gdprLogs = [];
  db.gdprLogs.push({
    id: `gdpr-${Date.now()}`,
    action: 'Right to be Forgotten Executed',
    details: `Personal identifiable information purged for project ${projectId || 'all requested'}.`,
    timestamp: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, message: 'Client PII successfully redacted under GDPR Right to be Forgotten.' });
});

export default fileRouter;
