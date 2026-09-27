import crypto from 'crypto';
import { Request, Response } from 'express';
import { getDB, saveDB, DEFAULT_CONNECTORS } from './db';

export interface WebhookResult {
  success: boolean;
  actionSummary: string;
  projectId?: string;
  error?: string;
}

/**
 * Verify Stripe signature if secret is configured
 */
export function verifyStripeSignature(rawBody: string, signatureHeader?: string, secret?: string): boolean {
  if (!secret) return true; // In permissive mode when secret not yet set in environment
  if (!signatureHeader) return false;

  try {
    const parts = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signature) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    return expected === signature;
  } catch {
    return false;
  }
}

/**
 * Handle Stripe Live Webhook Event
 */
export function processStripeWebhook(event: any): WebhookResult {
  const db = getDB();
  const eventType = event.type || 'payment_intent.succeeded';
  const dataObject = event.data?.object || event;

  const customerEmail = dataObject.customer_email || dataObject.billing_details?.email || dataObject.receipt_email || '';
  const metadata = dataObject.metadata || {};
  const projectId = metadata.projectId || metadata.project_id;
  const amountTotal = (dataObject.amount_total || dataObject.amount || 0) / (dataObject.currency ? 100 : 1);
  const txId = dataObject.id || `stripe_tx_${Date.now()}`;

  // Locate matching project
  let project = (db.projects || []).find((p: any) => {
    if (projectId && p.id === projectId) return true;
    if (customerEmail && p.clientEmail && p.clientEmail.toLowerCase() === customerEmail.toLowerCase()) return true;
    return false;
  });

  // If no project matches, pick the first pending lead or create a new lead
  if (!project && customerEmail) {
    project = (db.projects || []).find((p: any) => !p.advancePaid);
  }

  let actionSummary = '';

  if (eventType === 'checkout.session.completed' || eventType === 'payment_intent.succeeded') {
    if (project) {
      if (!project.advancePaid) {
        project.advancePaid = true;
        project.advanceAmount = Number(amountTotal.toFixed(2)) || Number((project.finalPrice * 0.5).toFixed(2));
        project.advanceTxId = txId;
        if (project.status === 'lead' || project.status === 'scoped') {
          project.status = 'advance_paid';
        }
        actionSummary = `Stripe verified 50% advance payment ($${project.advanceAmount} USD) for ${project.clientName}. Project status moved to advance_paid.`;
      } else if (!project.balancePaid) {
        project.balancePaid = true;
        project.balanceAmount = Number(amountTotal.toFixed(2)) || Number((project.finalPrice * 0.5).toFixed(2));
        project.balanceTxId = txId;
        project.status = 'balance_paid';
        actionSummary = `Stripe verified final 50% balance payment ($${project.balanceAmount} USD) for ${project.clientName}. SOP Rule 8 Website Transfer gate UNLOCKED!`;
      } else {
        actionSummary = `Stripe supplemental payment recorded ($${amountTotal} USD) for ${project.clientName}.`;
      }
      project.updatedAt = new Date().toISOString();

      // Log notification in Team Chat
      if (!db.chatMessages) db.chatMessages = [];
      db.chatMessages.push({
        id: `msg-stripe-${Date.now()}`,
        senderId: 'system-stripe',
        senderName: 'Stripe Webhook Gateway',
        senderRole: 'admin',
        channel: 'sales-leads',
        content: `💳 **Live Stripe Settlement**: ${actionSummary}\nTx ID: \`${txId}\``,
        timestamp: new Date().toISOString(),
        reactions: { '💰': 3, '🎉': 2 }
      });
    } else {
      actionSummary = `Stripe payment intent processed ($${amountTotal} USD), no project matched directly.`;
    }
  } else if (eventType === 'charge.refunded') {
    if (project) {
      project.balancePaid = false;
      project.updatedAt = new Date().toISOString();
      actionSummary = `Stripe refund detected for ${project.clientName}. Live transfer gate re-locked.`;
    }
  } else {
    actionSummary = `Stripe event ${eventType} acknowledged.`;
  }

  // Record into webhookLogs
  if (!db.webhookLogs) db.webhookLogs = [];
  db.webhookLogs.unshift({
    id: `log-stripe-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'stripe',
    event: eventType,
    status: 'success',
    summary: actionSummary,
    payloadSnippet: JSON.stringify({ eventType, amount: amountTotal, customer: customerEmail, txId }).slice(0, 300),
    impactedProjectId: project?.id
  });

  saveDB(db);
  return { success: true, actionSummary, projectId: project?.id };
}

/**
 * Handle Upwork Live Webhook Event
 */
export function processUpworkWebhook(event: any): WebhookResult {
  const db = getDB();
  const eventType = event.event || event.eventType || 'contract_milestone_funded';
  const clientName = event.clientName || event.buyerName || 'Upwork Enterprise Client';
  const companyName = event.companyName || 'International Enterprise';
  const amount = Number(event.amount) || 1250;
  const contractId = event.contractId || `upwork_cnt_${Date.now()}`;

  let actionSummary = '';
  let project = (db.projects || []).find((p: any) =>
    p.channel === 'upwork' && (p.clientName.toLowerCase().includes(clientName.toLowerCase()) || p.clientCompany?.toLowerCase().includes(companyName.toLowerCase()))
  );

  if (eventType === 'contract_milestone_funded' || eventType === 'upwork_contract_milestone_funded') {
    if (project) {
      project.advancePaid = true;
      project.advanceAmount = Number((amount * 0.5).toFixed(2));
      project.advanceTxId = `UPWORK-ESCROW-${Date.now()}`;
      project.status = 'advance_paid';
      actionSummary = `Upwork Escrow funded Milestone 1 ($${project.advanceAmount} USD) for ${project.clientName}. Staging development authorized.`;
    } else {
      // Auto-inject project into Discovery
      const newProjId = `proj-${Date.now()}`;
      const newProj = {
        id: newProjId,
        clientName,
        clientEmail: `${clientName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@upwork-client.com`,
        clientCompany: companyName,
        channel: 'upwork',
        websiteType: 'ecommerce',
        purpose: 'Direct Inbound Upwork Contract Milestone',
        inspirationUrls: [],
        hasLogo: true,
        hasContent: false,
        hasImages: true,
        useStockPhotos: true,
        needsContentWriting: true,
        hostingStatus: 'needs_both',
        recommendedHost: 'Hostinger',
        estimatedPrice: amount,
        finalPrice: amount,
        advancePaid: true,
        advanceAmount: Number((amount * 0.5).toFixed(2)),
        advanceTxId: `UPWORK-ESCROW-${Date.now()}`,
        balancePaid: false,
        balanceAmount: Number((amount * 0.5).toFixed(2)),
        paymentMethod: 'paypal',
        currency: 'USD',
        assignedSalesperson: 'Tariq Mehmood',
        salespersonEmail: 'tariq@agencyops.dev',
        commissionRate: 35,
        commissionAmount: Number(((amount * 35) / 100).toFixed(2)),
        commissionStatus: 'pending',
        discordShared: false,
        stagingUrl: '',
        internalQAPassed: false,
        clientApproved: false,
        domainTransferred: false,
        kickOffConfirmed: true,
        timelineDays: 14,
        startDate: new Date().toISOString().split('T')[0],
        targetDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        maintenanceOfferSent: false,
        maintenanceRetainer: false,
        referralEnrolled: false,
        status: 'advance_paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.projects.unshift(newProj);
      project = newProj;
      actionSummary = `New Inbound Upwork Contract auto-created and Milestone 1 Escrow funded ($${project.advanceAmount} USD) for ${clientName}.`;
    }
  } else if (eventType === 'milestone_released' || eventType === 'upwork_milestone_released') {
    if (project) {
      project.balancePaid = true;
      project.balanceAmount = Number((amount * 0.5).toFixed(2));
      project.balanceTxId = `UPWORK-REL-${Date.now()}`;
      project.status = 'balance_paid';
      actionSummary = `Upwork Escrow Milestone 2 released ($${project.balanceAmount} USD) for ${project.clientName}. SOP Rule 8 Website Transfer authorized!`;
    } else {
      actionSummary = `Upwork milestone released for unlinked contract.`;
    }
  } else {
    actionSummary = `Upwork webhook event ${eventType} ingested.`;
  }

  // Record log
  if (!db.webhookLogs) db.webhookLogs = [];
  db.webhookLogs.unshift({
    id: `log-upwork-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'upwork',
    event: eventType,
    status: 'success',
    summary: actionSummary,
    payloadSnippet: JSON.stringify({ eventType, contractId, client: clientName, amount }).slice(0, 300),
    impactedProjectId: project?.id
  });

  saveDB(db);
  return { success: true, actionSummary, projectId: project?.id };
}

/**
 * Handle PayPal Live Webhook Event
 */
export function processPayPalWebhook(event: any): WebhookResult {
  const db = getDB();
  const eventType = event.event_type || 'PAYMENT.CAPTURE.COMPLETED';
  const resource = event.resource || {};
  const amount = Number(resource.amount?.value) || 625;
  const payerEmail = resource.payer?.email_address || '';
  const txId = resource.id || `paypal_tx_${Date.now()}`;

  let project = (db.projects || []).find((p: any) =>
    p.clientEmail?.toLowerCase() === payerEmail.toLowerCase() || (!p.advancePaid && p.paymentMethod === 'paypal')
  );

  let actionSummary = '';
  if (project) {
    if (!project.advancePaid) {
      project.advancePaid = true;
      project.advanceAmount = amount;
      project.advanceTxId = txId;
      project.status = 'advance_paid';
      actionSummary = `PayPal verified 50% advance payment ($${amount} USD) for ${project.clientName}.`;
    } else if (!project.balancePaid) {
      project.balancePaid = true;
      project.balanceAmount = amount;
      project.balanceTxId = txId;
      project.status = 'balance_paid';
      actionSummary = `PayPal cleared final 50% balance payment ($${amount} USD) for ${project.clientName}. Transfer gate unlocked!`;
    }
    project.updatedAt = new Date().toISOString();
  } else {
    actionSummary = `PayPal payment capture completed ($${amount} USD) for ${payerEmail}.`;
  }

  if (!db.webhookLogs) db.webhookLogs = [];
  db.webhookLogs.unshift({
    id: `log-paypal-${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: 'paypal',
    event: eventType,
    status: 'success',
    summary: actionSummary,
    payloadSnippet: JSON.stringify({ eventType, txId, payer: payerEmail, amount }).slice(0, 300),
    impactedProjectId: project?.id
  });

  saveDB(db);
  return { success: true, actionSummary, projectId: project?.id };
}

/**
 * Get all configured Connectors with live status
 */
export function getConnectors(): any[] {
  const db = getDB();
  return db.connectors || DEFAULT_CONNECTORS;
}
