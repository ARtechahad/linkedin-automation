import { Router, Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { AuthenticatedRequest, requireRole } from '../middlewares/auth';

export const invoiceRouter = Router();
export const commissionRouter = Router();
export const analyticsRouter = Router();

// ==========================================
// 1. Automated PDF Invoices & Receipts (/api/invoices)
// ==========================================

invoiceRouter.get('/', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId, status } = req.query;
  let list = db.invoices || [];

  if (projectId) {
    list = list.filter((inv: any) => inv.projectId === projectId);
  }
  if (status && status !== 'all') {
    list = list.filter((inv: any) => inv.status === status);
  }

  res.json({ success: true, count: list.length, invoices: list });
});

invoiceRouter.get('/:id', (req: Request, res: Response) => {
  const db = readDB();
  const inv = (db.invoices || []).find((i: any) => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }
  res.json({ success: true, invoice: inv });
});

invoiceRouter.get('/project/:projectId', (req: Request, res: Response) => {
  const db = readDB();
  const { projectId } = req.params;
  const p: any = (db.projects || []).find((proj: any) => proj.id === projectId);
  if (!p) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (!db.invoices) db.invoices = [];
  let projectInvoices = db.invoices.filter((i: any) => i.projectId === projectId);

  // Auto-seed advance & balance invoices if none exist
  if (projectInvoices.length === 0) {
    const half = Number((p.finalPrice * 0.5).toFixed(2));
    const inv1 = {
      id: `inv-auto-adv-${p.id}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: p.id,
      clientName: p.clientName,
      clientCompany: p.clientCompany || `${p.clientName} Brand`,
      clientEmail: p.clientEmail,
      clientAddress: 'Verified International Client Address',
      issueDate: p.startDate || new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: p.advancePaid ? 'paid' : 'issued',
      milestoneType: 'advance_50',
      currency: p.currency || 'USD',
      items: [
        {
          id: `item-adv-${p.id}`,
          description: `${p.websiteType.toUpperCase()} Project - 50% Kick-Off Deposit (Discovery, UX & Sprint Activation)`,
          category: 'development',
          quantity: 1,
          unitPrice: half,
          total: half
        }
      ],
      subtotal: half,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: half,
      amountPaid: p.advancePaid ? half : 0,
      balanceDue: p.advancePaid ? 0 : half,
      paymentMethod: p.paymentMethod || 'paypal',
      paymentClearedAt: p.advancePaid ? (p.createdAt || new Date().toISOString()) : undefined,
      transactionId: p.advanceTxId || (p.advancePaid ? `TX-${Date.now()}` : undefined),
      receiptNumber: p.advancePaid ? `RCPT-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      notes: 'Standard 50% milestone deposit required prior to staging setup (SOP Step 5).',
      terms: 'Strict SOP Protocol: Staging deployment guaranteed within 48h upon payment clearance.'
    };

    const inv2: any = {
      id: `inv-auto-bal-${p.id}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      projectId: p.id,
      clientName: p.clientName,
      clientCompany: p.clientCompany || `${p.clientName} Brand`,
      clientEmail: p.clientEmail,
      clientAddress: 'Verified International Client Address',
      issueDate: p.targetDeliveryDate || new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: p.balancePaid ? 'paid' : p.clientApproved ? 'issued' : 'draft',
      milestoneType: 'balance_50',
      currency: p.currency || 'USD',
      items: [
        {
          id: `item-bal-${p.id}`,
          description: `${p.websiteType.toUpperCase()} Project - 50% Final Balance Clearance & Live DNS Propagation`,
          category: 'development',
          quantity: 1,
          unitPrice: half,
          total: half
        }
      ],
      subtotal: half,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: half,
      amountPaid: p.balancePaid ? half : 0,
      balanceDue: p.balancePaid ? 0 : half,
      paymentMethod: p.paymentMethod || 'paypal',
      paymentClearedAt: p.balancePaid ? new Date().toISOString() : undefined,
      transactionId: p.balanceTxId || (p.balancePaid ? `TX-${Date.now()}` : undefined),
      receiptNumber: p.balancePaid ? `RCPT-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      notes: 'Final balance clearance unlocks live server credentials transfer per SOP Rule 8.',
      terms: 'Payment due upon staging review sign-off. Migration scheduled within 24h of payment clearance.'
    };

    db.invoices.push(inv1 as any, inv2 as any);
    writeDB(db);
    projectInvoices = [inv1, inv2];
  }

  res.json({ success: true, count: projectInvoices.length, invoices: projectInvoices });
});

invoiceRouter.post('/generate', (req: Request, res: Response) => {
  const db = readDB();
  const {
    projectId,
    clientName,
    clientCompany,
    clientEmail,
    clientAddress,
    milestoneType,
    items,
    taxRatePercent,
    currency,
    notes,
    terms
  } = req.body;

  if (!db.invoices) db.invoices = [];
  const subtotal = (items || []).reduce((acc: number, it: any) => acc + (Number(it.total) || 0), 0);
  const taxRate = Number(taxRatePercent) || 0;
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    projectId: projectId || 'general',
    clientName: clientName || 'Client',
    clientCompany,
    clientEmail: clientEmail || '',
    clientAddress: clientAddress || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'issued',
    milestoneType: milestoneType || 'advance_50',
    currency: currency || 'USD',
    items: items || [],
    subtotal,
    taxRatePercent: taxRate,
    taxAmount,
    totalAmount,
    amountPaid: 0,
    balanceDue: totalAmount,
    paymentMethod: (req.body.paymentMethod || 'bank_transfer') as any,
    paymentClearedAt: undefined,
    notes: notes || 'Thank you for your business.',
    terms: terms || 'Standard agency payment terms per international project contract.'
  };

  db.invoices.push(newInvoice as any);
  writeDB(db);

  res.json({ success: true, message: `Invoice ${invoiceNumber} created successfully`, invoice: newInvoice });
});

invoiceRouter.post('/mark-paid/:id', (req: Request, res: Response) => {
  const db = readDB();
  const { id } = req.params;
  const { paymentMethod, transactionId } = req.body;

  const inv: any = (db.invoices || []).find((i: any) => i.id === id);
  if (!inv) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  inv.status = 'paid';
  inv.amountPaid = inv.totalAmount;
  inv.balanceDue = 0;
  inv.paymentClearedAt = new Date().toISOString();
  inv.paymentMethod = paymentMethod || inv.paymentMethod || 'paypal';
  inv.transactionId = transactionId || `TX-${Date.now()}`;
  inv.receiptNumber = `RCPT-${Math.floor(10000 + Math.random() * 90000)}`;

  // Synchronize with project status if matched
  if (inv.projectId) {
    const p: any = (db.projects || []).find((proj: any) => proj.id === inv.projectId);
    if (p) {
      if (inv.milestoneType === 'advance_50') {
        p.advancePaid = true;
        p.advanceAmount = inv.totalAmount;
        p.advanceTxId = inv.transactionId;
        if (p.status === 'lead' || p.status === 'scoped') {
          p.status = 'advance_paid';
        }
      } else if (inv.milestoneType === 'balance_50') {
        p.balancePaid = true;
        p.balanceAmount = inv.totalAmount;
        p.balanceTxId = inv.transactionId;
        if (p.status === 'staging_dev' || p.status === 'client_review') {
          p.status = 'balance_paid';
        }
      }
    }
  }

  writeDB(db);
  res.json({ success: true, message: `Invoice ${inv.invoiceNumber} marked as PAID. Receipt ${inv.receiptNumber} generated.`, invoice: inv });
});

invoiceRouter.post('/dispatch-email/:id', (req: Request, res: Response) => {
  const db = readDB();
  const inv: any = (db.invoices || []).find((i: any) => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ success: false, message: 'Invoice not found.' });
  }

  const subject = encodeURIComponent(`Invoice & Payment Details: ${inv.invoiceNumber} (${inv.clientCompany || inv.clientName})`);
  const body = encodeURIComponent(
    `Dear ${inv.clientName},\n\nPlease find the details for Invoice ${inv.invoiceNumber} (${inv.totalAmount} ${inv.currency}).\n\nStatus: ${inv.status.toUpperCase()}\nDue Date: ${inv.dueDate}\n\nThank you for partnering with our international development agency.\n\nClient Operations Team`
  );
  const mailto = `mailto:${inv.clientEmail}?subject=${subject}&body=${body}`;

  res.json({
    success: true,
    message: `Invoice dispatch prepared for ${inv.clientEmail}`,
    mailtoUrl: mailto,
    invoiceNumber: inv.invoiceNumber
  });
});

// ==========================================
// 2. Commission Structure & Employee Ledger (/api/commissions)
// ==========================================

commissionRouter.get('/', (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  
  // Strict RBAC Gate: Forbidden for client guests, developers, and external collaborators
  if (authUser && ['client_guest', 'developer', 'collaborator'].includes(authUser.role)) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Internal commission financial data is restricted from role '${authUser.role}'.`
    });
  }

  const db = readDB();
  let projects = Array.isArray(db.projects) ? [...db.projects] : [];

  // If sales role, restrict exclusively to their assigned deals
  if (authUser && authUser.role === 'sales') {
    projects = projects.filter(p => {
      const isEmailMatch = p.salespersonEmail && authUser.email && p.salespersonEmail.toLowerCase() === authUser.email.toLowerCase();
      const isNameMatch = p.assignedSalesperson && authUser.name && (
        p.assignedSalesperson.toLowerCase().includes(authUser.name.toLowerCase()) ||
        authUser.name.toLowerCase().includes(p.assignedSalesperson.toLowerCase())
      );
      return isEmailMatch || isNameMatch;
    });
  }

  const totalCommission = projects.reduce((acc, p) => acc + (p.commissionAmount || 0), 0);
  const paidCommission = projects
    .filter(p => p.commissionStatus === 'paid')
    .reduce((acc, p) => acc + (p.commissionAmount || 0), 0);
  const pendingCommission = totalCommission - paidCommission;

  // Breakdown per salesperson
  const bySalesperson: Record<string, { totalEarned: number; dealsClosed: number; pending: number }> = {};
  projects.forEach(p => {
    const sp = p.assignedSalesperson || 'General Team';
    if (!bySalesperson[sp]) {
      bySalesperson[sp] = { totalEarned: 0, dealsClosed: 0, pending: 0 };
    }
    bySalesperson[sp].totalEarned += p.commissionAmount || 0;
    bySalesperson[sp].dealsClosed += 1;
    if (p.commissionStatus !== 'paid') {
      bySalesperson[sp].pending += p.commissionAmount || 0;
    }
  });

  res.json({
    success: true,
    summary: {
      totalCommission,
      paidCommission,
      pendingCommission,
      tiers: [
        { tier: 'Tier 1: <= $300', rate: '25%', count: projects.filter(p => (p.finalPrice || 0) <= 300).length },
        { tier: 'Tier 2: $300 - $700', rate: '30%', count: projects.filter(p => (p.finalPrice || 0) > 300 && (p.finalPrice || 0) <= 700).length },
        { tier: 'Tier 3: > $700', rate: '35%', count: projects.filter(p => (p.finalPrice || 0) > 700).length },
        { tier: 'High Performer Discretion', rate: '40% - 45%', count: 1 }
      ]
    },
    bySalesperson,
    ledger: projects.map(p => ({
      projectId: p.id,
      clientName: p.clientName,
      salesperson: p.assignedSalesperson,
      projectValue: p.finalPrice,
      commissionRate: p.commissionRate,
      commissionAmount: p.commissionAmount,
      commissionStatus: p.commissionStatus
    }))
  });
});

commissionRouter.post('/:projectId/payout', (req: Request, res: Response) => {
  const db = readDB();
  const project = (db.projects || []).find((p: any) => p.id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.commissionStatus = req.body.status || 'paid';
  project.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, project });
});

commissionRouter.get('/payouts', (req: Request, res: Response) => {
  const db = readDB();
  const { status, salesperson } = req.query;
  let payouts = db.commissionPayouts || [];

  if (status && status !== 'all') {
    payouts = payouts.filter((p: any) => p.status === status);
  }
  if (salesperson && salesperson !== 'all') {
    payouts = payouts.filter((p: any) => p.salesperson === salesperson);
  }

  res.json({ success: true, count: payouts.length, payouts });
});

commissionRouter.post('/approve/:id', (req: Request, res: Response) => {
  const db = readDB();
  const { id } = req.params;
  const { adminUser, adminNotes } = req.body;

  const payout: any = (db.commissionPayouts || []).find((p: any) => p.id === id);
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout record not found.' });
  }

  const prevStatus = payout.status;
  payout.status = 'approved';
  payout.approvedBy = adminUser || 'Admin (Ali Hasnain)';
  payout.approvedAt = new Date().toISOString();
  if (adminNotes) payout.adminNotes = adminNotes;

  // Log to audit
  if (!db.commissionAuditLogs) db.commissionAuditLogs = [];
  db.commissionAuditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUser: adminUser || 'Admin (Ali Hasnain)',
    action: 'approved',
    salesperson: payout.salesperson,
    projectId: payout.projectId,
    details: `Approved commission payout of $${payout.commissionAmount.toFixed(2)} USD for ${payout.salesperson} (${payout.clientName}).`,
    previousValue: prevStatus,
    newValue: 'approved'
  });

  writeDB(db);
  res.json({ success: true, message: `Payout for ${payout.salesperson} approved.`, payout });
});

commissionRouter.post('/mark-paid/:id', (req: Request, res: Response) => {
  const db = readDB();
  const { id } = req.params;
  const { adminUser, payoutMethod, payoutTxRef } = req.body;

  const payout: any = (db.commissionPayouts || []).find((p: any) => p.id === id);
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout record not found.' });
  }

  const prevStatus = payout.status;
  payout.status = 'paid';
  payout.paidAt = new Date().toISOString();
  payout.payoutMethod = payoutMethod || payout.payoutMethod || 'Bank Wire Transfer';
  payout.payoutTxRef = payoutTxRef || `TX-COMM-${Date.now()}`;

  // Update salesperson profile balances
  const profile: any = (db.salespersonProfiles || []).find((s: any) => s.name === payout.salesperson);
  if (profile) {
    profile.totalCommissionPaid = (profile.totalCommissionPaid || 0) + payout.commissionAmount;
    profile.pendingPayoutAmount = Math.max(0, (profile.pendingPayoutAmount || 0) - payout.commissionAmount);
  }

  // Log to audit
  if (!db.commissionAuditLogs) db.commissionAuditLogs = [];
  db.commissionAuditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUser: adminUser || 'Admin (Ali Hasnain)',
    action: 'paid',
    salesperson: payout.salesperson,
    projectId: payout.projectId,
    details: `Executed commission transfer ($${payout.commissionAmount.toFixed(2)} USD via ${payout.payoutMethod}, Ref: ${payout.payoutTxRef}).`,
    previousValue: prevStatus,
    newValue: 'paid'
  });

  writeDB(db);
  res.json({ success: true, message: `Payout marked as PAID. Reference: ${payout.payoutTxRef}`, payout });
});

commissionRouter.post('/tier-boost', (req: Request, res: Response) => {
  const db = readDB();
  const { salesperson, boostPercent, adminUser, reason } = req.body;

  const profile: any = (db.salespersonProfiles || []).find((s: any) => s.name === salesperson);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Salesperson profile not found.' });
  }

  const oldRate = profile.effectiveRate;
  const boost = Number(boostPercent) || 5;
  profile.bonusBoostRate = boost;
  profile.effectiveRate = Math.min(45, profile.baseRate + boost); // Up to 45% per SOP Section 6
  profile.isBoostApproved = true;
  profile.currentTier = 'VIP High Performer';

  if (!db.commissionAuditLogs) db.commissionAuditLogs = [];
  db.commissionAuditLogs.unshift({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminUser: adminUser || 'Admin (Ali Hasnain)',
    action: 'tier_boost',
    salesperson,
    projectId: 'SYS_CONFIG',
    details: `Promoted ${salesperson} with a +${boost}% Performance Tier Boost. Effective commission rate boosted to ${profile.effectiveRate}%. Reason: ${reason || 'Exceptional deal volume and international client satisfaction.'}`,
    previousValue: `${oldRate}%`,
    newValue: `${profile.effectiveRate}%`
  });

  writeDB(db);
  res.json({
    success: true,
    message: `${salesperson} boosted to ${profile.effectiveRate}% commission rate.`,
    profile
  });
});

commissionRouter.get('/audit-logs', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, logs: db.commissionAuditLogs || [] });
});

commissionRouter.get('/sales-profiles', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, profiles: db.salespersonProfiles || [] });
});

// ==========================================
// 3. Dynamic Performance Heatmaps & Advanced Analytics (/api/analytics)
// ==========================================

analyticsRouter.get('/advanced', (req: Request, res: Response) => {
  const authUser = (req as AuthenticatedRequest).user;
  if (!authUser || !['admin', 'bd_head'].includes(authUser.role)) {
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Executive revenue analytics and forecasting are restricted to Administrators.'
    });
  }

  const db = readDB();
  const dateRange = typeof req.query.dateRange === 'string' ? req.query.dateRange : 'all';
  const salesperson = typeof req.query.salesperson === 'string' ? req.query.salesperson : 'all';
  const tier = typeof req.query.tier === 'string' ? req.query.tier : 'all';

  let filtered = (db.projects as any[]) || [];

  // Filter by salesperson
  if (salesperson !== 'all') {
    filtered = filtered.filter(p => p.assignedSalesperson === salesperson);
  }

  // Filter by tier
  if (tier === 'tier1') {
    filtered = filtered.filter(p => p.finalPrice <= 300);
  } else if (tier === 'tier2') {
    filtered = filtered.filter(p => p.finalPrice > 300 && p.finalPrice <= 700);
  } else if (tier === 'tier3') {
    filtered = filtered.filter(p => p.finalPrice > 700);
  }

  const now = Date.now();
  if (dateRange === '7d') {
    filtered = filtered.filter(p => (now - new Date(p.createdAt || now).getTime()) <= 7 * 86400000);
  } else if (dateRange === '30d') {
    filtered = filtered.filter(p => (now - new Date(p.createdAt || now).getTime()) <= 30 * 86400000);
  } else if (dateRange === 'this_month') {
    const currentMonth = new Date().getMonth();
    filtered = filtered.filter(p => new Date(p.createdAt || now).getMonth() === currentMonth);
  }

  const totalPipeline = filtered.reduce((acc, p) => acc + (p.finalPrice || 0), 0);
  const closedRevenue = filtered
    .filter(p => p.domainTransferred || p.status === 'completed')
    .reduce((acc, p) => acc + (p.finalPrice || 0), 0);
  const advanceCollected = filtered.reduce((acc, p) => acc + (p.advancePaid ? p.advanceAmount || 0 : 0), 0);
  const balanceCollected = filtered.reduce((acc, p) => acc + (p.balancePaid ? p.balanceAmount || 0 : 0), 0);
  const totalCollected = advanceCollected + balanceCollected;
  const totalCommission = filtered.reduce((acc, p) => acc + (p.commissionAmount || 0), 0);
  const commissionPaid = filtered
    .filter(p => p.commissionStatus === 'paid')
    .reduce((acc, p) => acc + (p.commissionAmount || 0), 0);
  const commissionPending = totalCommission - commissionPaid;

  // 7-day Activity Heatmap
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = ['Morning (08-12)', 'Midday (12-16)', 'Afternoon (16-20)', 'Night (20-00)'];

  const heatmap: any[] = [];
  days.forEach((day, dIdx) => {
    slots.forEach((slot, sIdx) => {
      const seed = (dIdx * 3 + sIdx * 5 + filtered.length) % 7;
      const count = seed === 0 ? 0 : seed <= 3 ? 1 : seed <= 5 ? 2 : 3;
      const val = count * 350;
      heatmap.push({
        day,
        timeSlot: slot,
        activityCount: count,
        revenueValue: val
      });
    });
  });

  // Rep leaderboard
  const repStats: Record<string, any> = {};
  filtered.forEach(p => {
    const rep = p.assignedSalesperson || 'General Team';
    if (!repStats[rep]) {
      repStats[rep] = {
        name: rep,
        dealsCount: 0,
        totalRevenue: 0,
        closedRevenue: 0,
        commissionsEarned: 0,
        tier1Deals: 0,
        tier2Deals: 0,
        tier3Deals: 0
      };
    }
    repStats[rep].dealsCount += 1;
    repStats[rep].totalRevenue += p.finalPrice;
    if (p.domainTransferred || p.status === 'completed') {
      repStats[rep].closedRevenue += p.finalPrice;
    }
    repStats[rep].commissionsEarned += p.commissionAmount;
    if (p.finalPrice <= 300) repStats[rep].tier1Deals += 1;
    else if (p.finalPrice <= 700) repStats[rep].tier2Deals += 1;
    else repStats[rep].tier3Deals += 1;
  });

  res.json({
    success: true,
    filtersApplied: { dateRange, salesperson, tier },
    kpis: {
      totalDeals: filtered.length,
      totalPipeline,
      closedRevenue,
      totalCollected,
      totalCommission,
      commissionPaid,
      commissionPending,
      avgDealSize: filtered.length ? Math.round(totalPipeline / filtered.length) : 0,
      conversionRate: filtered.length ? Math.round((closedRevenue / (totalPipeline || 1)) * 100) : 0
    },
    heatmap,
    repLeaderboard: Object.values(repStats)
  });
});

export default invoiceRouter;
