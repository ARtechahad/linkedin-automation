import { Router, Request, Response } from 'express';
import { readDB, writeDB } from '../db';

export const dripRouter = Router();
export const nudgeRouter = Router();

// ==========================================
// 1. Smart Follow-Up Scheduler & Drip Campaign Engine (/api/drip)
// ==========================================

dripRouter.get('/campaigns', (req: Request, res: Response) => {
  const db = readDB();
  const pendingAdvanceProjects = (db.projects as any[]).filter(p => !p.advancePaid && (p.status === 'lead' || p.status === 'scoped'));

  const campaigns = pendingAdvanceProjects.map((p: any) => {
    const createdDate = new Date(p.createdAt || Date.now());
    const daysSinceInquiry = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    let suggestedStage = 1;
    if (daysSinceInquiry >= 7) suggestedStage = 4;
    else if (daysSinceInquiry >= 5) suggestedStage = 3;
    else if (daysSinceInquiry >= 3) suggestedStage = 2;
    else suggestedStage = 1;

    const currentStage = p.dripCampaign?.currentStage || suggestedStage;

    return {
      projectId: p.id,
      clientName: p.clientName,
      clientEmail: p.clientEmail,
      clientCompany: p.clientCompany,
      websiteType: p.websiteType,
      finalPrice: p.finalPrice,
      advanceAmount: p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2)),
      paymentMethod: p.paymentMethod,
      daysPendingAdvance: daysSinceInquiry,
      currentStage,
      dripEnabled: p.dripCampaign?.enabled !== false,
      status: p.dripCampaign?.status || 'active',
      history: p.dripCampaign?.history || []
    };
  });

  res.json({
    success: true,
    totalPending: campaigns.length,
    campaigns,
    templates: db.dripTemplates || []
  });
});

dripRouter.get('/templates', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, templates: db.dripTemplates || [] });
});

dripRouter.post('/trigger', (req: Request, res: Response) => {
  const db = readDB();
  const pendingProjects = (db.projects as any[]).filter(p => !p.advancePaid && (p.status === 'lead' || p.status === 'scoped') && p.dripCampaign?.enabled !== false);
  
  let executedCount = 0;
  const executionLogs: any[] = [];
  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];

  pendingProjects.forEach((p: any) => {
    const currentStage = p.dripCampaign?.currentStage || 1;
    const template = (db.dripTemplates || []).find((t: any) => t.stage === currentStage) || db.dripTemplates[0];

    const advanceAmount = p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2));
    const formattedBody = template.bodyTemplate
      .replace(/{{clientName}}/g, p.clientName)
      .replace(/{{clientCompany}}/g, p.clientCompany || 'your business')
      .replace(/{{websiteType}}/g, p.websiteType)
      .replace(/{{advanceAmount}}/g, String(advanceAmount));
    const formattedSubject = template.subject
      .replace(/{{clientName}}/g, p.clientName)
      .replace(/{{clientCompany}}/g, p.clientCompany || 'your business');

    const historyEntry = {
      id: `drip-entry-${Date.now()}-${p.id}`,
      stage: currentStage,
      sentAt: new Date().toISOString(),
      subject: formattedSubject,
      message: formattedBody,
      channel: p.channel === 'upwork' ? 'Upwork Messages' : p.channel === 'linkedin' ? 'LinkedIn InMail' : 'Email (Direct)',
      triggeredBy: 'automated_scheduler' as const,
      status: 'sent' as const
    };

    if (!p.dripCampaign) {
      p.dripCampaign = {
        enabled: true,
        currentStage: 1,
        daysOverdue: 1,
        status: 'active',
        history: []
      };
    }

    p.dripCampaign.history.unshift(historyEntry);
    p.dripCampaign.lastSentAt = new Date().toISOString();
    
    // Advance stage for next cycle if not completed
    if (p.dripCampaign.currentStage < 4) {
      p.dripCampaign.currentStage += 1;
    } else {
      p.dripCampaign.status = 'completed';
    }

    // Post notification to Sales channel
    db.chatMessages.push({
      id: `msg-drip-cron-${Date.now()}-${p.id}`,
      senderId: 'bot-drip-scheduler',
      senderName: 'Smart Drip Automation',
      senderRole: 'sales',
      channel: 'sales-leads',
      content: `📨 **Automated 50% Advance Follow-Up Dispatched**\n• Client: ${p.clientName} (${p.clientCompany || 'Lead'})\n• Drip: Stage ${currentStage} (${template.label})\n• 50% Advance Pending: $${advanceAmount} USD\n• Next Scheduled Check: ${p.dripCampaign.currentStage <= 4 ? `Stage ${p.dripCampaign.currentStage} in 48h` : 'Sequence Finished'}`,
      timestamp: new Date().toISOString(),
      reactions: { '🔥': 0, '👏': 0 }
    });

    executedCount++;
    executionLogs.push({
      projectId: p.id,
      clientName: p.clientName,
      stageDispatched: currentStage,
      subject: formattedSubject
    });
  });

  writeDB(db);

  res.json({
    success: true,
    executedCount,
    executionLogs,
    message: executedCount > 0 
      ? `Executed automated follow-up sequence for ${executedCount} client(s) with pending 50% advance payment.`
      : 'All pending advance payment campaigns are currently up to date.'
  });
});

dripRouter.post('/send-now/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const p: any = (db.projects || []).find((proj: any) => proj.id === req.params.projectId);

  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const currentStage = p.dripCampaign?.currentStage || 1;
  const template = (db.dripTemplates || []).find((t: any) => t.stage === currentStage) || db.dripTemplates[0];

  const advanceAmount = p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2));
  const formattedBody = template.bodyTemplate
    .replace(/{{clientName}}/g, p.clientName)
    .replace(/{{clientCompany}}/g, p.clientCompany || 'your business')
    .replace(/{{websiteType}}/g, p.websiteType)
    .replace(/{{advanceAmount}}/g, String(advanceAmount));
  const formattedSubject = template.subject
    .replace(/{{clientName}}/g, p.clientName)
    .replace(/{{clientCompany}}/g, p.clientCompany || 'your business');

  if (!p.dripCampaign) {
    p.dripCampaign = {
      enabled: true,
      currentStage: 1,
      daysOverdue: 1,
      status: 'active',
      history: []
    };
  }

  const historyEntry = {
    id: `drip-manual-${Date.now()}`,
    stage: currentStage,
    sentAt: new Date().toISOString(),
    subject: formattedSubject,
    message: formattedBody,
    channel: p.channel === 'upwork' ? 'Upwork Messages' : p.channel === 'linkedin' ? 'LinkedIn InMail' : 'Email (Direct)',
    triggeredBy: 'manual_override' as const,
    status: 'sent' as const
  };

  p.dripCampaign.history.unshift(historyEntry);
  p.dripCampaign.lastSentAt = new Date().toISOString();
  if (p.dripCampaign.currentStage < 4) {
    p.dripCampaign.currentStage += 1;
  }

  if (!Array.isArray(db.chatMessages)) db.chatMessages = [];
  db.chatMessages.push({
    id: `msg-drip-manual-${Date.now()}`,
    senderId: 'user-sales-1',
    senderName: 'Tariq Mehmood',
    senderRole: 'sales',
    channel: 'sales-leads',
    content: `📬 **Manual Drip Follow-up Dispatched (Stage ${currentStage})** to ${p.clientName} for $${advanceAmount} advance payment.\nSubject: "${formattedSubject}"`,
    timestamp: new Date().toISOString(),
    reactions: { '🔥': 0, '👏': 0 }
  });

  writeDB(db);

  res.json({
    success: true,
    message: `Follow-up email (Stage ${currentStage}) successfully dispatched to ${p.clientName}.`,
    historyEntry,
    nextStage: p.dripCampaign.currentStage
  });
});

dripRouter.put('/toggle/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const p: any = (db.projects || []).find((proj: any) => proj.id === req.params.projectId);

  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!p.dripCampaign) {
    p.dripCampaign = {
      enabled: true,
      currentStage: 1,
      daysOverdue: 0,
      status: 'active',
      history: []
    };
  }

  p.dripCampaign.enabled = !p.dripCampaign.enabled;
  p.dripCampaign.status = p.dripCampaign.enabled ? 'active' : 'paused';

  writeDB(db);

  res.json({
    success: true,
    enabled: p.dripCampaign.enabled,
    status: p.dripCampaign.status,
    message: `Drip campaign automation ${p.dripCampaign.enabled ? 'resumed' : 'paused'} for ${p.clientName}.`
  });
});

// ==========================================
// 2. Automated Nudges Engine (/api/nudges)
// ==========================================

nudgeRouter.get('/templates', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, templates: db.nudgeTemplates || [] });
});

nudgeRouter.get('/pending', (req: Request, res: Response) => {
  const db = readDB();
  const pendingNudges: any[] = [];

  (db.projects || []).forEach((p: any) => {
    // 1. Advance delayed
    if (!p.advancePaid && (p.status === 'lead' || p.status === 'scoped')) {
      pendingNudges.push({
        projectId: p.id,
        clientName: p.clientName,
        clientCompany: p.clientCompany || `${p.clientName} Brand`,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone || '+1 555 019 2834',
        triggerType: 'advance_deposit_delayed',
        amountDue: p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2)),
        daysPending: 3,
        suggestedChannel: 'whatsapp',
        urgency: 'high'
      });
    }

    // 2. Staging review pending sign-off
    if (p.advancePaid && (p.status === 'staging_dev' || p.status === 'client_review') && !p.clientApproved) {
      pendingNudges.push({
        projectId: p.id,
        clientName: p.clientName,
        clientCompany: p.clientCompany || `${p.clientName} Brand`,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone || '+44 20 7946 0991',
        triggerType: 'staging_review_pending',
        stagingUrl: p.stagingUrl || 'https://staging.agency-ops.internal',
        daysPending: 2,
        suggestedChannel: 'email',
        urgency: 'medium'
      });
    }

    // 3. Balance due upon approved staging
    if (p.clientApproved && !p.balancePaid) {
      pendingNudges.push({
        projectId: p.id,
        clientName: p.clientName,
        clientCompany: p.clientCompany || `${p.clientName} Brand`,
        clientEmail: p.clientEmail,
        clientPhone: p.clientPhone || '+1 202 555 0173',
        triggerType: 'balance_due_handover',
        amountDue: p.balanceAmount || Number((p.finalPrice * 0.5).toFixed(2)),
        daysPending: 1,
        suggestedChannel: 'whatsapp',
        urgency: 'high'
      });
    }
  });

  res.json({ success: true, count: pendingNudges.length, pendingNudges });
});

nudgeRouter.post('/dispatch', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId, triggerType, channel, dispatchedBy } = req.body;

  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const template: any = (db.nudgeTemplates || []).find((t: any) => t.triggerType === triggerType) || db.nudgeTemplates[0];

  const advanceAmt = p.advanceAmount || Number((p.finalPrice * 0.5).toFixed(2));
  const balanceAmt = p.balanceAmount || Number((p.finalPrice * 0.5).toFixed(2));
  const repName = p.assignedSalesperson || 'Client Operations Team';
  const company = p.clientCompany || p.clientName;
  const portalLink = `https://agencyops.dev/?portal=${p.id}&token=${p.clientPortalToken}`;
  const stagingUrl = p.stagingUrl || 'https://staging.agency-ops.internal';
  const invoiceNumber = `INV-2026-${p.id.replace('proj-', '00')}`;

  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{{clientName}}/g, p.clientName)
      .replace(/{{clientCompany}}/g, company)
      .replace(/{{advanceAmount}}/g, String(advanceAmt))
      .replace(/{{balanceAmount}}/g, String(balanceAmt))
      .replace(/{{salespersonName}}/g, repName)
      .replace(/{{portalLink}}/g, portalLink)
      .replace(/{{stagingUrl}}/g, stagingUrl)
      .replace(/{{invoiceLink}}/g, portalLink)
      .replace(/{{invoiceNumber}}/g, invoiceNumber);
  };

  const formattedEmailSubject = replacePlaceholders(template.emailSubject);
  const formattedEmailBody = replacePlaceholders(template.emailBody);
  const formattedWhatsapp = replacePlaceholders(template.whatsappMessage);
  const formattedDiscord = replacePlaceholders(template.discordMessage);

  const phone = (p.clientPhone || '').replace(/[^0-9]/g, '');
  const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(formattedWhatsapp)}` : `https://wa.me/?text=${encodeURIComponent(formattedWhatsapp)}`;
  const mailtoLink = `mailto:${p.clientEmail}?subject=${encodeURIComponent(formattedEmailSubject)}&body=${encodeURIComponent(formattedEmailBody)}`;

  const logEntry = {
    id: `nudge-log-${Date.now()}`,
    projectId: p.id,
    clientName: p.clientName,
    clientPhone: p.clientPhone,
    clientEmail: p.clientEmail,
    triggerType,
    channel: channel || 'whatsapp',
    dispatchedAt: new Date().toISOString(),
    contentSnippet: formattedWhatsapp.substring(0, 100) + '...',
    dispatchedBy: dispatchedBy || repName,
    deliveryStatus: channel === 'whatsapp' ? 'opened_in_whatsapp' : 'delivered'
  };

  if (!db.nudgeLogs) db.nudgeLogs = [];
  db.nudgeLogs.unshift(logEntry);
  writeDB(db);

  res.json({
    success: true,
    message: `Nudge prepared and logged for ${p.clientName}`,
    logEntry,
    formatted: {
      emailSubject: formattedEmailSubject,
      emailBody: formattedEmailBody,
      whatsappMessage: formattedWhatsapp,
      discordMessage: formattedDiscord,
      waLink,
      mailtoLink
    }
  });
});

nudgeRouter.get('/logs', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, logs: db.nudgeLogs || [] });
});

export default dripRouter;
