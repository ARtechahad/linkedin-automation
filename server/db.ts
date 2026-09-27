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

// Initial seed data adhering to all 11 SOP sections
export const INITIAL_DB = {
  projects: [
    {
      id: 'proj-1',
      clientName: 'Alexander Vance',
      clientEmail: 'alex.vance@lumina-health.co.uk',
      clientPhone: '+44 20 7946 0912',
      clientCompany: 'Lumina Health Clinics UK',
      channel: 'linkedin',
      websiteType: 'corporate',
      purpose: 'Brand awareness & multi-location clinic booking (8-9 pages)',
      inspirationUrls: ['https://bupa.co.uk', 'https://mayoclinic.org'],
      hasLogo: true,
      hasContent: false,
      hasImages: true,
      useStockPhotos: true,
      needsContentWriting: true,
      assetNotes: 'Logo provided in SVG. Client needs medical copywriting assistance.',
      hostingStatus: 'has_both',
      hostingProvider: 'Hostinger UK',
      credentialsShared: true,
      credentialsNotes: 'CPanel access verified and encrypted in vault.',
      recommendedHost: 'Hostinger',
      estimatedPrice: 1200,
      finalPrice: 1250,
      advancePaid: true,
      advanceAmount: 625,
      advanceTxId: 'PAYPAL-ADV-98124',
      balancePaid: false,
      balanceAmount: 625,
      paymentMethod: 'paypal',
      currency: 'USD',
      assignedSalesperson: 'Tariq Mehmood',
      salespersonEmail: 'tariq@agencyops.dev',
      commissionRate: 35,
      commissionAmount: 437.5,
      commissionStatus: 'pending',
      discordShared: true,
      discordSharedAt: '2026-09-12T10:00:00Z',
      stagingUrl: 'https://staging-lumina.internal-agency.app',
      internalQAPassed: true,
      clientApproved: true,
      clientApprovalDate: '2026-09-14T14:30:00Z',
      domainTransferred: false,
      kickOffConfirmed: true,
      trackerUrl: 'https://trello.com/b/lumina-health-sprint',
      timelineDays: 14,
      startDate: '2026-09-02',
      targetDeliveryDate: '2026-09-16',
      clientRating: 5,
      testimonial: '',
      maintenanceOfferSent: true,
      maintenanceRetainer: false,
      monthlyRetainerFee: 120,
      referralEnrolled: true,
      assignedCollaborators: ['user-collab-1', 'partner@vance-capital.com'],
      partnerEvaluationNotes: 'Comprehensive prime medical clinic platform with HIPAA-compliant booking workflow. High-value digital asset appraisal.',
      partnerEvaluationScore: 92,
      partnerSignOff: true,
      partnerSignOffDate: '2026-09-14T16:00:00Z',
      isDealSheetShared: true,
      status: 'staging_dev',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-15T18:00:00Z'
    },
    {
      id: 'proj-2',
      clientName: 'Elena Rostova',
      clientEmail: 'elena@nordic-ceramics.se',
      clientCompany: 'Nordic Art Pottery',
      channel: 'upwork',
      websiteType: 'ecommerce',
      purpose: 'Handmade ceramic sales with cart, Stripe payment gateway & inventory tracking',
      inspirationUrls: ['https://nordicnest.com'],
      hasLogo: true,
      hasContent: true,
      hasImages: true,
      useStockPhotos: false,
      needsContentWriting: false,
      assetNotes: 'All high-res photos and product descriptions provided in Drive.',
      hostingStatus: 'needs_both',
      recommendedHost: 'Namecheap',
      credentialsShared: false,
      estimatedPrice: 650,
      finalPrice: 650,
      advancePaid: true,
      advanceAmount: 325,
      advanceTxId: 'PAYONEER-TX-44019',
      balancePaid: true,
      balanceAmount: 325,
      balanceTxId: 'PAYONEER-TX-44988',
      paymentMethod: 'payoneer',
      currency: 'USD',
      assignedSalesperson: 'Sara Khan',
      salespersonEmail: 'sara@agencyops.dev',
      commissionRate: 30,
      commissionAmount: 195,
      commissionStatus: 'approved',
      discordShared: true,
      discordSharedAt: '2026-08-28T11:00:00Z',
      stagingUrl: 'https://staging-pottery.internal-agency.app',
      internalQAPassed: true,
      clientApproved: true,
      clientApprovalDate: '2026-09-10T16:00:00Z',
      domainTransferred: true,
      transferCompletedAt: '2026-09-12T09:00:00Z',
      kickOffConfirmed: true,
      trackerUrl: 'https://docs.google.com/spreadsheets/d/pottery-nordic',
      timelineDays: 10,
      startDate: '2026-08-29',
      targetDeliveryDate: '2026-09-08',
      clientRating: 5,
      testimonial: 'Outstanding work! The staging workflow gave us complete confidence before final deployment.',
      maintenanceOfferSent: true,
      maintenanceRetainer: true,
      monthlyRetainerFee: 80,
      referralEnrolled: true,
      status: 'completed',
      createdAt: '2026-08-28T09:00:00Z',
      updatedAt: '2026-09-12T10:00:00Z'
    },
    {
      id: 'proj-3',
      clientName: 'Marcus Sterling',
      clientEmail: 'marcus@sterling-fitness.com',
      clientCompany: 'Sterling High-Performance Training',
      channel: 'email',
      websiteType: 'landing',
      purpose: 'Single-page campaign for 30-day corporate fitness bootcamp signup',
      inspirationUrls: ['https://f45training.com'],
      hasLogo: false,
      hasContent: false,
      hasImages: false,
      useStockPhotos: true,
      needsContentWriting: true,
      hostingStatus: 'has_domain_only',
      hostingProvider: 'GoDaddy',
      credentialsShared: true,
      credentialsNotes: 'GoDaddy delegate access provided.',
      recommendedHost: 'Hostinger',
      estimatedPrice: 280,
      finalPrice: 280,
      advancePaid: true,
      advanceAmount: 140,
      advanceTxId: 'PAYPAL-ADV-1123',
      balancePaid: false,
      balanceAmount: 140,
      paymentMethod: 'paypal',
      currency: 'USD',
      assignedSalesperson: 'Bilal Ahmed',
      salespersonEmail: 'bilal@agencyops.dev',
      commissionRate: 25,
      commissionAmount: 70,
      commissionStatus: 'pending',
      discordShared: true,
      discordSharedAt: '2026-09-13T14:00:00Z',
      stagingUrl: 'https://staging-sterling.internal-agency.app',
      internalQAPassed: false,
      clientApproved: false,
      domainTransferred: false,
      kickOffConfirmed: true,
      timelineDays: 5,
      startDate: '2026-09-13',
      targetDeliveryDate: '2026-09-18',
      maintenanceOfferSent: false,
      maintenanceRetainer: false,
      referralEnrolled: false,
      status: 'advance_paid',
      createdAt: '2026-09-13T11:00:00Z',
      updatedAt: '2026-09-14T10:00:00Z'
    },
    {
      id: 'proj-4',
      clientName: 'David H. Miller',
      clientEmail: 'david@greenleaf-solar.de',
      clientCompany: 'GreenLeaf Solar Solutions',
      channel: 'direct',
      websiteType: 'corporate',
      purpose: 'Commercial solar consulting multi-page site with quote calculator',
      inspirationUrls: ['https://tesla.com/solar'],
      hasLogo: true,
      hasContent: true,
      hasImages: true,
      useStockPhotos: false,
      needsContentWriting: false,
      hostingStatus: 'has_both',
      hostingProvider: 'Namecheap',
      credentialsShared: false,
      estimatedPrice: 950,
      finalPrice: 950,
      advancePaid: false,
      advanceAmount: 475,
      balancePaid: false,
      balanceAmount: 475,
      paymentMethod: 'payoneer',
      currency: 'USD',
      assignedSalesperson: 'Tariq Mehmood',
      salespersonEmail: 'tariq@agencyops.dev',
      commissionRate: 35,
      commissionAmount: 332.5,
      commissionStatus: 'pending',
      discordShared: false,
      internalQAPassed: false,
      clientApproved: false,
      domainTransferred: false,
      kickOffConfirmed: false,
      timelineDays: 12,
      startDate: '2026-09-15',
      targetDeliveryDate: '2026-09-27',
      maintenanceOfferSent: false,
      maintenanceRetainer: false,
      referralEnrolled: false,
      status: 'scoped',
      createdAt: '2026-09-14T15:00:00Z',
      updatedAt: '2026-09-15T09:00:00Z'
    }
  ],
  chatMessages: [
    {
      id: 'msg-1',
      senderId: 'user-sales-1',
      senderName: 'Tariq Mehmood',
      senderRole: 'sales',
      channel: 'sales-leads',
      content: 'Closed Lumina Health ($1250 Corporate). 50% advance cleared via PayPal ($625). Discord briefing shared with coordination team!',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      reactions: { '🔥': 4, '👏': 3 }
    },
    {
      id: 'msg-2',
      senderId: 'user-coord-1',
      senderName: 'Fatima Noor',
      senderRole: 'coordinator',
      channel: 'coordination',
      content: 'Confirmed Lumina Health scope in writing (SOP Step 9). Trello board created and dev staging provisioned.',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      reactions: { '✅': 3 }
    },
    {
      id: 'msg-3',
      senderId: 'user-dev-1',
      senderName: 'Zain Ul Abideen',
      senderRole: 'developer',
      channel: 'staging-dev',
      content: 'Staging website for Lumina Health is 100% QA verified on internal domain. Ready for client inspection.',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      reactions: { '🚀': 5 }
    },
    {
      id: 'msg-4',
      senderId: 'user-admin-1',
      senderName: 'Management (Admin)',
      senderRole: 'admin',
      channel: 'general',
      content: 'Friendly reminder to all team members: Strictly adhere to SOP Rule 8. Never transfer to the client live domain until the remaining 50% balance payment is verified.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      reactions: { '🛡️': 6, '👍': 4 }
    }
  ],
  files: [
    {
      id: 'file-1',
      name: 'Lumina-Health-Brand-Guide-Vector.pdf',
      size: 4821000,
      mimeType: 'application/pdf',
      uploadedBy: 'Tariq Mehmood (Sales)',
      uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      roleRequired: ['admin', 'sales', 'coordinator', 'developer'],
      checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      downloadUrl: '/mock-assets/Lumina-Health-Brand-Guide-Vector.pdf',
      projectId: 'proj-1',
      category: 'assets',
      encrypted: true
    },
    {
      id: 'file-2',
      name: 'Standard-Client-Services-Agreement-Template.pdf',
      size: 1240000,
      mimeType: 'application/pdf',
      uploadedBy: 'Management (Admin)',
      uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
      roleRequired: ['admin', 'sales', 'coordinator'],
      checksumSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      downloadUrl: '/mock-assets/Standard-Client-Services-Agreement.pdf',
      category: 'contracts',
      encrypted: true
    },
    {
      id: 'file-3',
      name: 'Client-Encrypted-Hosting-Credentials-Nordic.json',
      size: 15400,
      mimeType: 'application/json',
      uploadedBy: 'Sara Khan (Sales)',
      uploadedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
      roleRequired: ['admin', 'coordinator', 'developer'],
      checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      downloadUrl: '/mock-assets/Credentials-Nordic.json',
      projectId: 'proj-2',
      category: 'credentials',
      encrypted: true
    }
  ],
  gdprLogs: [
    {
      id: 'gdpr-1',
      action: 'Consent Logged',
      details: 'Analytics & Essential session storage consented by user.',
      timestamp: new Date().toISOString()
    }
  ],
  scraperConfig: {
    keywords: [
      'web developer needed',
      'e-commerce store setup',
      'Shopify expert',
      'Next.js landing page',
      'WordPress redesign'
    ],
    platforms: ['linkedin', 'upwork', 'twitter', 'freelancer'],
    autoInject: false,
    minBudget: 250,
    isScanningActive: true,
    lastScanTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    scanIntervalMinutes: 15
  },
  scrapedLeads: [
    {
      id: 'scrape-1',
      platform: 'linkedin',
      title: 'Looking for a Senior Web Developer to build high-converting SaaS Landing Page',
      authorName: 'David H. Miller',
      authorTitle: 'Head of Growth at CloudPulse Technologies',
      companyName: 'CloudPulse Tech (San Francisco, CA)',
      postSnippet: 'We need an experienced web developer to design and deploy a responsive 5-section landing page with interactive pricing & waitlist. Looking for clean typography, fast load times, and custom components. Must be completed in 10 days.',
      matchedKeyword: 'web developer needed',
      estimatedBudget: 350,
      detectedWebsiteType: 'landing',
      matchScore: 97,
      url: 'https://linkedin.com/feed/update/urn:li:activity:71982341908234',
      scrapedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      injectedToPipeline: false,
      injectedProjectId: '' as string | undefined
    },
    {
      id: 'scrape-2',
      platform: 'upwork',
      title: 'Urgent: E-commerce Store Setup (Shopify & Custom Checkout Integration)',
      authorName: 'Sophie Larsson',
      authorTitle: 'Founder & Creative Director',
      companyName: 'Aura Skincare Nordic',
      postSnippet: 'E-commerce store setup needed for our organic skincare brand launch. Need catalog structure, Stripe & PayPal payment gateways, mobile optimization, and domain configuration. Looking for a dependable agency team.',
      matchedKeyword: 'e-commerce store setup',
      estimatedBudget: 680,
      detectedWebsiteType: 'ecommerce',
      matchScore: 98,
      url: 'https://upwork.com/jobs/~01e9882a17cb49b80',
      scrapedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      injectedToPipeline: false
    },
    {
      id: 'scrape-3',
      platform: 'linkedin',
      title: 'Full Corporate Website Redesign (Law & Consulting Firm, 8 Pages)',
      authorName: 'Richard Vance, Esq.',
      authorTitle: 'Managing Partner',
      companyName: 'Vance & Halden Partners LLC',
      postSnippet: 'Our legal consultancy website requires a comprehensive revamp. Need 8-9 pages including Practice Areas, Partner Bios, Case Studies, and Client Intake forms. High standards of security and professional branding required.',
      matchedKeyword: 'web developer needed',
      estimatedBudget: 1200,
      detectedWebsiteType: 'corporate',
      matchScore: 95,
      url: 'https://linkedin.com/feed/update/urn:li:activity:71982991002341',
      scrapedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      injectedToPipeline: false
    },
    {
      id: 'scrape-4',
      platform: 'upwork',
      title: 'Next.js + Tailwind Landing Page for AI Financial Assistant',
      authorName: 'Kavita Patel',
      authorTitle: 'Product Lead',
      companyName: 'Finova AI',
      postSnippet: 'Seeking a skilled developer to build a modern, high-converting one-page product site. Design inspiration from Stripe and Linear. Staging link and fast delivery needed. Ready to hire immediately.',
      matchedKeyword: 'Next.js landing page',
      estimatedBudget: 400,
      detectedWebsiteType: 'landing',
      matchScore: 94,
      url: 'https://upwork.com/jobs/~01f7789a42be11029',
      scrapedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      injectedToPipeline: false
    },
    {
      id: 'scrape-5',
      platform: 'twitter',
      title: 'Any agency or dev recommendations for a boutique fashion e-commerce store setup?',
      authorName: 'Liam Gallagher',
      authorTitle: 'DTC Brand Strategist',
      companyName: 'Gallagher Apparel',
      postSnippet: 'Need a fast developer for e-commerce store setup. Modern look, seamless checkout, 15 product variants. Budget around $600-750. DMs open with portfolio!',
      matchedKeyword: 'e-commerce store setup',
      estimatedBudget: 650,
      detectedWebsiteType: 'ecommerce',
      matchScore: 92,
      url: 'https://twitter.com/liam_dtc/status/179283918230198',
      scrapedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      injectedToPipeline: false
    }
  ],
  dripTemplates: [
    {
      stage: 1,
      delayHours: 24,
      label: 'Stage 1 (Day 1): Sprint Slot Reservation & Advance Protocol',
      purpose: 'Confirm project kickoff slot and remind of 50% advance deposit to lock sprint dates.',
      subject: 'Reservation Confirmation: Locking in your Web Development Sprint with ClientOps',
      bodyTemplate: 'Dear {{clientName}},\n\nFollowing our discussion regarding your {{websiteType}} project ({{clientCompany}}), our design and development sprint queue is currently scheduling for the upcoming cycle.\n\nAs outlined in our Standard Operating Procedure (SOP), we require a 50% advance deposit (${{advanceAmount}} USD) to officially initiate development, provision your private staging environment, and assign our dedicated engineering team.\n\nWe accept payment securely via PayPal or Payoneer. Please let us know if you would like us to issue the milestone invoice today.\n\nWarm regards,\nSales & Project Coordination Team\nClientOps Web Solutions'
    },
    {
      stage: 2,
      delayHours: 72,
      label: 'Stage 2 (Day 3): Staging Server Allocation & Queue Priority Hold',
      purpose: 'Maintain momentum by highlighting dedicated staging server readiness.',
      subject: 'Staging Server Allocation & Timeline Hold: {{clientName}}',
      bodyTemplate: 'Hi {{clientName}},\n\nI wanted to follow up on our proposal for {{clientCompany}}. Our server infrastructure team has pre-allocated your dedicated internal staging environment so you will be able to review live builds and provide feedback before anything ever goes live.\n\nTo ensure your delivery target remains on schedule without delays to your launch timeline, could you please confirm if you would like to proceed with the 50% advance deposit (${{advanceAmount}} USD) this week?\n\nIf you have any questions on the scope or payment options, I would be glad to hop on a quick 5-minute call.\n\nBest regards,\nSales & Coordination Desk\nClientOps'
    },
    {
      stage: 3,
      delayHours: 120,
      label: 'Stage 3 (Day 5): Urgency & Complimentary Technical Audit',
      purpose: 'Address hesitation with value-add and soft urgency on team capacity.',
      subject: 'Complimentary Performance & SEO Checklist + Sprint Status for {{clientCompany}}',
      bodyTemplate: 'Hello {{clientName}},\n\nWhile preparing the staging architecture for {{clientCompany}}, our technical team put together a complimentary checklist covering mobile responsiveness, Core Web Vitals, and domain DNS setup.\n\nWe have held your development sprint open for 5 days. Because our developers take on a maximum of 4 active international client projects per sprint to maintain strict quality standards, we will need to reallocate this slot if we cannot confirm the 50% advance (${{advanceAmount}} USD) within the next 48 hours.\n\nPlease let us know how you wish to proceed so we can plan accordingly!\n\nKind regards,\nClientOps Engineering & Operations'
    },
    {
      stage: 4,
      delayHours: 168,
      label: 'Stage 4 (Day 7): Graceful Scope Archival & Open Door',
      purpose: 'Polite breakup email that often triggers delayed clients to take action.',
      subject: 'Closing your project file for now: {{clientCompany}} Web Development',
      bodyTemplate: 'Hi {{clientName}},\n\nAs we haven\'t heard back regarding the 50% advance milestone for your {{websiteType}} project, I assume your priorities or timeline have shifted for now, which is completely understandable.\n\nWe are closing and archiving the open estimate for {{clientCompany}} to free up development resources. However, your project specifications and wireframe concepts remain safely stored with us.\n\nWhenever you are ready to resume in the future, simply reply to this message and we will be delighted to reopen your sprint.\n\nWishing you all the best with your business,\nClientOps Operations'
    }
  ],
  clientInquiries: [
    {
      id: 'inbox-1',
      clientName: 'Alexander Vance',
      clientEmail: 'alex.vance@lumina-health.co.uk',
      clientCompany: 'Lumina Health Clinics UK',
      channel: 'linkedin',
      projectId: 'proj-1',
      subject: 'Clarification on Multi-Location Booking & Staging Review',
      content: 'Hi Tariq, we saw the initial wireframes and love the clinic locator layout! Could you confirm when our staging server link will be updated with the mobile booking flow? Also, our finance team will release the 50% balance payment once we verify the clinic appointment webhook.',
      timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      status: 'unread',
      sentiment: 'positive',
      sentimentScore: 92,
      urgency: 'medium',
      aiSuggestedReply: {
        subject: 'Re: Clarification on Multi-Location Booking & Staging Review',
        body: 'Dear Alexander,\n\nThank you for the wonderful feedback on the clinic locator! The mobile booking flow is scheduled for deployment to your private staging link (https://staging-lumina.internal-agency.app) by tomorrow 2:00 PM GMT. Our QA team is currently testing the appointment webhook end-to-end.\n\nAs per our standard SOP, once your team tests and signs off on the staging build, we will generate the final 50% balance invoice. As soon as that clears, our engineers will immediately execute the live DNS transfer.\n\nWarm regards,\nTariq Mehmood\nClient Coordination Desk',
        ruleApplied: 'SOP Rule 8: Staging Development & Balance Transfer Gate',
        confidence: 96
      },
      replies: []
    },
    {
      id: 'inbox-2',
      clientName: 'Elena Rostova',
      clientEmail: 'elena@nordic-ceramics.se',
      clientCompany: 'Nordic Art Pottery',
      channel: 'upwork',
      projectId: 'proj-2',
      subject: 'Upwork Milestone: Advance Payment ready to be funded',
      content: 'Hello team, we have reviewed your proposal for our ceramics e-commerce catalog. We are ready to move forward. Could you set up the Milestone 1 for the 50% advance ($375 USD) on Upwork so we can deposit the escrow funds? Also, how quickly can we inspect the first staging prototype?',
      timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      status: 'unread',
      sentiment: 'urgent_pricing',
      sentimentScore: 88,
      urgency: 'high',
      aiSuggestedReply: {
        subject: 'Re: Upwork Milestone: Advance Payment ready to be funded',
        body: 'Hi Elena,\n\nThank you for approving our proposal! I have set up Milestone 1 (50% Advance Deposit: $375 USD) on our Upwork contract room. Once funded, your sprint officially kicks off.\n\nYour dedicated staging server will be provisioned within 48 hours so you can track the responsive catalog build in real-time. Looking forward to crafting an exquisite boutique storefront!\n\nBest regards,\nTariq Mehmood\nLead Sales & Account Partner',
        ruleApplied: 'SOP Rule 5: 50% Advance Milestone Protocol',
        confidence: 98
      },
      replies: []
    },
    {
      id: 'inbox-3',
      clientName: 'Marcus Aurelius Vance',
      clientEmail: 'marcus@vance-legal.com.au',
      clientCompany: 'Vance Corporate Law Sydney',
      channel: 'email',
      projectId: 'proj-3',
      subject: 'Legal Disclaimer & Consultation Form Scope Query',
      content: 'Good morning. We received your quote for the 8-page corporate portal. We are a bit hesitant about our privacy compliance for GDPR and Australian Privacy Principles. Does your team handle the legal cookie banner and data export mechanisms natively?',
      timestamp: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
      status: 'read',
      sentiment: 'hesitant',
      sentimentScore: 65,
      urgency: 'medium',
      aiSuggestedReply: {
        subject: 'Re: Legal Disclaimer & Consultation Form Scope Query',
        body: 'Dear Marcus,\n\nThank you for reaching out. Yes, absolutely! Every corporate build we execute adheres strictly to international compliance standards, including GDPR Chapter 3 rights, cookie opt-ins, and secure HTTPS configuration.\n\nWe would be delighted to include this in your statement of work at no extra charge. Let us know if you would like to proceed with locking in your sprint slot with the 50% advance.\n\nWarm regards,\nClientOps Engineering',
        ruleApplied: 'SOP Rule 2 & GDPR Compliance Standard',
        confidence: 94
      },
      replies: []
    },
    {
      id: 'inbox-4',
      clientName: 'Dev Team Staging Alert',
      clientEmail: 'devops@agencyops.internal',
      clientCompany: 'Internal Engineering',
      channel: 'discord',
      projectId: 'proj-1',
      subject: '#staging-dev: Mobile Responsiveness & Lighthouse 98 Passed',
      content: 'Internal QA update for Lumina Health (proj-1): All 9 pages passed 100% responsive testing across iPhone 15, Pixel 8, and iPad Pro. Lighthouse performance score is 98. Ready for coordinator to invite client to Staging Review.',
      timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      status: 'replied',
      sentiment: 'positive',
      sentimentScore: 97,
      urgency: 'low',
      replies: [
        {
          id: 'rep-seed-1',
          sender: 'Sara Khan (Coordinator)',
          body: 'Great job team! Staging review notification sent to client Alexander Vance via their secure Client Portal link.',
          sentAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
          channel: 'discord'
        }
      ]
    }
  ],

  // PHASE 3: AUTOMATED PDF INVOICES & PAYMENT RECEIPTS
  invoices: [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-001',
      projectId: 'proj-1',
      clientName: 'Alexander Vance',
      clientCompany: 'Lumina Health Clinics UK',
      clientEmail: 'vance@lumina-health.co.uk',
      clientAddress: '14 Harley Street, London, W1G 9PF, United Kingdom',
      issueDate: '2026-09-02',
      dueDate: '2026-09-05',
      status: 'paid',
      milestoneType: 'advance_50',
      currency: 'USD',
      items: [
        {
          id: 'item-1',
          description: 'Custom Healthcare Portal - 50% Kick-Off Deposit (Discovery, UX & Clinical Architecture)',
          category: 'development',
          quantity: 1,
          unitPrice: 625,
          total: 625
        }
      ],
      subtotal: 625,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: 625,
      amountPaid: 625,
      balanceDue: 0,
      paymentMethod: 'paypal',
      transactionId: 'PAYPAL-ADV-98124',
      paymentClearedAt: '2026-09-03T11:20:00Z',
      receiptNumber: 'RCPT-98124',
      notes: 'Payment received via PayPal Business Gateway. Kick-off authorized per SOP Step 5.',
      terms: 'Strict SOP Protocol: Staging deployment guaranteed in 48h. Final 50% balance required prior to live domain cutover.'
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-002',
      projectId: 'proj-1',
      clientName: 'Alexander Vance',
      clientCompany: 'Lumina Health Clinics UK',
      clientEmail: 'vance@lumina-health.co.uk',
      clientAddress: '14 Harley Street, London, W1G 9PF, United Kingdom',
      issueDate: '2026-09-14',
      dueDate: '2026-09-17',
      status: 'issued',
      milestoneType: 'balance_50',
      currency: 'USD',
      items: [
        {
          id: 'item-2',
          description: 'Custom Healthcare Portal - 50% Final Handover Balance & Production DNS Propagation',
          category: 'development',
          quantity: 1,
          unitPrice: 625,
          total: 625
        }
      ],
      subtotal: 625,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: 625,
      amountPaid: 0,
      balanceDue: 625,
      paymentMethod: 'paypal',
      notes: 'Staging review approved with 5 stars. Balance clearance unlocks DNS cutover per SOP Rule 8.',
      terms: 'Payment due upon invoice receipt. Domain credentials transfer executed immediately upon confirmation.'
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-003',
      projectId: 'proj-2',
      clientName: 'Elena Rostova',
      clientCompany: 'Nordic Clay & Craft',
      clientEmail: 'elena@nordicclay.se',
      clientAddress: 'Storgatan 42, 114 55 Stockholm, Sweden',
      issueDate: '2026-09-11',
      dueDate: '2026-09-14',
      status: 'issued',
      milestoneType: 'advance_50',
      currency: 'USD',
      items: [
        {
          id: 'item-3',
          description: 'E-commerce Boutique Storefront - 50% Advance Escrow Setup (Catalog & Stripe Integration)',
          category: 'design',
          quantity: 1,
          unitPrice: 375,
          total: 375
        }
      ],
      subtotal: 375,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: 375,
      amountPaid: 0,
      balanceDue: 375,
      paymentMethod: 'payoneer',
      notes: 'Upwork contract milestone initialized. Awaiting client escrow deposit.',
      terms: 'Deposit initiates sprint development within 24 hours.'
    },
    {
      id: 'inv-4',
      invoiceNumber: 'INV-2026-004',
      projectId: 'proj-3',
      clientName: 'Marcus Vance',
      clientCompany: 'Vance Corporate Law',
      clientEmail: 'marcus@vance-law.com.au',
      clientAddress: 'Level 28, 161 Castlereagh St, Sydney NSW 2000, Australia',
      issueDate: '2026-09-08',
      dueDate: '2026-09-11',
      status: 'paid',
      milestoneType: 'advance_50',
      currency: 'USD',
      items: [
        {
          id: 'item-4',
          description: 'Corporate Legal Portal - 50% Kick-Off Deposit (GDPR Privacy Architecture & Consultation)',
          category: 'development',
          quantity: 1,
          unitPrice: 440,
          total: 440
        }
      ],
      subtotal: 440,
      taxRatePercent: 0,
      taxAmount: 0,
      totalAmount: 440,
      amountPaid: 440,
      balanceDue: 0,
      paymentMethod: 'bank_wire',
      transactionId: 'WIRE-AU-88211',
      paymentClearedAt: '2026-09-09T08:15:00Z',
      receiptNumber: 'RCPT-88211',
      notes: 'Bank wire verified by finance desk. Production sprint in progress.',
      terms: 'Standard agency international export terms.'
    }
  ],

  // PHASE 3: COMMISSION PAYOUT APPROVAL RECORDS
  commissionPayouts: [
    {
      id: 'payout-1',
      projectId: 'proj-1',
      clientName: 'Alexander Vance',
      clientCompany: 'Lumina Health Clinics UK',
      dealPrice: 1250,
      salesperson: 'Tariq Mehmood',
      baseTier: 'tier3',
      baseRatePercent: 35,
      tierBoostBonusPercent: 5,
      effectiveRatePercent: 40,
      commissionAmount: 500,
      status: 'approved',
      requestedAt: '2026-09-14T10:00:00Z',
      approvedBy: 'Admin (Ali Hasnain)',
      approvedAt: '2026-09-14T12:30:00Z',
      payoutMethod: 'Bank Wire Direct',
      adminNotes: 'High-performer VIP boost approved: Deal > $1000 + 5-star client rating.'
    },
    {
      id: 'payout-2',
      projectId: 'proj-3',
      clientName: 'Marcus Vance',
      clientCompany: 'Vance Corporate Law',
      dealPrice: 880,
      salesperson: 'Tariq Mehmood',
      baseTier: 'tier3',
      baseRatePercent: 35,
      tierBoostBonusPercent: 0,
      effectiveRatePercent: 35,
      commissionAmount: 308,
      status: 'paid',
      requestedAt: '2026-09-10T14:00:00Z',
      approvedBy: 'Admin (Ali Hasnain)',
      approvedAt: '2026-09-10T16:00:00Z',
      paidAt: '2026-09-11T09:00:00Z',
      payoutMethod: 'Wise Business Transfer',
      payoutTxRef: 'WISE-COMM-44120',
      adminNotes: 'SOP Tier 3 payment cleared. Advance and contract confirmed.'
    },
    {
      id: 'payout-3',
      projectId: 'proj-2',
      clientName: 'Elena Rostova',
      clientCompany: 'Nordic Clay & Craft',
      dealPrice: 750,
      salesperson: 'Bilal Shah',
      baseTier: 'tier3',
      baseRatePercent: 35,
      tierBoostBonusPercent: 0,
      effectiveRatePercent: 35,
      commissionAmount: 262.5,
      status: 'pending_approval',
      requestedAt: '2026-09-12T15:00:00Z',
      payoutMethod: 'Payoneer',
      adminNotes: 'Pending 50% advance escrow confirmation from Upwork.'
    },
    {
      id: 'payout-4',
      projectId: 'proj-5',
      clientName: 'Liam O’Connor',
      clientCompany: 'EcoCleanse Ireland',
      dealPrice: 200,
      salesperson: 'Ayesha Khan',
      baseTier: 'tier1',
      baseRatePercent: 25,
      tierBoostBonusPercent: 5,
      effectiveRatePercent: 30,
      commissionAmount: 60,
      status: 'paid',
      requestedAt: '2026-09-08T09:00:00Z',
      approvedBy: 'Admin (Ali Hasnain)',
      approvedAt: '2026-09-08T10:00:00Z',
      paidAt: '2026-09-08T15:00:00Z',
      payoutMethod: 'JazzCash / Bank Transfer',
      payoutTxRef: 'JAZZ-PK-99120',
      adminNotes: 'Tier 1 Landing page fast turnaround boost (+5%).'
    }
  ],

  // PHASE 3: COMMISSION AUDIT LOGS
  commissionAuditLogs: [
    {
      id: 'audit-1',
      timestamp: '2026-09-14T12:30:00Z',
      adminUser: 'Ali Hasnain (Director)',
      action: 'tier_boost',
      salesperson: 'Tariq Mehmood',
      projectId: 'proj-1',
      details: 'Applied High-Performer VIP Boost (+5% commission) on Lumina Health Clinics ($1,250 deal). Rate increased to 40%.',
      previousValue: '35%',
      newValue: '40%'
    },
    {
      id: 'audit-2',
      timestamp: '2026-09-14T12:35:00Z',
      adminUser: 'Ali Hasnain (Director)',
      action: 'approved',
      salesperson: 'Tariq Mehmood',
      projectId: 'proj-1',
      details: 'Approved commission payout of $500.00 USD for Tariq Mehmood.',
      previousValue: 'pending_approval',
      newValue: 'approved'
    },
    {
      id: 'audit-3',
      timestamp: '2026-09-11T09:00:00Z',
      adminUser: 'Ali Hasnain (Director)',
      action: 'paid',
      salesperson: 'Tariq Mehmood',
      projectId: 'proj-3',
      details: 'Executed Wise Business commission transfer ($308.00 USD, Ref: WISE-COMM-44120).',
      previousValue: 'approved',
      newValue: 'paid'
    },
    {
      id: 'audit-4',
      timestamp: '2026-09-08T10:00:00Z',
      adminUser: 'Ali Hasnain (Director)',
      action: 'approved',
      salesperson: 'Ayesha Khan',
      projectId: 'proj-5',
      details: 'Approved Tier 1 fast-turnaround incentive ($60.00 USD) for EcoCleanse.',
      previousValue: 'pending_approval',
      newValue: 'approved'
    }
  ],

  // PHASE 3: SALESPERSON PROFILES WITH MULTI-TIER MANAGEMENT
  salespersonProfiles: [
    {
      id: 'sp-1',
      name: 'Tariq Mehmood',
      email: 'tariq@agencyops.dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'Senior International Accounts Director',
      currentTier: 'VIP High Performer',
      baseRate: 35,
      bonusBoostRate: 5,
      effectiveRate: 40,
      isBoostApproved: true,
      totalDealsClosed: 14,
      totalRevenueGenerated: 16400,
      totalCommissionEarned: 5850,
      totalCommissionPaid: 4500,
      pendingPayoutAmount: 1350
    },
    {
      id: 'sp-2',
      name: 'Bilal Shah',
      email: 'bilal@agencyops.dev',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'E-commerce & Upwork Specialist',
      currentTier: 'Tier 2',
      baseRate: 30,
      bonusBoostRate: 0,
      effectiveRate: 30,
      isBoostApproved: false,
      totalDealsClosed: 8,
      totalRevenueGenerated: 5600,
      totalCommissionEarned: 1680,
      totalCommissionPaid: 1200,
      pendingPayoutAmount: 480
    },
    {
      id: 'sp-3',
      name: 'Ayesha Khan',
      email: 'ayesha@agencyops.dev',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'Outreach & Rapid Landing Page Partner',
      currentTier: 'Tier 1',
      baseRate: 25,
      bonusBoostRate: 5,
      effectiveRate: 30,
      isBoostApproved: true,
      totalDealsClosed: 6,
      totalRevenueGenerated: 2400,
      totalCommissionEarned: 720,
      totalCommissionPaid: 660,
      pendingPayoutAmount: 60
    }
  ],

  // PHASE 3: AUTOMATED DRIP EMAIL & WHATSAPP NUDGE TEMPLATES
  nudgeTemplates: [
    {
      id: 'nudge-advance-delay',
      triggerType: 'advance_deposit_delayed',
      title: '50% Advance Milestone Deposit Delay Notice',
      description: 'Triggered when client has not funded Milestone 1 within 48-72h of proposal approval.',
      delayHoursThreshold: 48,
      emailSubject: 'Action Required: Securing Your Project Sprint Slot (Invoice {{invoiceNumber}})',
      emailBody: 'Dear {{clientName}},\n\nI hope you are having a productive week! Following our agreed scope for {{clientCompany}}, we have provisioned your dedicated engineering team.\n\nTo officially lock in your delivery sprint and launch the staging environment, please complete the 50% advance milestone deposit (${{advanceAmount}} USD):\n\n👉 View & Pay Secure Invoice: {{invoiceLink}}\n\nOnce received, our development clock begins immediately. Please let us know if your accounts team requires any additional vendor documentation.\n\nWarm regards,\n{{salespersonName}}\nClient Operations Team',
      whatsappMessage: '👋 Hi *{{clientName}}*, following up on the web development sprint for *{{clientCompany}}*! Your initial 50% milestone invoice (*${{advanceAmount}} USD*) is ready for clearance: {{invoiceLink}}. Once cleared, we kick off staging development right away. Let us know if you need any assistance!',
      discordMessage: '⚠️ **Client Nudge Dispatched**: Advance deposit reminder sent to **{{clientName}}** ({{clientCompany}}). Milestone 1: **${{advanceAmount}} USD**. Channel: Email + WhatsApp.'
    },
    {
      id: 'nudge-staging-review',
      triggerType: 'staging_review_pending',
      title: 'Interactive Staging Site Ready for Review & Sign-Off',
      description: 'Triggered once internal QA passes and staging prototype is live for client testing.',
      delayHoursThreshold: 24,
      emailSubject: 'Your Staging Website is Live for Inspection: {{clientCompany}}',
      emailBody: 'Hi {{clientName}},\n\nGreat news! Our engineering team has completed the private staging build for {{clientCompany}} and passed internal cross-device QA testing.\n\n👉 Inspect Live Staging Website: {{stagingUrl}}\n👉 Access Your Secure Client Portal: {{portalLink}}\n\nPlease review the interactive layouts on desktop and mobile. You can submit feedback or revisions directly through your portal, or approve the build to initiate live domain migration.\n\nLooking forward to your thoughts!\n\nBest regards,\nEngineering Team',
      whatsappMessage: '🎉 Hi *{{clientName}}*! Your private staging website for *{{clientCompany}}* is now live: {{stagingUrl}}. Please take a look across desktop and mobile, and feel free to log any revision requests in your Client Portal: {{portalLink}}!',
      discordMessage: '🚀 **Staging Review Nudge**: Client **{{clientName}}** invited to inspect staging build at {{stagingUrl}}.'
    },
    {
      id: 'nudge-balance-due',
      triggerType: 'balance_due_handover',
      title: '50% Final Balance Clearance & Domain Cutover Notice',
      description: 'Triggered upon staging approval to release live production DNS cutover (SOP Rule 8).',
      delayHoursThreshold: 24,
      emailSubject: 'Staging Approved: Final Balance Invoice & Live Domain Cutover: {{clientCompany}}',
      emailBody: 'Dear {{clientName}},\n\nThank you for approving the staging build for {{clientCompany}}! Everything looks pristine and ready for your live audience.\n\nPer our agency standard operating procedure (Rule 8: Secure Handover Protocol), please clear the final 50% balance (${{balanceAmount}} USD) so we can execute the live domain DNS migration:\n\n👉 Clear Final Balance & Receipt: {{invoiceLink}}\n\nImmediately upon payment receipt, our DevOps specialists will point DNS records and transfer full admin ownership to your company.\n\nWarm regards,\nClientOps Engineering',
      whatsappMessage: '🌟 Hi *{{clientName}}*, thrilled that you approved the staging build! To trigger live DNS propagation to your official domain, please settle the final 50% balance (*${{balanceAmount}} USD*): {{invoiceLink}}. We are ready to launch immediately upon payment!',
      discordMessage: '🔒 **SOP Rule 8 Handover Gate**: Final balance notice dispatched to **{{clientName}}** (${{balanceAmount}} USD).'
    },
    {
      id: 'nudge-inactivity',
      triggerType: 'inactivity_checkin',
      title: 'Sprint Momentum & Feedback Check-In',
      description: 'Triggered when client has been inactive for more than 5 days during an active sprint.',
      delayHoursThreshold: 120,
      emailSubject: 'Project Check-In: Keeping Momentum on {{clientCompany}}',
      emailBody: 'Hi {{clientName}},\n\nChecking in to make sure you have everything needed to review our latest milestone updates. We want to ensure your site launches on schedule!\n\n👉 Revisit Your Project Portal: {{portalLink}}\n\nIf you prefer a quick 10-minute walkthrough call this week, just reply to this email or send us a WhatsApp message.\n\nBest regards,\nClient Services Team',
      whatsappMessage: '👋 Hi *{{clientName}}*, just checking in on the *{{clientCompany}}* project! Let us know if you have any questions or if you would like a brief walkthrough call: {{portalLink}}.',
      discordMessage: '⏳ **Inactivity Check-In**: Follow-up message sent to **{{clientName}}**.'
    }
  ],

  // PHASE 3: DISPATCH LOGS
  nudgeLogs: [
    {
      id: 'nudge-log-1',
      projectId: 'proj-2',
      clientName: 'Elena Rostova',
      clientPhone: '+46 8 123 4567',
      clientEmail: 'elena@nordicclay.se',
      triggerType: 'advance_deposit_delayed',
      channel: 'whatsapp',
      dispatchedAt: '2026-09-14T16:00:00Z',
      contentSnippet: 'Follow-up on 50% milestone escrow on Upwork ($375 USD)',
      dispatchedBy: 'Tariq Mehmood',
      deliveryStatus: 'opened_in_whatsapp'
    }
  ]
};

// Database read/write helpers with PostgreSQL & atomic fallback
export function readDB(): any {
  const parsed = getDB(INITIAL_DB) || {};
  if (!Array.isArray(parsed.projects)) parsed.projects = INITIAL_DB.projects || [];
  if (!Array.isArray(parsed.invoices)) parsed.invoices = INITIAL_DB.invoices || [];
  if (!Array.isArray(parsed.clientInquiries)) parsed.clientInquiries = INITIAL_DB.clientInquiries || [];
  if (!Array.isArray(parsed.chatMessages)) parsed.chatMessages = INITIAL_DB.chatMessages || [];
  if (!Array.isArray(parsed.files)) parsed.files = INITIAL_DB.files || [];
  if (!Array.isArray(parsed.gdprLogs)) parsed.gdprLogs = INITIAL_DB.gdprLogs || [];
  if (!Array.isArray(parsed.scrapedLeads)) parsed.scrapedLeads = INITIAL_DB.scrapedLeads || [];
  if (!Array.isArray(parsed.dripTemplates)) parsed.dripTemplates = INITIAL_DB.dripTemplates || [];
  if (!Array.isArray(parsed.commissionPayouts)) parsed.commissionPayouts = INITIAL_DB.commissionPayouts || [];
  if (!Array.isArray(parsed.commissionAuditLogs)) parsed.commissionAuditLogs = INITIAL_DB.commissionAuditLogs || [];
  if (!Array.isArray(parsed.salespersonProfiles)) parsed.salespersonProfiles = INITIAL_DB.salespersonProfiles || [];
  if (!Array.isArray(parsed.nudgeTemplates)) parsed.nudgeTemplates = INITIAL_DB.nudgeTemplates || [];
  if (!Array.isArray(parsed.nudgeLogs)) parsed.nudgeLogs = INITIAL_DB.nudgeLogs || [];
  if (!Array.isArray(parsed.users)) parsed.users = DEFAULT_USERS;
  if (!Array.isArray(parsed.connectors)) parsed.connectors = DEFAULT_CONNECTORS;
  if (!Array.isArray(parsed.webhookLogs)) parsed.webhookLogs = [];
  return parsed;
}

export function writeDB(data: typeof INITIAL_DB | any): void {
  saveDB(data);
}

// AI & Algorithmic Lead Scoring
export function calculateLeadScore(p: any): any {
  let budgetScore = 15;
  const price = p.finalPrice || p.estimatedPrice || 0;
  if (price >= 1000) budgetScore = 30;
  else if (price >= 700) budgetScore = 26;
  else if (price >= 400) budgetScore = 22;
  else if (price >= 250) budgetScore = 18;

  let scopeScore = 18;
  if (p.websiteType === 'ecommerce' || p.websiteType === 'corporate') scopeScore = 25;
  else if (p.websiteType === 'landing') scopeScore = 21;
  if (p.purpose && p.purpose.length > 30) scopeScore = Math.min(25, scopeScore + 3);

  let readinessScore = 5;
  if (p.hasLogo) readinessScore += 5;
  if (p.hasContent) readinessScore += 5;
  if (p.hasImages) readinessScore += 3;
  if (p.credentialsShared) readinessScore += 2;
  readinessScore = Math.min(20, readinessScore);

  let urgencyScore = 14;
  if (p.channel === 'upwork' || p.channel === 'linkedin') urgencyScore += 6;
  if (p.timelineDays && p.timelineDays <= 14) urgencyScore += 5;
  urgencyScore = Math.min(25, urgencyScore);

  const totalScore = Math.min(100, budgetScore + scopeScore + readinessScore + urgencyScore);

  let tierTag: 'vip' | 'hot' | 'warm' | 'cold' = 'warm';
  let label = '⚠️ Warm Lead';
  let recommendedAction = 'Schedule discovery call and finalize wireframe scope.';

  if (totalScore >= 88 && price >= 700) {
    tierTag = 'vip';
    label = '⚡ Fast-Track VIP';
    recommendedAction = 'High-value account. Assign senior sales rep and fast-track 50% advance invoice.';
  } else if (totalScore >= 78) {
    tierTag = 'hot';
    label = '🔥 Hot Lead';
    recommendedAction = 'Client has clear scope & budget. Send 50% advance agreement within 24h.';
  } else if (totalScore >= 50) {
    tierTag = 'warm';
    label = '⚠️ Warm Lead';
    recommendedAction = 'Address content/asset gaps and propose tiered hosting recommendation.';
  } else {
    tierTag = 'cold';
    label = '❄️ Cold Lead';
    recommendedAction = 'Send automated drip follow-up and educational portfolio links.';
  }

  return {
    totalScore,
    tierTag,
    label,
    factors: { budgetScore, scopeScore, readinessScore, urgencyScore },
    analysisSummary: `Budget: $${price} (${budgetScore}/30), Scope: ${String(p.websiteType || '').toUpperCase()} (${scopeScore}/25), Assets: (${readinessScore}/20), Urgency index: (${urgencyScore}/25).`,
    recommendedAction,
    analyzedAt: new Date().toISOString()
  };
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

