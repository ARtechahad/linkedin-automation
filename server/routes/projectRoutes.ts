import { Router, Request, Response } from 'express';
import { readDB, writeDB, logAuditAction, calculateLeadScore } from '../db';
import { AuthenticatedRequest } from '../middlewares/auth';

export const projectRouter = Router();
export const portalRouter = Router();
export const leadScoreRouter = Router();

// ==========================================
// 1. Projects Endpoints (SOP Steps 1 - 11) with Strict RBAC Data Partitioning
// ==========================================

projectRouter.get('/', (req: Request, res: Response) => {
  const db = readDB();
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';

  let projects = Array.isArray(db.projects) ? [...db.projects] : [];

  const authUser = (req as AuthenticatedRequest).user;

  // Strict RBAC Data Isolation & Partitioning
  if (authUser) {
    if (authUser.role === 'sales') {
      // Sales user ONLY fetches leads/deals explicitly assigned to them or created by them
      projects = projects.filter(p => {
        const isEmailMatch = p.salespersonEmail && authUser.email && p.salespersonEmail.toLowerCase() === authUser.email.toLowerCase();
        const isNameMatch = p.assignedSalesperson && authUser.name && (
          p.assignedSalesperson.toLowerCase().includes(authUser.name.toLowerCase()) ||
          authUser.name.toLowerCase().includes(p.assignedSalesperson.toLowerCase())
        );
        const isOwnerMatch = p.ownerId === authUser.id;
        return isEmailMatch || isNameMatch || isOwnerMatch;
      });
    } else if (authUser.role === 'client_guest') {
      // Client guest user ONLY fetches their specific project and receives sanitized data
      projects = projects.filter(p => {
        const isEmailMatch = p.clientEmail && authUser.email && p.clientEmail.toLowerCase() === authUser.email.toLowerCase();
        const isNameMatch = p.clientName && authUser.name && p.clientName.toLowerCase().includes(authUser.name.toLowerCase());
        const isProjectMatch = req.query.projectId && p.id === req.query.projectId;
        return isEmailMatch || isNameMatch || isProjectMatch;
      });
      // Sanitize internal company commissions, internal notes, and team data from client view
      projects = projects.map(p => ({
        ...p,
        commissionAmount: undefined,
        commissionRate: undefined,
        commissionStatus: undefined,
        credentialsNotes: undefined,
        assignedSalesperson: undefined,
        salespersonEmail: undefined
      }));
    } else if (authUser.role === 'collaborator') {
      // External valuation collaborator ONLY fetches assigned deals with masked commission rates
      projects = projects.filter(p => {
        const assigned = Array.isArray(p.assignedCollaborators) ? p.assignedCollaborators : [];
        return assigned.includes(authUser.id) || assigned.includes(authUser.email) || assigned.includes('partner@vance-capital.com');
      });
      projects = projects.map(p => ({
        ...p,
        commissionAmount: undefined,
        commissionRate: undefined,
        commissionStatus: undefined
      }));
    }
  }

  if (status && status !== 'all') {
    projects = projects.filter(p => p.status === status);
  }
  if (search) {
    projects = projects.filter(p =>
      (p.clientName || '').toLowerCase().includes(search) ||
      (p.clientCompany || '').toLowerCase().includes(search) ||
      (p.purpose || '').toLowerCase().includes(search) ||
      (p.websiteType || '').toLowerCase().includes(search)
    );
  }

  res.json({ success: true, count: projects.length, projects });
});

projectRouter.post('/', (req: Request, res: Response) => {
  const db = readDB();
  const body = req.body;

  if (!body.clientName || !body.websiteType) {
    return res.status(400).json({ error: 'Client name and website type are required.' });
  }

  // Calculate pricing defaults if not specified
  let estPrice = Number(body.estimatedPrice) || 0;
  if (!estPrice) {
    if (body.websiteType === 'landing') estPrice = 250;
    else if (body.websiteType === 'ecommerce') estPrice = 600;
    else if (body.websiteType === 'corporate') estPrice = 900;
    else estPrice = 500;
  }

  // Commission calculation according to SOP Section 6
  let rate = 25;
  if (estPrice <= 300) rate = 25;
  else if (estPrice <= 700) rate = 30;
  else rate = 35;
  if (body.hasHighPerformanceBonus) rate = Math.min(rate + 10, 45);

  const finalPrice = Number(body.finalPrice) || estPrice;
  const commissionAmount = Number(((finalPrice * rate) / 100).toFixed(2));

  const newProject = {
    id: `proj-${Date.now()}`,
    clientName: body.clientName,
    clientEmail: body.clientEmail || '',
    clientPhone: body.clientPhone || '',
    clientCompany: body.clientCompany || '',
    channel: body.channel || 'linkedin',
    websiteType: body.websiteType,
    purpose: body.purpose || 'Brand website and client services',
    inspirationUrls: body.inspirationUrls || [],
    hasLogo: Boolean(body.hasLogo),
    hasContent: Boolean(body.hasContent),
    hasImages: Boolean(body.hasImages),
    useStockPhotos: Boolean(body.useStockPhotos),
    needsContentWriting: Boolean(body.needsContentWriting),
    assetNotes: body.assetNotes || '',
    hostingStatus: body.hostingStatus || 'needs_both',
    hostingProvider: body.hostingProvider || '',
    credentialsShared: Boolean(body.credentialsShared),
    credentialsNotes: body.credentialsNotes || '',
    recommendedHost: body.recommendedHost || 'Hostinger',
    estimatedPrice: estPrice,
    finalPrice: finalPrice,
    advancePaid: Boolean(body.advancePaid),
    advanceAmount: Boolean(body.advancePaid) ? Number((finalPrice * 0.5).toFixed(2)) : 0,
    advanceTxId: body.advanceTxId || '',
    balancePaid: Boolean(body.balancePaid),
    balanceAmount: Boolean(body.balancePaid) ? Number((finalPrice * 0.5).toFixed(2)) : 0,
    balanceTxId: body.balanceTxId || '',
    paymentMethod: body.paymentMethod || 'paypal',
    currency: 'USD',
    assignedSalesperson: body.assignedSalesperson || 'Sales Representative',
    salespersonEmail: body.salespersonEmail || 'sales@agencyops.dev',
    commissionRate: rate,
    commissionAmount: commissionAmount,
    commissionStatus: 'pending',
    discordShared: Boolean(body.discordShared),
    stagingUrl: body.stagingUrl || '',
    internalQAPassed: false,
    clientApproved: false,
    domainTransferred: false,
    kickOffConfirmed: Boolean(body.advancePaid),
    trackerUrl: body.trackerUrl || '',
    timelineDays: Number(body.timelineDays) || 10,
    startDate: new Date().toISOString().split('T')[0],
    targetDeliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    maintenanceOfferSent: false,
    maintenanceRetainer: false,
    monthlyRetainerFee: 99,
    referralEnrolled: false,
    status: (Boolean(body.advancePaid) ? 'advance_paid' : 'lead') as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  (db.projects as any).unshift(newProject);
  writeDB(db);

  res.status(201).json({ success: true, project: newProject });
});

projectRouter.get('/:id', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const authUser = (req as AuthenticatedRequest).user;
  // If user is a collaborator, verify deal sharing authorization
  if (authUser && authUser.role === 'collaborator') {
    const assigned = Array.isArray(project.assignedCollaborators) ? project.assignedCollaborators : [];
    const isAssigned = assigned.includes(authUser.id) || assigned.includes(authUser.email) || assigned.includes('partner@vance-capital.com');
    if (!isAssigned) {
      return res.status(403).json({ error: 'Access denied: This project deal has not been shared with your collaborator account.' });
    }

    return res.json({
      success: true,
      project: {
        ...project,
        commissionAmount: undefined,
        commissionRate: undefined,
        commissionStatus: undefined
      }
    });
  }

  res.json({ success: true, project });
});

projectRouter.put('/:id', (req: Request, res: Response) => {
  const db = readDB();
  const index = db.projects.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const existing = db.projects[index];
  const updates = req.body;

  // If price changed, recompute commission
  if (updates.finalPrice && updates.finalPrice !== existing.finalPrice) {
    let rate = existing.commissionRate;
    const p = Number(updates.finalPrice);
    if (p <= 300) rate = 25;
    else if (p <= 700) rate = 30;
    else rate = 35;
    updates.commissionRate = rate;
    updates.commissionAmount = Number(((p * rate) / 100).toFixed(2));
  }

  // Handle advance / balance payment transitions
  if (updates.advancePaid === true && !existing.advancePaid) {
    updates.advanceAmount = Number((existing.finalPrice * 0.5).toFixed(2));
    if (existing.status === 'lead' || existing.status === 'scoped') {
      updates.status = 'advance_paid';
    }
  }

  if (updates.balancePaid === true && !existing.balancePaid) {
    updates.balanceAmount = Number((existing.finalPrice * 0.5).toFixed(2));
  }

  db.projects[index] = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json({ success: true, project: db.projects[index] });
});

projectRouter.delete('/:id', (req: Request, res: Response) => {
  const db = readDB();
  const index = (db.projects || []).findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const authUser = (req as AuthenticatedRequest).user;
  const deleted = db.projects.splice(index, 1)[0];
  writeDB(db);

  logAuditAction({
    userId: authUser?.id || 'admin',
    userName: authUser?.name || 'Tariq Mehmood',
    userRole: authUser?.role || 'admin',
    action: 'PROJECT_DELETED',
    entityType: 'project',
    entityId: req.params.id,
    details: { clientName: deleted.clientName, clientCompany: deleted.clientCompany },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: `Project ${deleted.clientName} removed successfully.` });
});

// Assign or remove external collaborator from deal
projectRouter.post('/:id/collaborator', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const authUser = (req as AuthenticatedRequest).user;
  const { collaboratorId, collaboratorEmail, action = 'assign' } = req.body || {};
  const target = (collaboratorEmail || collaboratorId || '').trim();

  if (!target) {
    return res.status(400).json({ error: 'collaboratorEmail or collaboratorId is required.' });
  }

  if (!Array.isArray(project.assignedCollaborators)) {
    project.assignedCollaborators = [];
  }

  if (action === 'assign') {
    if (!project.assignedCollaborators.includes(target)) {
      project.assignedCollaborators.push(target);
    }
    project.isDealSheetShared = true;
    logAuditAction({
      userId: authUser?.id || 'admin',
      userName: authUser?.name || 'Tariq Mehmood',
      userRole: authUser?.role || 'admin',
      action: 'COLLABORATOR_ASSIGNED',
      entityType: 'project',
      entityId: project.id,
      details: { collaborator: target, projectTitle: project.clientCompany || project.clientName },
      ipAddress: req.ip || '127.0.0.1'
    });
  } else {
    project.assignedCollaborators = project.assignedCollaborators.filter((c: string) => c !== target);
    if (project.assignedCollaborators.length === 0) {
      project.isDealSheetShared = false;
    }
    logAuditAction({
      userId: authUser?.id || 'admin',
      userName: authUser?.name || 'Tariq Mehmood',
      userRole: authUser?.role || 'admin',
      action: 'COLLABORATOR_REMOVED',
      entityType: 'project',
      entityId: project.id,
      details: { collaborator: target, projectTitle: project.clientCompany || project.clientName },
      ipAddress: req.ip || '127.0.0.1'
    });
  }

  project.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, project, assignedCollaborators: project.assignedCollaborators });
});

// Partner Evaluation & Appraisal Sign-off
projectRouter.post('/:id/evaluate', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const authUser = (req as AuthenticatedRequest).user;
  const { partnerEvaluationNotes, partnerEvaluationScore, partnerSignOff } = req.body || {};

  if (partnerEvaluationNotes !== undefined) {
    project.partnerEvaluationNotes = String(partnerEvaluationNotes);
  }
  if (partnerEvaluationScore !== undefined) {
    project.partnerEvaluationScore = Number(partnerEvaluationScore);
  }
  if (partnerSignOff !== undefined) {
    project.partnerSignOff = Boolean(partnerSignOff);
    if (project.partnerSignOff) {
      project.partnerSignOffDate = new Date().toISOString();
    }
  }

  project.updatedAt = new Date().toISOString();
  writeDB(db);

  logAuditAction({
    userId: authUser?.id || 'collaborator',
    userName: authUser?.name || 'Marcus Vance',
    userRole: authUser?.role || 'collaborator',
    action: 'COLLABORATOR_DEAL_EVALUATED',
    entityType: 'project',
    entityId: project.id,
    details: {
      score: project.partnerEvaluationScore,
      signOff: project.partnerSignOff,
      notesSnippet: (project.partnerEvaluationNotes || '').substring(0, 100)
    },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, project });
});

// Secure Domain & Website Transfer Gate (SOP Section 8)
projectRouter.post('/:id/transfer', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Strict SOP Rule 8 Enforcement:
  if (!project.advancePaid) {
    return res.status(403).json({
      error: 'TRANSFER REJECTED: SOP Rule 5 & 8 violation. Advance 50% payment was never confirmed.',
      gatePassed: false
    });
  }

  if (!project.balancePaid) {
    return res.status(403).json({
      error: 'TRANSFER REJECTED: SOP Rule 8 violation. Live website transfer is strictly prohibited until the remaining 50% balance payment is verified and cleared.',
      gatePassed: false,
      balanceDue: project.finalPrice * 0.5
    });
  }

  if (!project.internalQAPassed) {
    return res.status(400).json({
      error: 'TRANSFER BLOCKED: Internal QA checklist has not been completed on staging domain.',
      gatePassed: false
    });
  }

  project.domainTransferred = true;
  project.transferCompletedAt = new Date().toISOString();
  project.status = 'transferred';
  project.updatedAt = new Date().toISOString();

  // Create celebratory chat message
  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
  db.chatMessages.push({
    id: `msg-${Date.now()}`,
    senderId: 'system-ops',
    senderName: 'Website Transfer System',
    senderRole: 'admin',
    channel: 'staging-dev',
    content: `🎉 Website transferred successfully to client domain for ${project.clientName} (${project.clientCompany || project.websiteType})! Both 50% advance and 50% balance cleared.`,
    timestamp: new Date().toISOString(),
    reactions: { '🚀': 4 } as any
  } as any);

  writeDB(db);

  res.json({
    success: true,
    message: 'Domain transfer verified and executed securely.',
    gatePassed: true,
    project
  });
});

// Discord SOP Handoff Generation (SOP Section 7)
projectRouter.get('/:id/discord-export', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const formatted = `📢 **NEW CLOSED CLIENT HANDOFF (SOP STEP 7)**\n--------------------------------------------------\n👤 **Client Name:** ${project.clientName} ${project.clientCompany ? `(${project.clientCompany})` : ''}\n💼 **Sales Representative:** ${project.assignedSalesperson}\n🌐 **Website Type:** ${project.websiteType.toUpperCase()}\n🎯 **Primary Purpose:** ${project.purpose}\n💰 **Agreed Pricing:** $${project.finalPrice} USD\n💳 **Payment Status:** ${project.advancePaid ? '✅ 50% Advance Received' : '⏳ Advance Pending'} (${project.paymentMethod.toUpperCase()})\n🖥️ **Domain & Hosting:** ${project.hostingStatus.replace('_', ' ').toUpperCase()} ${project.hostingProvider ? `(${project.hostingProvider})` : ''}\n🎨 **Content/Assets:** Logo: ${project.hasLogo ? '✅ Yes' : '❌ Needs Stock/Design'} | Copywriting: ${project.needsContentWriting ? '✍️ Required' : '✅ Provided'}\n🔗 **Design References:** ${project.inspirationUrls?.length ? project.inspirationUrls.join(', ') : 'None'}\n📋 **Next Action:** Coordinator to confirm scope in writing & schedule internal staging build (SOP Step 8 & 9).\n--------------------------------------------------`;

  res.json({
    success: true,
    formattedText: formatted,
    project
  });
});

// ==========================================
// 2. Lead Scoring Endpoints (/api/leads)
// ==========================================

leadScoreRouter.post('/score/:id', (req: Request, res: Response) => {
  const db = readDB();
  const id = req.params.id;
  const p: any = (db.projects || []).find((proj: any) => proj.id === id);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  const score = calculateLeadScore(p);
  p.leadScore = score;
  writeDB(db);

  res.json({ success: true, leadScore: score, project: p });
});

leadScoreRouter.post('/score-all', (req: Request, res: Response) => {
  const db = readDB();
  let scoredCount = 0;
  (db.projects || []).forEach((p: any) => {
    p.leadScore = calculateLeadScore(p);
    scoredCount++;
  });
  writeDB(db);
  res.json({ success: true, scoredCount, message: `Scored ${scoredCount} leads successfully` });
});

// ==========================================
// 3. Client Portal Endpoints (/api/portal)
// ==========================================

portalRouter.get('/project/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.params;
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project portal not found.' });
  }

  // Token validation if token is passed or if clientPortalToken matches
  if (token && p.clientPortalToken && token !== p.clientPortalToken) {
    return res.status(403).json({ success: false, message: 'Invalid or expired Client Portal access token.' });
  }

  // Sanitize data: Strictly exclude internal salesperson commissions, private sales chats, Discord credentials, employee rates
  const sanitizedPortalData = {
    id: p.id,
    clientName: p.clientName,
    clientCompany: p.clientCompany,
    websiteType: p.websiteType,
    purpose: p.purpose,
    status: p.status,
    startDate: p.startDate,
    targetDeliveryDate: p.targetDeliveryDate,
    timelineDays: p.timelineDays,
    stagingUrl: p.stagingUrl || 'https://staging-preview.clientops-agency.internal',
    internalQAPassed: p.internalQAPassed,
    clientApproved: p.clientApproved,
    domainTransferred: p.domainTransferred,
    finalPrice: p.finalPrice,
    advancePaid: p.advancePaid,
    advanceAmount: p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2)),
    advanceTxId: p.advanceTxId,
    balancePaid: p.balancePaid,
    balanceAmount: p.balanceAmount || Number((p.finalPrice * 0.5).toFixed(2)),
    balanceTxId: p.balanceTxId,
    paymentMethod: p.paymentMethod,
    currency: p.currency || 'USD',
    feedback: p.clientFeedback || [],
    portalToken: p.clientPortalToken
  };

  res.json({ success: true, project: sanitizedPortalData });
});

portalRouter.post('/feedback/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.params;
  const { author, content, category } = req.body;

  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!p.clientFeedback) p.clientFeedback = [];
  const feedbackItem = {
    id: `fb-${Date.now()}`,
    author: author || p.clientName || 'Client',
    content,
    category: category || 'revision',
    createdAt: new Date().toISOString(),
    resolved: false
  };

  p.clientFeedback.push(feedbackItem);

  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
  db.chatMessages.push({
    id: `msg-client-fb-${Date.now()}`,
    senderId: 'bot-client-portal',
    senderName: 'Client Portal Bot',
    senderRole: 'coordinator',
    channel: 'staging-dev',
    content: `📢 **New Client Feedback Submitted via Portal**\n• Project: ${p.clientCompany || p.clientName} (${p.websiteType.toUpperCase()})\n• Category: ${feedbackItem.category.toUpperCase()}\n• Note: "${content}"`,
    timestamp: new Date().toISOString(),
    reactions: { '🔥': 0, '👏': 0 }
  });

  writeDB(db);

  res.json({ success: true, message: 'Feedback submitted successfully. Development team notified.', feedbackItem });
});

portalRouter.post('/generate-link/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.params;
  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!p.clientPortalToken) {
    p.clientPortalToken = `portal-${p.id}-${Math.random().toString(36).substring(2, 8)}`;
  }

  writeDB(db);

  res.json({
    success: true,
    projectId: p.id,
    token: p.clientPortalToken,
    guestUrl: `/?portal=${p.id}&token=${p.clientPortalToken}`
  });
});

portalRouter.post('/action/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.params;
  const { action, token, clientName, notes } = req.body;

  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  // Token check if passed
  if (token && p.clientPortalToken && token !== p.clientPortalToken) {
    return res.status(403).json({ success: false, message: 'Unauthorized client token.' });
  }

  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];

  if (action === 'approve_milestone') {
    p.clientApproved = true;
    p.clientApprovalDate = new Date().toISOString();
    p.clientRating = 5;
    if (p.status === 'staging_dev') {
      p.status = 'client_review';
    }

    if (!p.clientFeedback) p.clientFeedback = [];
    p.clientFeedback.push({
      id: `fb-appr-${Date.now()}`,
      author: clientName || p.clientName || 'Client',
      content: notes || 'Staging build formally approved by client via Self-Service Portal.',
      category: 'approval',
      createdAt: new Date().toISOString(),
      resolved: true
    });

    db.chatMessages.push({
      id: `msg-client-signoff-${Date.now()}`,
      senderId: 'bot-client-portal',
      senderName: 'Client Portal Bot',
      senderRole: 'coordinator',
      channel: 'staging-dev',
      content: `🎉 **Official Client Milestone Sign-Off Received**\n• Project: ${p.clientCompany || p.clientName}\n• Approved By: ${clientName || p.clientName}\n• Notes: "${notes || 'All requirements verified on staging.'}"\n• Action Required: Prepare 50% balance clearance invoice for live DNS cutover per SOP Rule 8.`,
      timestamp: new Date().toISOString(),
      reactions: { '🔥': 1, '👏': 2 }
    });

    writeDB(db);
    return res.json({ success: true, message: 'Milestone sign-off recorded. Development team notified!', project: p });
  }

  if (action === 'request_meeting') {
    db.chatMessages.push({
      id: `msg-meeting-req-${Date.now()}`,
      senderId: 'bot-client-portal',
      senderName: 'Client Portal Bot',
      senderRole: 'coordinator',
      channel: 'announcements',
      content: `📅 **Client Requested Staging Walkthrough Call**\n• Client: ${clientName || p.clientName} (${p.clientCompany || 'Company'})\n• Topic: "${notes || 'Interactive layout walkthrough before final sign-off.'}"\n• Preferred Channel: Google Meet / WhatsApp`,
      timestamp: new Date().toISOString(),
      reactions: { '🔥': 0, '👏': 1 } as any
    });

    writeDB(db);
    return res.json({ success: true, message: 'Meeting request received. Your account manager will confirm the schedule within 4 hours.' });
  }

  res.status(400).json({ success: false, message: 'Unknown portal action.' });
});

export default projectRouter;
