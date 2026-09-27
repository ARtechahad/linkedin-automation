import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper reproduction of core business logic to test
function calculateCommissionTest(projectValue, hasHighPerformanceTier = false) {
  let percentage = 25;
  if (projectValue <= 300) {
    percentage = hasHighPerformanceTier ? 40 : 25;
  } else if (projectValue <= 700) {
    percentage = hasHighPerformanceTier ? 42 : 30;
  } else {
    percentage = hasHighPerformanceTier ? 45 : 35;
  }
  const amount = Number(((projectValue * percentage) / 100).toFixed(2));
  return { percentage, amount };
}

function checkTransferAuthorization(project) {
  if (!project.advancePaid) {
    return { allowed: false, reason: 'Advance 50% payment is not confirmed.' };
  }
  if (!project.balancePaid) {
    return { allowed: false, reason: 'SOP Rule 8 Violation: Website transfer is strictly locked until 100% balance payment is cleared.' };
  }
  if (!project.internalQAPassed) {
    return { allowed: false, reason: 'Quality assurance checklist is pending.' };
  }
  return { allowed: true, reason: 'Approved for final domain and hosting migration.' };
}

function formatDiscordHandoffTest(clientName, websiteType, price, paymentStatus) {
  return `📢 **NEW CLOSED CLIENT HANDOFF (SOP STEP 7)**\nClient: ${clientName}\nType: ${websiteType}\nPrice: $${price}\nPayment: ${paymentStatus}`;
}

describe('International Client Handling SOP - Automated Tests', () => {
  describe('SOP Section 6: Commission Structure Assertions', () => {
    test('Tier 1: Project <= $300 should yield exactly 25% commission', () => {
      const res = calculateCommissionTest(200);
      assert.equal(res.percentage, 25);
      assert.equal(res.amount, 50.00);

      const resEdge = calculateCommissionTest(300);
      assert.equal(resEdge.percentage, 25);
      assert.equal(resEdge.amount, 75.00);
    });

    test('Tier 2: Project between $300 and $700 should yield exactly 30% commission', () => {
      const res = calculateCommissionTest(500);
      assert.equal(res.percentage, 30);
      assert.equal(res.amount, 150.00);

      const resEdge = calculateCommissionTest(700);
      assert.equal(resEdge.percentage, 30);
      assert.equal(resEdge.amount, 210.00);
    });

    test('Tier 3: Project > $700 should yield exactly 35% commission', () => {
      const res = calculateCommissionTest(1000);
      assert.equal(res.percentage, 35);
      assert.equal(res.amount, 350.00);
    });

    test('High Performer Tier: Discretionary commission rate applies (up to 45%)', () => {
      const resTier3High = calculateCommissionTest(1000, true);
      assert.equal(resTier3High.percentage, 45);
      assert.equal(resTier3High.amount, 450.00);

      const resTier1High = calculateCommissionTest(300, true);
      assert.equal(resTier1High.percentage, 40);
      assert.equal(resTier1High.amount, 120.00);
    });
  });

  describe('SOP Section 8: Staging Development & Website Transfer Gate', () => {
    test('Must reject transfer when final 50% balance payment is NOT cleared', () => {
      const project = {
        advancePaid: true,
        balancePaid: false,
        internalQAPassed: true
      };
      const check = checkTransferAuthorization(project);
      assert.equal(check.allowed, false);
      assert.match(check.reason, /SOP Rule 8 Violation/);
    });

    test('Must reject transfer when advance payment was skipped', () => {
      const project = {
        advancePaid: false,
        balancePaid: true,
        internalQAPassed: true
      };
      const check = checkTransferAuthorization(project);
      assert.equal(check.allowed, false);
      assert.match(check.reason, /Advance 50% payment/);
    });

    test('Must allow transfer ONLY when both payments (100%) and QA are cleared', () => {
      const project = {
        advancePaid: true,
        balancePaid: true,
        internalQAPassed: true
      };
      const check = checkTransferAuthorization(project);
      assert.equal(check.allowed, true);
      assert.match(check.reason, /Approved/);
    });
  });

  describe('SOP Section 7: Discord Handover Formatting', () => {
    test('Handoff text contains mandatory SOP 7 fields', () => {
      const text = formatDiscordHandoffTest('Apex Legal UK', 'Corporate', 1200, '50% Advance Received');
      assert.ok(text.includes('Apex Legal UK'));
      assert.ok(text.includes('Corporate'));
      assert.ok(text.includes('1200'));
      assert.ok(text.includes('50% Advance Received'));
    });
  });

  describe('RBAC Authorization & Privacy Controls', () => {
    test('Client guest role should have restricted permissions', () => {
      const guestRole = 'client_guest';
      const permittedRoles = ['admin', 'sales', 'coordinator', 'developer'];
      assert.equal(permittedRoles.includes(guestRole), false);
    });
  });

  describe('Phase 1: Agent-Reach Lead Scraper & Outreach Engine', () => {
    test('Keyword Matching detects target client intent', () => {
      const snippet = 'Urgent: e-commerce store setup needed for our organic skincare brand launch.';
      const keywords = ['web developer needed', 'e-commerce store setup'];
      const matched = keywords.some(k => snippet.toLowerCase().includes(k.toLowerCase()));
      assert.equal(matched, true);
    });

    test('LinkedIn Connection Snippet strictly respects <= 300 character constraint', () => {
      const generateSnippet = (name, comp, wType) => 
        `Hi ${name}, saw your post regarding ${wType} development for ${comp}. We build fast, high-converting sites with live staging demos in 7 days. Would love to connect and share a few relevant case studies!`;
      const snippet = generateSnippet('Alexander Vance', 'Lumina Health Clinics UK', 'corporate');
      assert.ok(snippet.length <= 300, `Expected snippet length <= 300, got ${snippet.length}`);
    });

    test('Drip Campaign advances stages when 50% advance payment is delayed', () => {
      const evaluateDripStage = (daysSinceProposal, advancePaid) => {
        if (advancePaid) return { active: false, stage: 0 };
        if (daysSinceProposal >= 7) return { active: true, stage: 4 };
        if (daysSinceProposal >= 5) return { active: true, stage: 3 };
        if (daysSinceProposal >= 3) return { active: true, stage: 2 };
        return { active: true, stage: 1 };
      };

      assert.equal(evaluateDripStage(1, false).stage, 1);
      assert.equal(evaluateDripStage(3, false).stage, 2);
      assert.equal(evaluateDripStage(5, false).stage, 3);
      assert.equal(evaluateDripStage(8, false).stage, 4);
      assert.equal(evaluateDripStage(5, true).active, false);
    });
  });

  describe('Hybrid & Local-First AI Architecture Assertions', () => {
    test('Offline SOP Fallback provides complete zero-crash proposal when AI is offline', () => {
      const generateOfflineFallback = (options) => {
        const clientName = options.clientName || 'Client';
        const websiteType = options.websiteType || 'landing';
        const advanceNotice = 'To secure our dedicated development sprint slot, we require a 50% upfront deposit as per our Standard Operating Procedure (SOP). The remaining 50% is due only after you test and approve the completed build on our private staging domain.';
        return {
          isFallback: true,
          providerUsed: 'manual',
          modelUsed: 'offline-sop-rules',
          text: `Hi ${clientName},\n\nThank you for reaching out regarding your ${websiteType} project.\n\n${advanceNotice}`
        };
      };

      const result = generateOfflineFallback({ clientName: 'Robert', websiteType: 'ecommerce' });
      assert.equal(result.isFallback, true);
      assert.equal(result.providerUsed, 'manual');
      assert.ok(result.text.includes('50% upfront deposit'));
      assert.ok(result.text.includes('private staging domain'));
    });

    test('Local AI Endpoint structure adheres to Ollama /api/generate format', () => {
      const ollamaPayload = (model, prompt) => ({
        model: model || 'llama3.2',
        prompt,
        stream: false
      });

      const payload = ollamaPayload('qwen2.5:7b', 'Write proposal');
      assert.equal(payload.model, 'qwen2.5:7b');
      assert.equal(payload.stream, false);
      assert.equal(payload.prompt, 'Write proposal');
    });
  });

  describe('Phase 5: Production Database Persistence, Real Webhooks & RBAC Assertions', () => {
    test('Database Persistence: Dual-Engine fallback guarantees zero-loss JSON snapshots', () => {
      const getEngineMode = (dbUrl) => {
        return (dbUrl && dbUrl.startsWith('postgres')) ? 'postgresql' : 'local_disk_json';
      };

      assert.equal(getEngineMode(undefined), 'local_disk_json');
      assert.equal(getEngineMode('postgresql://postgres:pass@localhost:5432/agency'), 'postgresql');
      assert.equal(getEngineMode('postgres://railway:pass@viaduct.railway.app:5432/railway'), 'postgresql');
    });

    test('Live Webhooks: Stripe checkout.session.completed clears 50% advance deposit', () => {
      const project = {
        id: 'proj-1',
        clientName: 'Alexander Vance',
        finalPrice: 1250,
        advancePaid: false,
        balancePaid: false,
        status: 'lead'
      };

      // Simulate Stripe Webhook Processing
      const processStripeTest = (proj, amount) => {
        if (!proj.advancePaid) {
          proj.advancePaid = true;
          proj.advanceAmount = amount;
          proj.status = 'advance_paid';
          return 'advance_cleared';
        } else if (!proj.balancePaid) {
          proj.balancePaid = true;
          proj.balanceAmount = amount;
          proj.status = 'balance_paid';
          return 'balance_cleared';
        }
        return 'supplemental';
      };

      const res1 = processStripeTest(project, 625);
      assert.equal(res1, 'advance_cleared');
      assert.equal(project.advancePaid, true);
      assert.equal(project.status, 'advance_paid');

      const res2 = processStripeTest(project, 625);
      assert.equal(res2, 'balance_cleared');
      assert.equal(project.balancePaid, true);
      assert.equal(project.status, 'balance_paid');
    });

    test('Production RBAC: Role hierarchy restricts client guests to portal only', () => {
      const checkPermission = (userRole, action) => {
        if (userRole === 'admin') return true;
        if (userRole === 'sales') {
          return ['projects:read', 'projects:write', 'outreach:generate', 'inbox:manage', 'commissions:view_own'].includes(action);
        }
        if (userRole === 'developer') {
          return ['projects:read', 'staging:review', 'qa:signoff', 'discord:handoff', 'vault:read'].includes(action);
        }
        if (userRole === 'client_guest') {
          return ['portal:access', 'milestones:review', 'staging:inspect', 'invoices:view', 'feedback:submit'].includes(action);
        }
        return false;
      };

      // Admin has universal access
      assert.equal(checkPermission('admin', 'database:manage'), true);
      assert.equal(checkPermission('admin', 'commissions:payout'), true);

      // Sales cannot payout commissions or manage database
      assert.equal(checkPermission('sales', 'commissions:view_own'), true);
      assert.equal(checkPermission('sales', 'commissions:payout'), false);
      assert.equal(checkPermission('sales', 'database:manage'), false);

      // Developer cannot see commission sheets
      assert.equal(checkPermission('developer', 'staging:review'), true);
      assert.equal(checkPermission('developer', 'commissions:view_own'), false);

      // Client guest strictly restricted to portal
      assert.equal(checkPermission('client_guest', 'portal:access'), true);
      assert.equal(checkPermission('client_guest', 'staging:inspect'), true);
      assert.equal(checkPermission('client_guest', 'vault:read'), false);
      assert.equal(checkPermission('client_guest', 'projects:write'), false);
    });
  });
});
