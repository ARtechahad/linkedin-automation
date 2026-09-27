/**
 * Core Type Definitions for International Client Handling & Project Operations Suite
 */

export type UserRole = 'admin' | 'sales' | 'coordinator' | 'developer' | 'client_guest' | 'collaborator' | 'bd_head';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  commissionTierBonus?: boolean;
}

export type WebsiteType = 'landing' | 'ecommerce' | 'corporate' | 'custom';

export type ProjectStatus = 
  | 'lead'              // Step 1: Initial outreach & qualification
  | 'scoped'            // Step 2: Content & design materials reviewed
  | 'advance_paid'      // Step 5: 50% advance payment confirmed
  | 'staging_dev'       // Step 8: Development on internal domain
  | 'client_review'     // Step 8: Testing & client feedback
  | 'balance_paid'      // Step 5 & 8: Final 50% payment received
  | 'transferred'       // Step 8: Domain migration completed
  | 'completed';        // Step 11: Feedback & retention

export type LeadChannel = 'linkedin' | 'upwork' | 'email' | 'fiverr' | 'direct';
export type PaymentMethod = 'paypal' | 'payoneer' | 'bank_transfer';
export type HostingStatus = 'has_both' | 'needs_both' | 'has_domain_only' | 'has_hosting_only';

export interface ProjectLead {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  channel: LeadChannel;
  websiteType: WebsiteType;
  purpose: string;
  inspirationUrls: string[];
  
  // Step 2: Content & Design Assets
  hasLogo: boolean;
  hasContent: boolean;
  hasImages: boolean;
  useStockPhotos: boolean;
  needsContentWriting: boolean;
  assetNotes?: string;

  // Step 3: Domain & Hosting
  hostingStatus: HostingStatus;
  hostingProvider?: string;
  credentialsShared: boolean;
  credentialsNotes?: string;
  recommendedHost?: 'Hostinger' | 'Namecheap' | 'Bluehost';

  // Step 4 & 5: Pricing & Payments
  estimatedPrice: number;
  finalPrice: number;
  advancePaid: boolean;
  advanceAmount: number;
  advanceTxId?: string;
  balancePaid: boolean;
  balanceAmount: number;
  balanceTxId?: string;
  paymentMethod: PaymentMethod;
  currency: string;

  // Step 6: Commission
  assignedSalesperson: string;
  salespersonEmail: string;
  commissionRate: number; // e.g. 25, 30, 35, 40, 45
  commissionAmount: number;
  commissionStatus: 'pending' | 'approved' | 'paid';

  // Step 7: Project Sharing
  discordShared: boolean;
  discordSharedAt?: string;

  // Step 8: Staging & Transfer
  stagingUrl?: string;
  internalQAPassed: boolean;
  clientApproved: boolean;
  clientApprovalDate?: string;
  domainTransferred: boolean;
  transferCompletedAt?: string;

  // Step 9: Kick-Off & Tracking
  kickOffConfirmed: boolean;
  trackerUrl?: string;
  timelineDays: number;
  startDate: string;
  targetDeliveryDate: string;

  // Step 10 & 11: Retention & Feedback
  clientRating?: number;
  testimonial?: string;
  maintenanceOfferSent: boolean;
  maintenanceRetainer: boolean;
  monthlyRetainerFee?: number;
  referralEnrolled: boolean;

  status: ProjectStatus;
  
  // Phase 1: Smart Follow-Up & Drip Campaign for 50% Advance Payment
  dripCampaign?: ProjectDripState;

  // Phase 2: AI Lead Scoring & Secure Client Portal
  leadScore?: LeadScore;
  clientPortalToken?: string;
  clientFeedback?: ClientFeedbackItem[];

  // Partner Workspace & Isolated Collaboration
  assignedCollaborators?: string[];
  partnerEvaluationNotes?: string;
  partnerEvaluationScore?: number; // 1-100 evaluation appraisal
  partnerSignOff?: boolean;
  partnerSignOffDate?: string;
  isDealSheetShared?: boolean;
  sourceMetadata?: Record<string, any>;

  // Project Time Tracking & Developer Active Tasks Module
  tasks?: ProjectTask[];
  timeLogs?: ProjectTimeLog[];
  activeTimer?: ActiveTimerState | null;

  // Google Workspace Deep Integration Fields
  googleDocUrl?: string;
  googleDocId?: string;
  googleTaskListId?: string;
  googleCalendarEventId?: string;
  googleMeetingUrl?: string;
  workspaceNotes?: string;
  googleTasksSyncedAt?: string;
  googleCalendarSyncedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskCategory = 'frontend' | 'backend' | 'design' | 'devops' | 'qa' | 'content' | 'general';

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignedDeveloper?: string;
  assignedDeveloperAvatar?: string;
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
  completedAt?: string;
}

export interface ProjectTimeLog {
  id: string;
  projectId: string;
  taskId: string;
  taskTitle: string;
  developerName: string;
  developerEmail?: string;
  developerAvatar?: string;
  hours: number;
  durationMinutes: number;
  date: string;
  loggedAt: string;
  billable: boolean;
  hourlyRate?: number;
  notes: string;
}

export interface ActiveTimerState {
  projectId: string;
  taskId: string;
  taskTitle: string;
  startTime: number; // Unix ms
  isRunning: boolean;
  billable: boolean;
  developerName: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  channel: 'general' | 'sales-leads' | 'staging-dev' | 'coordination';
  content: string;
  timestamp: string;
  attachmentName?: string;
  attachmentUrl?: string;
  reactions?: Record<string, number>;
}

export interface SecureFile {
  id: string;
  name: string;
  size: number | string;
  mimeType?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  roleRequired?: UserRole[];
  accessRole?: 'all' | 'coordinator' | 'developer' | 'admin' | UserRole;
  sha256?: string;
  checksumSha256?: string;
  downloadUrl?: string;
  projectId?: string;
  category: 'credentials' | 'contracts' | 'assets' | 'deliverables' | 'asset' | 'credential' | 'contract' | 'deliverable';
  encrypted?: boolean;
}

export type SecureFileRecord = SecureFile;

export interface AutomatedTestResult {
  id?: string;
  name: string;
  category: string;
  status: 'passed' | 'failed';
  details?: string;
  message?: string;
  durationMs?: number;
  executionTimeMs?: number;
  timestamp?: string;
}

export interface GDPRConsentState {
  analyticsConsent: boolean;
  marketingConsent: boolean;
  essentialConsent: boolean;
  consentTimestamp: string;
}

export type SupportedLanguage = 'en' | 'ur' | 'es' | 'ar' | 'fr' | 'de';

export type ThemeMode = 'light' | 'dark' | 'system';

// ========================================================
// Phase 1: Automated Lead Generation & Outreach (Agent-Reach)
// ========================================================

export type ScraperPlatform = 'linkedin' | 'upwork' | 'twitter' | 'freelancer';

export interface ScrapedLead {
  id: string;
  platform: ScraperPlatform;
  title: string;
  authorName: string;
  authorTitle?: string;
  companyName?: string;
  postSnippet: string;
  matchedKeyword: string;
  estimatedBudget: number;
  detectedWebsiteType: WebsiteType;
  matchScore: number; // e.g. 98%
  url: string;
  scrapedAt: string;
  injectedToPipeline: boolean;
  injectedProjectId?: string;
  proposalDrafted?: boolean;
}

export interface ScraperConfig {
  keywords: string[];
  platforms: ScraperPlatform[];
  autoInject: boolean;
  minBudget: number;
  isScanningActive: boolean;
  lastScanTime?: string;
  scanIntervalMinutes: number;
}

export interface DripFollowUpStage {
  stage: number;
  delayHours: number;
  label: string;
  purpose: string;
  subject: string;
  bodyTemplate: string;
}

export interface DripHistoryItem {
  id: string;
  stage: number;
  sentAt: string;
  subject: string;
  message: string;
  channel: string;
  triggeredBy: 'automated_scheduler' | 'manual_override';
  status: 'sent' | 'delivered';
}

export interface ProjectDripState {
  enabled: boolean;
  currentStage: number; // 1 to 4
  daysOverdue: number;
  status: 'active' | 'paused' | 'completed' | 'not_started';
  lastSentAt?: string;
  nextScheduledAt?: string;
  history: DripHistoryItem[];
}

export type OutreachFormat = 'linkedin_connect' | 'linkedin_inmail' | 'upwork_proposal' | 'cold_email';

export interface AIOutreachRequest {
  channel: OutreachFormat;
  leadName: string;
  companyName?: string;
  industry?: string;
  websiteType?: WebsiteType;
  problemOrNeed: string;
  portfolioUrl?: string;
  valueHook?: string;
  tone?: 'consultative' | 'value_first' | 'urgent' | 'concise';
}

export interface AIOutreachResponse {
  channel: OutreachFormat;
  connectionRequestSnippet?: string; // Strict < 300 chars for LinkedIn
  connectionCharCount?: number;
  introductoryMessage: string;
  followUpNudge: string;
  recommendedSubject?: string;
  modelUsed: string;
}

// ========================================================
// Phase 2: Unified Communications, Lead Scoring & Analytics
// ========================================================

export type CommunicationChannel = 'linkedin' | 'upwork' | 'email' | 'discord';
export type MessageSentiment = 'positive' | 'hesitant' | 'urgent_pricing' | 'revision_request' | 'dissatisfied' | 'neutral';

export interface AISuggestedReply {
  subject: string;
  body: string;
  ruleApplied: string;
  confidence: number;
}

export interface ClientCommunicationMessage {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  channel: CommunicationChannel;
  projectId?: string;
  subject: string;
  content: string;
  timestamp: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  sentiment: MessageSentiment;
  sentimentScore: number; // 0 - 100
  urgency: 'high' | 'medium' | 'low';
  aiSuggestedReply?: AISuggestedReply;
  replies?: Array<{
    id: string;
    sender: string;
    body: string;
    sentAt: string;
    channel: CommunicationChannel;
  }>;
}

export interface LeadScoreFactors {
  budgetScore: number;    // 0 - 30
  scopeScore: number;     // 0 - 25
  readinessScore: number; // 0 - 20
  urgencyScore: number;   // 0 - 25
}

export interface LeadScore {
  totalScore: number; // 0 - 100
  tierTag: 'hot' | 'warm' | 'cold' | 'vip';
  label: string;
  factors: LeadScoreFactors;
  analysisSummary: string;
  recommendedAction: string;
  analyzedAt: string;
}

export interface ClientFeedbackItem {
  id: string;
  author: string;
  content: string;
  category: 'revision' | 'approval' | 'question' | 'general';
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AnalyticsFilterState {
  dateRange: '7d' | '30d' | 'this_month' | 'quarter' | 'all';
  salesperson: string; // 'all' or specific name
  tier: 'all' | 'tier1' | 'tier2' | 'tier3';
}

export interface HeatmapCell {
  day: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  timeSlot: string; // 'Morning (08-12)', 'Midday (12-16)', 'Afternoon (16-20)', 'Night (20-00)'
  activityCount: number;
  revenueValue: number;
}

// ==========================================
// PHASE 3: ENTERPRISE-GRADE MODULES
// ==========================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'design' | 'development' | 'hosting_setup' | 'maintenance' | 'express_fee';
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'refunded';
export type MilestoneInvoiceType = 'advance_50' | 'balance_50' | 'full_contract';

export interface ProjectInvoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  milestoneType: MilestoneInvoiceType;
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRatePercent: number; // e.g. 0% for international digital export or VAT
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod?: 'paypal' | 'payoneer' | 'bank_wire' | 'stripe';
  transactionId?: string;
  paymentClearedAt?: string;
  receiptNumber?: string;
  notes?: string;
  terms: string;
}

export interface CommissionPayoutRecord {
  id: string;
  projectId: string;
  clientName: string;
  clientCompany?: string;
  dealPrice: number;
  salesperson: string;
  baseTier: 'tier1' | 'tier2' | 'tier3';
  baseRatePercent: number; // 25, 30, 35
  tierBoostBonusPercent: number; // e.g. +5% or +10% for high performers up to 45%
  effectiveRatePercent: number;
  commissionAmount: number;
  status: 'pending_approval' | 'approved' | 'paid' | 'flagged';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  payoutMethod?: string;
  payoutTxRef?: string;
  adminNotes?: string;
}

export interface CommissionAuditLog {
  id: string;
  timestamp: string;
  adminUser: string;
  action: 'approved' | 'paid' | 'tier_boost' | 'rate_adjusted' | 'flagged';
  salesperson: string;
  projectId?: string;
  details: string;
  previousValue?: string | number;
  newValue?: string | number;
}

export interface SalespersonProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  currentTier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'VIP High Performer';
  baseRate: number; // 25, 30, 35
  bonusBoostRate: number; // 0, 5, 10
  effectiveRate: number; // up to 45%
  isBoostApproved: boolean;
  totalDealsClosed: number;
  totalRevenueGenerated: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingPayoutAmount: number;
}

export type NudgeTriggerType = 'advance_deposit_delayed' | 'staging_review_pending' | 'balance_due_handover' | 'inactivity_checkin';
export type NudgeFormat = 'email' | 'whatsapp' | 'discord';

export interface AutomatedNudgeTemplate {
  id: string;
  triggerType: NudgeTriggerType;
  title: string;
  description: string;
  delayHoursThreshold: number;
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
  discordMessage: string;
}

export interface NudgeDispatchLog {
  id: string;
  projectId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  triggerType: NudgeTriggerType;
  channel: NudgeFormat;
  dispatchedAt: string;
  contentSnippet: string;
  dispatchedBy: string;
  deliveryStatus: 'delivered' | 'copied_to_clipboard' | 'opened_in_whatsapp' | 'opened_in_email';
}

// ==========================================
// PHASE 4: ENTERPRISE INTEGRATIONS & BD COMMAND
// ==========================================

export type SupportedCurrency = 'USD' | 'GBP' | 'EUR' | 'AUD' | 'AED';

export type IntegrationChannel = 'upwork' | 'linkedin' | 'whatsapp' | 'gmail' | 'stripe' | 'calendly';

export interface IntegrationConnector {
  id: string;
  channel: IntegrationChannel;
  name: string;
  category: 'lead_generation' | 'messaging' | 'payments' | 'scheduling';
  description: string;
  status: 'connected' | 'syncing' | 'standby' | 'error';
  lastSyncTime: string;
  syncIntervalMinutes: number;
  webhookEndpoint: string;
  eventsHandledCount: number;
  successRatePercent: number;
  activeFeatures: string[];
  configSummary: string;
}

export interface WebhookEventLog {
  id: string;
  timestamp: string;
  source: IntegrationChannel;
  event: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  payloadSnippet?: string;
  impactedProjectId?: string;
}

export type AgencyScaleMode = 'enterprise' | 'boutique' | 'sandbox';

// ==========================================
// PHASE 5: HYBRID & LOCAL-FIRST AI ARCHITECTURE
// ==========================================

export type AIProviderType = 'local' | 'cloud' | 'manual';

export type CloudAIService = 'gemini' | 'groq' | 'openrouter';

export interface AISettings {
  provider: AIProviderType;
  localEndpoint: string;
  localModel: string;
  cloudService: CloudAIService;
  cloudApiKey?: string;
  cloudModel: string;
  temperature: number;
  fallbackToManual: boolean;
  lastConnectionStatus?: 'connected' | 'error' | 'untested';
  lastTestedAt?: string;
  statusMessage?: string;
}

export interface AIGenerationOptions {
  taskType: 'proposal' | 'sentiment' | 'lead_score' | 'reply' | 'outreach' | 'general';
  prompt?: string;
  clientName?: string;
  companyName?: string;
  websiteType?: string;
  channel?: string;
  subject?: string;
  messageContent?: string;
  additionalNotes?: string;
  mode?: string;
  problemOrNeed?: string;
  valueHook?: string;
  tone?: string;
  estimatedBudget?: number;
  industry?: string;
  leadSnippet?: string;
  jobPostTitle?: string;
}

export interface AIGenerationResult {
  success: boolean;
  text: string;
  providerUsed: AIProviderType;
  modelUsed: string;
  isFallback: boolean;
  fallbackReason?: string;
  sentiment?: 'positive' | 'hesitant' | 'urgent_pricing' | 'revision_request' | 'dissatisfied' | 'neutral';
  sentimentScore?: number;
  detectedIntent?: string;
  suggestedSubject?: string;
  ruleApplied?: string;
  connectionRequestSnippet?: string;
  followUpNudge?: string;
}

// ==========================================
// PHASE 6: PRODUCTION RBAC, POSTGRESQL & LIVE WEBHOOKS
// ==========================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
  permissions: string[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export interface DatabaseEngineStatus {
  engine: 'postgresql' | 'local_disk_json';
  connected: boolean;
  latencyMs: number;
  poolSize: number;
  totalRecords: number;
  recordCount?: number;
  databaseSizeBytes?: number;
  host?: string;
  database?: string;
  lastBackupAt: string;
  tables: Array<{
    name: string;
    count: number;
  }>;
}

export interface LiveConnectorConfig {
  channel: IntegrationChannel;
  name: string;
  apiKeyMasked?: string;
  webhookSecretMasked?: string;
  webhookUrl: string;
  isConfigured: boolean;
  status: 'connected' | 'standby' | 'error';
  lastPingAt?: string;
}

export interface ApiToken {
  id: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  rawToken?: string; // only populated upon creation for 1-time copy
  createdBy: string;
  userId?: string;
  permissions?: string[];
  createdAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface InboundLeadPayload {
  clientName?: string;
  name?: string;
  contact_name?: string;
  lead_name?: string;
  clientEmail?: string;
  email?: string;
  clientPhone?: string;
  phone?: string;
  clientCompany?: string;
  company?: string;
  business_name?: string;
  property_title?: string;
  websiteType?: WebsiteType;
  purpose?: string;
  notes?: string;
  description?: string;
  channel?: string;
  source?: string;
  estimatedPrice?: number;
  budget?: number;
  deal_value?: number;
  assignedCollaborators?: string[];
  propertyDetails?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface InboundIngestResponse {
  success: boolean;
  count: number;
  leadIds: string[];
  message: string;
  errors?: string[];
}

// ========================================================
// Sales, Marketing & Business Development (BD) Suite Types
// ========================================================

export type ContractType = 'sow' | 'nda' | 'msa' | 'sla';

export interface GeneratedContract {
  id: string;
  type: ContractType;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectScope: string;
  deliverables: string[];
  timelineWeeks: number;
  totalAmount: number;
  advanceDepositPercent: number; // 50%
  balanceDepositPercent: number; // 50%
  ipOwnershipTerms: string;
  warrantyDays: number;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  signedByClientName?: string;
  signedAt?: string;
  clientSignatureDataUrl?: string;
  agencySignatory: string;
  createdAt: string;
  linkedProjectId?: string;
}

export interface DeveloperRoleAllocation {
  id: string;
  roleTitle: string; // e.g. "Senior Full-Stack Dev", "UI/UX Specialist", "QA Engineer"
  seniority: 'Lead' | 'Senior' | 'Mid' | 'Junior';
  headcount: number;
  hoursPerWeek: number;
  internalHourlyCost: number; // agency internal salary cost
  clientHourlyRate: number; // billing rate to client
}

export interface ProjectCostEstimate {
  id: string;
  projectName: string;
  durationWeeks: number;
  roles: DeveloperRoleAllocation[];
  discountPercent: number;
  totalHours: number;
  totalInternalCost: number;
  totalClientBilling: number;
  grossProfit: number;
  grossMarginPercent: number;
  recommendedFixedPrice: number;
  createdAt: string;
}

export interface TimezoneMeeting {
  id: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientTimezone: string; // e.g. "America/New_York", "Europe/London", "Asia/Dubai"
  hostTimezone: string; // e.g. "Asia/Karachi"
  meetingDate: string; // YYYY-MM-DD
  meetingTime: string; // HH:mm 24h
  durationMinutes: number;
  agendaType: 'discovery' | 'sow_presentation' | 'technical_deepdive' | 'milestone_signoff';
  platform: 'google_meet' | 'zoom' | 'teams';
  meetingUrl: string;
  agendaNotes: string;
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';
  createdAt: string;
}

export type ObjectionCategory = 'pricing' | 'freelancer_comparison' | 'agency_credibility' | 'tech_stack' | 'timeline' | 'maintenance';

export interface SalesBattlecard {
  id: string;
  category: ObjectionCategory;
  objectionTitle: string;
  clientQuerySnippet: string;
  rootPsychology: string; // what the client is actually afraid of
  winningScript: string; // word-for-word counter-objection
  proofPoints: string[];
  whatNotToSay: string;
  recommendedFollowUpQuestion: string;
}

export type IndustryCategory = 'FinTech' | 'HealthTech' | 'SaaS & AI' | 'eCommerce' | 'Real Estate' | 'Logistics';

export interface CaseStudy {
  id: string;
  title: string;
  clientIndustry: IndustryCategory;
  clientRegion: string; // e.g. "United States", "United Kingdom", "Germany"
  techStack: string[];
  heroMetric: string; // e.g. "+340% Conversions in 60 Days", "99.99% Core Uptime"
  overview: string;
  challenge: string;
  solutionArchitecture: string;
  timelineWeeks: number;
  budgetRange: string;
  results: string[];
  testimonialQuote?: string;
  testimonialAuthor?: string;
  previewUrl?: string;
}

export type CampaignChannel = 'clutch' | 'linkedin_inmail' | 'upwork_enterprise' | 'referral_partner' | 'google_inbound' | 'cold_email';

export interface CampaignAttribution {
  id: string;
  channelName: string;
  channelKey: CampaignChannel;
  monthlySpendUSD: number;
  leadsGenerated: number;
  qualifiedDeals: number;
  closedDeals: number;
  totalRevenueUSD: number;
  avgDealSizeUSD: number;
  cacUSD: number; // Customer acquisition cost
  roiMultiplier: number; // e.g. 5.8x
  status: 'active' | 'scaling' | 'optimizing' | 'paused';
}

export type ReviewTargetPlatform = 'clutch' | 'google_review' | 'trustpilot' | 'linkedin_recommendation';

export interface ReviewCampaign {
  id: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectId?: string;
  platform: ReviewTargetPlatform;
  status: 'ready_to_send' | 'sent' | 'reviewed' | 'followup_needed';
  sentDate?: string;
  reviewLink: string;
  targetRating: number;
  preDraftedFeedback: string;
  receivedReviewSnippet?: string;
}

export interface PartnerAgency {
  id: string;
  agencyName: string;
  headquarters: string;
  contactPerson: string;
  contactEmail: string;
  partnershipType: 'white_label_subcontractor' | 'inbound_referral_partner' | 'dev_capacity_pool';
  commissionRatePercent: number; // 10% - 25%
  activeProjectsCount: number;
  totalDealVolumeUSD: number;
  totalCommissionPaidUSD: number;
  ndaStatus: 'signed' | 'pending' | 'expired';
  rating: number; // 1 to 5 stars
  primaryTechStack: string[];
  notes: string;
  status: 'active' | 'under_review' | 'standby';
}

export type RFPCategory = 'security_compliance' | 'qa_testing' | 'ip_escrow' | 'devops_cloud' | 'team_velocity' | 'sla_support';

export interface RFPQuestionAnswer {
  id: string;
  category: RFPCategory;
  tenderPrompt: string; // Question often asked in enterprise RFPs
  verifiedAnswer: string; // Standard pre-approved response
  certifications: string[]; // e.g. "ISO 27001", "SOC 2 Type II", "GDPR"
  keywords: string[];
  lastAuditedDate: string;
}

export interface RetainerAccountHealth {
  id: string;
  clientName: string;
  company: string;
  contactEmail: string;
  activeRetainerType: 'none' | 'basic_maintenance' | 'growth_dev_retainer' | 'dedicated_squad';
  monthlyRetainerFeeUSD: number;
  renewalDate: string;
  healthScore: number; // 1-100
  riskOfChurn: 'low' | 'moderate' | 'critical';
  slaResponseTimeHours: number;
  recommendedUpsell: string;
  upsellPotentialUSD: number;
  lastContactDate: string;
  accountManager: string;
}


