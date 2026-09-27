import {
  GeneratedContract,
  DeveloperRoleAllocation,
  ProjectCostEstimate,
  TimezoneMeeting,
  SalesBattlecard,
  CaseStudy,
  CampaignAttribution,
  ReviewCampaign,
  PartnerAgency,
  RFPQuestionAnswer,
  RetainerAccountHealth
} from '../types';

export const INITIAL_ROLE_BENCHMARKS: DeveloperRoleAllocation[] = [
  {
    id: 'role-1',
    roleTitle: 'Lead Architect / Tech Lead',
    seniority: 'Lead',
    headcount: 1,
    hoursPerWeek: 40,
    internalHourlyCost: 28,
    clientHourlyRate: 75
  },
  {
    id: 'role-2',
    roleTitle: 'Senior Full-Stack Engineer (React/Node/Next)',
    seniority: 'Senior',
    headcount: 2,
    hoursPerWeek: 40,
    internalHourlyCost: 20,
    clientHourlyRate: 55
  },
  {
    id: 'role-3',
    roleTitle: 'Mid-Level Full-Stack Engineer',
    seniority: 'Mid',
    headcount: 1,
    hoursPerWeek: 40,
    internalHourlyCost: 14,
    clientHourlyRate: 40
  },
  {
    id: 'role-4',
    roleTitle: 'Product Designer (UI/UX & Design System)',
    seniority: 'Senior',
    headcount: 1,
    hoursPerWeek: 25,
    internalHourlyCost: 18,
    clientHourlyRate: 50
  },
  {
    id: 'role-5',
    roleTitle: 'QA Automation Engineer',
    seniority: 'Mid',
    headcount: 1,
    hoursPerWeek: 20,
    internalHourlyCost: 12,
    clientHourlyRate: 35
  },
  {
    id: 'role-6',
    roleTitle: 'DevOps & Cloud Architect (AWS/GCP/Docker)',
    seniority: 'Senior',
    headcount: 1,
    hoursPerWeek: 15,
    internalHourlyCost: 22,
    clientHourlyRate: 65
  }
];

export const INITIAL_ESTIMATES: ProjectCostEstimate[] = [
  {
    id: 'est-101',
    projectName: 'FinTech Micro-Lending Portal & Mobile App',
    durationWeeks: 8,
    roles: [
      { id: 'r1', roleTitle: 'Senior Full-Stack Engineer', seniority: 'Senior', headcount: 2, hoursPerWeek: 40, internalHourlyCost: 20, clientHourlyRate: 55 },
      { id: 'r2', roleTitle: 'UI/UX Specialist', seniority: 'Senior', headcount: 1, hoursPerWeek: 25, internalHourlyCost: 18, clientHourlyRate: 50 },
      { id: 'r3', roleTitle: 'QA Automation Specialist', seniority: 'Mid', headcount: 1, hoursPerWeek: 20, internalHourlyCost: 12, clientHourlyRate: 35 }
    ],
    discountPercent: 5,
    totalHours: 1000,
    totalInternalCost: 17440,
    totalClientBilling: 47250,
    grossProfit: 29810,
    grossMarginPercent: 63.09,
    recommendedFixedPrice: 44887,
    createdAt: '2026-09-15'
  }
];

export const INITIAL_CONTRACTS: GeneratedContract[] = [
  {
    id: 'sow-2026-01',
    type: 'sow',
    title: 'Statement of Work: Enterprise SaaS Dashboard & API Engine',
    clientName: 'Julian Vance',
    clientCompany: 'Vance Capital Partners LLC',
    clientEmail: 'julian@vancecap.com',
    projectScope: 'End-to-end custom development of high-frequency investment deal dashboard with real-time Firestore persistence, role-based access control, and automated financial appraisal reports.',
    deliverables: [
      'Interactive deal pipeline with live status tracking and drag-and-drop workflow',
      'Unified multi-channel inbox integration with automated drip sequences',
      'Staging server deployment on internal agency domain for isolated testing',
      'Zero-downtime domain DNS handover upon verified 50% balance settlement (SOP Rule 8)'
    ],
    timelineWeeks: 6,
    totalAmount: 18500,
    advanceDepositPercent: 50,
    balanceDepositPercent: 50,
    ipOwnershipTerms: '100% intellectual property, full Git repository history, and deployment assets transfer irrevocably to Client upon final 50% milestone clearance.',
    warrantyDays: 90,
    status: 'signed',
    signedByClientName: 'Julian Vance (Managing Partner)',
    signedAt: '2026-09-12T14:30:00Z',
    clientSignatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="40" font-family="cursive" font-size="28" fill="%234f46e5">Julian Vance</text></svg>',
    agencySignatory: 'CEO & Principal Architect',
    createdAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'nda-2026-02',
    type: 'nda',
    title: 'Mutual Non-Disclosure & Proprietary Data Protection Agreement',
    clientName: 'Dr. Sarah Jenkins',
    clientCompany: 'NeuroPulse HealthTech UK',
    clientEmail: 's.jenkins@neuropulse.co.uk',
    projectScope: 'Evaluation and architecture discovery of proprietary HIPAA-compliant tele-consultation and biometric sync mobile application.',
    deliverables: [
      'Protected confidential disclosure of technical system schematics',
      'Strict two-way non-disclosure of user metrics and algorithms',
      'Enforceable IP protection during pre-contract scoping'
    ],
    timelineWeeks: 52,
    totalAmount: 0,
    advanceDepositPercent: 0,
    balanceDepositPercent: 0,
    ipOwnershipTerms: 'All proprietary medical datasets and clinical records remain the exclusive sole property of NeuroPulse HealthTech UK.',
    warrantyDays: 365,
    status: 'draft',
    agencySignatory: 'Legal Operations Counsel',
    createdAt: '2026-09-16T11:20:00Z'
  }
];

export const INITIAL_MEETINGS: TimezoneMeeting[] = [
  {
    id: 'mtg-301',
    title: 'Discovery & Architectural Scoping Call',
    clientName: 'Marcus Sterling',
    clientEmail: 'marcus@sterlinglogistics.com',
    clientCompany: 'Sterling Freight Global (Houston, TX)',
    clientTimezone: 'America/Chicago',
    hostTimezone: 'Asia/Karachi',
    meetingDate: '2026-09-21',
    meetingTime: '15:00',
    durationMinutes: 45,
    agendaType: 'discovery',
    platform: 'google_meet',
    meetingUrl: 'https://meet.google.com/xyz-agency-scoping',
    agendaNotes: 'Discuss dispatch routing portal, telematics API ingestion, and 8-week MVP roadmap.',
    status: 'scheduled',
    createdAt: '2026-09-17T09:00:00Z'
  },
  {
    id: 'mtg-302',
    title: 'SOW Presentation & Milestone Commercial Review',
    clientName: 'Eleanor Wright',
    clientEmail: 'eleanor@wrightfintech.co.uk',
    clientCompany: 'Wright Capital (London, UK)',
    clientTimezone: 'Europe/London',
    hostTimezone: 'Asia/Karachi',
    meetingDate: '2026-09-22',
    meetingTime: '14:30',
    durationMinutes: 30,
    agendaType: 'sow_presentation',
    platform: 'zoom',
    meetingUrl: 'https://zoom.us/j/9482910385',
    agendaNotes: 'Review 50% advance deposit terms, staging review demo timeline, and dev team composition.',
    status: 'scheduled',
    createdAt: '2026-09-17T11:45:00Z'
  }
];

export const SALES_BATTLECARDS: SalesBattlecard[] = [
  {
    id: 'bc-1',
    category: 'pricing',
    objectionTitle: '"Your agency quote is higher than other quotes we received"',
    clientQuerySnippet: 'We have quotes from freelancers or agencies proposing $3,000 for what you quoted $12,000.',
    rootPsychology: 'Fear of overpaying or being taken advantage of, combined with inability to differentiate surface-level coding from production-ready architecture.',
    winningScript: 'I completely respect that budget is critical for your team. Here is what that difference actually buys: With budget quotes, 70% of clients come to us 4 months later to rewrite the codebase because of zero test coverage, unmaintainable spaghetti code, and security vulnerabilities that prevent them from scaling. Our fee includes dedicated senior engineers, 90-day bug warranty, full CI/CD deployment on staging, and isolated IP protection under a registered entity. Would you rather pay once for guaranteed delivery, or pay twice to fix a broken launch?',
    proofPoints: [
      'Zero-downtime deployment & strict SOP QA staging tests',
      '90-day post-launch warranty with dedicated engineer on standby',
      '99.8% on-time milestone delivery track record across 40+ international launches'
    ],
    whatNotToSay: 'Do NOT say "You get what you pay for" or insult the cheaper provider. Do NOT offer an instant 40% discount—that destroys your credibility.',
    recommendedFollowUpQuestion: 'If budget is fixed at $3,000, which 3 core features would you be willing to sacrifice so we can deliver enterprise-grade quality on a phased MVP?'
  },
  {
    id: 'bc-2',
    category: 'freelancer_comparison',
    objectionTitle: '"Why should we hire your agency instead of an Upwork freelancer?"',
    clientQuerySnippet: 'I can hire a top-rated freelancer on Upwork for $25/hour. Why work with your agency?',
    rootPsychology: 'Desire for direct control and cost savings, but ignorance of single-point-of-failure risk (freelancer disappearing or getting sick).',
    winningScript: 'Upwork has talented individuals, but a single freelancer is a single point of failure. If they get sick, take another full-time job, or hit an architecture roadblock in DevOps, your entire product launch halts. When you partner with us, you are not hiring an individual; you are securing an entire managed infrastructure. If a developer is unavailable, our team lead immediately steps in. You get UI/UX, DevOps, QA, and project management in one unified retainer without needing to manage 4 independent contractors yourself.',
    proofPoints: [
      'Multi-disciplinary squad with QA & DevOps redundancy',
      'Dedicated project coordinator delivering weekly sprint demo video audits',
      'Escrow-grade security and audited Git repositories'
    ],
    whatNotToSay: 'Never say "Freelancers are unreliable." Focus on system redundancy, managed oversight, and risk mitigation.',
    recommendedFollowUpQuestion: 'How much time per week do you personally have to manage Jira tickets, QA test pull requests, and configure cloud servers?'
  },
  {
    id: 'bc-3',
    category: 'agency_credibility',
    objectionTitle: '"We’ve been burned by offshore dev agencies in the past"',
    clientQuerySnippet: 'We hired an overseas agency before and they overpromised, missed deadlines, and gave us code we could not use.',
    rootPsychology: 'Past trauma, loss of thousands of dollars, and fear of looking foolish to internal leadership or investors.',
    winningScript: 'I hear this constantly, and frankly, you have every right to be guarded. The traditional agency model failed because they took 100% upfront or disappeared for 3 months without transparency. We operate under a strict 11-step SOP designed specifically to eliminate your risk: First, we only ask for 50% advance to initiate the sprint; the remaining 50% is strictly locked until you test and approve the working product on our staging environment. Second, you receive weekly live Loom demo audits and direct Slack/Discord access to the engineering squad.',
    proofPoints: [
      'Staging gate: You test the working application before paying final balance',
      'Recorded weekly Loom sprint demos with transparent Git commits',
      'Real verifiable client references in US, UK, and Europe'
    ],
    whatNotToSay: 'Do NOT dismiss their previous experience or blame the other agency. Validate their caution and show the structural SOP safeguards.',
    recommendedFollowUpQuestion: 'Would it give you peace of mind to speak directly with one of our existing clients in your timezone before we sign?'
  },
  {
    id: 'bc-4',
    category: 'timeline',
    objectionTitle: '"Can you build this entire platform in 2 weeks?"',
    clientQuerySnippet: 'Our marketing launch is in 14 days. We need everything live by then.',
    rootPsychology: 'Urgency driven by an external deadline (trade show, investor meeting, marketing campaign) that is disconnected from software reality.',
    winningScript: 'If another agency promised you this full scope in 2 weeks, they are either lying or planning to hand you a non-functional mock template. To protect your brand from a disastrous launch that crashes on day one, here is our tactical solution: We execute a High-Impact Launch MVP in 14 days covering the critical conversion flow (user signup, payment, and core feature). We run marketing traffic to that, while sprint 2 delivers the secondary settings and dashboard modules 2 weeks later. This hits your deadline without cutting architectural corners.',
    proofPoints: [
      'Phased Agile MVP delivery schedule prevents public launch failures',
      'Automated testing pipeline ensures zero checkout or signup regressions',
      'Rapid design sprint prototype ready within 72 hours'
    ],
    whatNotToSay: 'Never say a flat "No, that is impossible" without offering a phased MVP alternative.',
    recommendedFollowUpQuestion: 'What is the single most critical action a user MUST be able to complete on launch day to consider the event a success?'
  }
];

export const INITIAL_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs-01',
    title: 'AuraPay: High-Throughput Cross-Border Remittance Portal',
    clientIndustry: 'FinTech',
    clientRegion: 'London, United Kingdom',
    techStack: ['Next.js 15', 'TypeScript', 'Node.js', 'PostgreSQL', 'Stripe Connect', 'Tailwind CSS'],
    heroMetric: '+310% Processing Volume in 90 Days',
    overview: 'Engineered an institutional-grade cross-border remittance dashboard enabling real-time currency exchange, multi-currency wallets, and KYC onboarding.',
    challenge: 'Legacy system suffered from 4.2-second page loads, drop-offs during identity verification, and manual reconciliation between Payoneer and UK banking APIs.',
    solutionArchitecture: 'Built a resilient event-driven architecture using Next.js App Router, edge middleware for zero-latency geo-routing, and automated KYC webhook verification.',
    timelineWeeks: 7,
    budgetRange: '$18,000 - $24,000',
    results: [
      'Average checkout completion time plummeted from 3.8 minutes to 48 seconds',
      'Reduced drop-off rate at KYC onboarding step by 68%',
      'Handled over $4.2M in annualized volume with 99.98% uptime'
    ],
    testimonialQuote: 'The team did not just write code; they re-architected our entire customer onboarding pipeline. Best software partnership we have ever made.',
    testimonialAuthor: 'Alistair Ross, Head of Product @ AuraPay UK'
  },
  {
    id: 'cs-02',
    title: 'MedixAI: Clinical Diagnostic Workflow & Patient Portal',
    clientIndustry: 'HealthTech',
    clientRegion: 'Boston, MA, United States',
    techStack: ['React', 'FastAPI', 'Python', 'Docker', 'FHIR / HIPAA Security', 'PostgreSQL'],
    heroMetric: 'Reduced Physician Charting Time by 55%',
    overview: 'Developed a HIPAA-compliant clinical consultation workstation integrating voice-to-text medical notes and automatic ICD-10 billing code generation.',
    challenge: 'Physicians were spending 2.5 hours per evening typing clinical summaries into antiquated Electronic Health Record systems.',
    solutionArchitecture: 'Created an encrypted desktop and tablet responsive interface with WebSockets for instantaneous real-time transcription and secure cloud storage.',
    timelineWeeks: 9,
    budgetRange: '$28,000 - $35,000',
    results: [
      'Adopted by 45 specialty clinics within the first 6 months',
      'Full HIPAA audit passed with zero high-severity findings',
      'Client secured $2.5M Series Seed following production deployment'
    ],
    testimonialQuote: 'Phenomenal speed and architectural discipline. Their understanding of security protocols made institutional compliance effortless.',
    testimonialAuthor: 'Dr. Rebecca Chen, Chief Medical Officer'
  },
  {
    id: 'cs-03',
    title: 'KargoFleet: Autonomous Logistics Dispatch & Telematics',
    clientIndustry: 'Logistics',
    clientRegion: 'Frankfurt, Germany',
    techStack: ['React', 'Node.js', 'Redis', 'WebSockets', 'Mapbox GL', 'Tailwind CSS'],
    heroMetric: '€140,000 Annual Fuel Savings via Dynamic Routing',
    overview: 'Custom telematics portal tracking 350+ commercial freight trucks across Central Europe with automated load matching and driver dispatch.',
    challenge: 'Dispatchers were managing routes via disconnected spreadsheets and WhatsApp groups, causing empty backhauls and communication delays.',
    solutionArchitecture: 'Engineered a real-time reactive canvas dashboard displaying live vehicle GPS telemetry, weather alerts, and one-click WhatsApp dispatch dispatching.',
    timelineWeeks: 8,
    budgetRange: '$22,000 - $30,000',
    results: [
      'Decreased empty return trips by 22% across fleet operations',
      'Real-time position updates sub-200ms across 4G cellular links',
      'Dispatcher efficiency doubled from 15 trucks per agent to 32 trucks per agent'
    ],
    testimonialQuote: 'Delivered ahead of schedule. The staging environment allowed our European drivers to test in real conditions before launch.',
    testimonialAuthor: 'Henrik Weber, VP of Operations'
  }
];

export const INITIAL_CAMPAIGNS: CampaignAttribution[] = [
  {
    id: 'camp-1',
    channelName: 'Clutch.co Sponsored Category Leader',
    channelKey: 'clutch',
    monthlySpendUSD: 1800,
    leadsGenerated: 19,
    qualifiedDeals: 11,
    closedDeals: 4,
    totalRevenueUSD: 54000,
    avgDealSizeUSD: 13500,
    cacUSD: 450,
    roiMultiplier: 30.0,
    status: 'scaling'
  },
  {
    id: 'camp-2',
    channelName: 'LinkedIn Sales Navigator & Custom InMail',
    channelKey: 'linkedin_inmail',
    monthlySpendUSD: 650,
    leadsGenerated: 34,
    qualifiedDeals: 14,
    closedDeals: 3,
    totalRevenueUSD: 31500,
    avgDealSizeUSD: 10500,
    cacUSD: 216,
    roiMultiplier: 48.4,
    status: 'active'
  },
  {
    id: 'camp-3',
    channelName: 'Upwork Enterprise Direct Inbound',
    channelKey: 'upwork_enterprise',
    monthlySpendUSD: 350,
    leadsGenerated: 26,
    qualifiedDeals: 12,
    closedDeals: 5,
    totalRevenueUSD: 28000,
    avgDealSizeUSD: 5600,
    cacUSD: 70,
    roiMultiplier: 80.0,
    status: 'active'
  },
  {
    id: 'camp-4',
    channelName: 'Strategic VC & Agency Referral Network',
    channelKey: 'referral_partner',
    monthlySpendUSD: 1200, // rev-share finder payouts
    leadsGenerated: 8,
    qualifiedDeals: 7,
    closedDeals: 4,
    totalRevenueUSD: 62000,
    avgDealSizeUSD: 15500,
    cacUSD: 300,
    roiMultiplier: 51.6,
    status: 'scaling'
  },
  {
    id: 'camp-5',
    channelName: 'Hyper-Personalized Cold Email Drip',
    channelKey: 'cold_email',
    monthlySpendUSD: 400,
    leadsGenerated: 22,
    qualifiedDeals: 8,
    closedDeals: 2,
    totalRevenueUSD: 16000,
    avgDealSizeUSD: 8000,
    cacUSD: 200,
    roiMultiplier: 40.0,
    status: 'optimizing'
  }
];

export const INITIAL_REVIEWS: ReviewCampaign[] = [
  {
    id: 'rev-01',
    clientName: 'Julian Vance',
    clientCompany: 'Vance Capital Partners',
    clientEmail: 'julian@vancecap.com',
    platform: 'clutch',
    status: 'reviewed',
    sentDate: '2026-09-14',
    reviewLink: 'https://clutch.co/profile/agency-review-submit',
    targetRating: 5,
    preDraftedFeedback: 'The engineering team executed our investment analytics platform with pristine architectural discipline. The 50/50 payment milestone and staging demo gave us complete security.',
    receivedReviewSnippet: 'Outstanding technical execution. Delivered on staging, zero bugs in QA, and seamless live domain transfer. Will engage for our next portfolio company.'
  },
  {
    id: 'rev-02',
    clientName: 'Marcus Sterling',
    clientCompany: 'Sterling Logistics',
    clientEmail: 'marcus@sterlinglogistics.com',
    platform: 'google_review',
    status: 'ready_to_send',
    reviewLink: 'https://g.page/r/your-agency-review',
    targetRating: 5,
    preDraftedFeedback: 'Rebuilt our multi-stop route optimization portal. Highly responsive team across timezones and transparent weekly video demos.'
  }
];

export const INITIAL_PARTNERS: PartnerAgency[] = [
  {
    id: 'prt-01',
    agencyName: 'Vance Capital Ventures',
    headquarters: 'New York, USA',
    contactPerson: 'Julian Vance',
    contactEmail: 'julian@vancecap.com',
    partnershipType: 'white_label_subcontractor',
    commissionRatePercent: 15,
    activeProjectsCount: 2,
    totalDealVolumeUSD: 48500,
    totalCommissionPaidUSD: 7275,
    ndaStatus: 'signed',
    rating: 5,
    primaryTechStack: ['React', 'Next.js', 'FinTech APIs', 'Stripe'],
    notes: 'Primary white-label tech provider for their US portfolio companies.',
    status: 'active'
  },
  {
    id: 'prt-02',
    agencyName: 'Apex Digital UK',
    headquarters: 'London, UK',
    contactPerson: 'Oliver Hughes',
    contactEmail: 'oliver@apexdigital.co.uk',
    partnershipType: 'inbound_referral_partner',
    commissionRatePercent: 10,
    activeProjectsCount: 1,
    totalDealVolumeUSD: 24000,
    totalCommissionPaidUSD: 2400,
    ndaStatus: 'signed',
    rating: 4.8,
    primaryTechStack: ['Shopify Plus', 'Custom Headless Next.js', 'Node.js'],
    notes: 'Refers custom web development overflow that exceeds their internal UK capacity.',
    status: 'active'
  },
  {
    id: 'prt-03',
    agencyName: 'Nordic Tech Labs',
    headquarters: 'Stockholm, Sweden',
    contactPerson: 'Freja Lindqvist',
    contactEmail: 'freja@nordictechlabs.se',
    partnershipType: 'dev_capacity_pool',
    commissionRatePercent: 12,
    activeProjectsCount: 1,
    totalDealVolumeUSD: 19500,
    totalCommissionPaidUSD: 2340,
    ndaStatus: 'signed',
    rating: 4.9,
    primaryTechStack: ['Python', 'FastAPI', 'React', 'Cloud Native'],
    notes: 'Subcontracts senior Python/React squad on dedicated 6-month contracts.',
    status: 'active'
  }
];

export const INITIAL_RFP_KNOWLEDGE: RFPQuestionAnswer[] = [
  {
    id: 'rfp-01',
    category: 'security_compliance',
    tenderPrompt: 'What security standards and compliance protocols does your development team enforce for user data and credentials?',
    verifiedAnswer: 'We enforce strict Zero-Trust Architecture and OWASP Top 10 security standards across all client deliverables. All credentials and API keys are strictly restricted to server-side environments and never bundled in client builds. Data in transit is encrypted using TLS 1.3, and data at rest utilizes AES-256 encryption. We support automated role-based access control (RBAC), sanitized SQL/NoSQL parameterization to prevent injection, and strict Content Security Policies (CSP).',
    certifications: ['SOC 2 Type II Compatible', 'GDPR Compliant', 'OWASP Top 10 Audited'],
    keywords: ['encryption', 'AES-256', 'TLS 1.3', 'RBAC', 'GDPR', 'OWASP'],
    lastAuditedDate: '2026-09-01'
  },
  {
    id: 'rfp-02',
    category: 'ip_escrow',
    tenderPrompt: 'Who retains intellectual property rights to the source code, databases, and custom assets developed during the contract?',
    verifiedAnswer: 'Upon clearance of agreed contractual milestones, 100% of all intellectual property, source code, database architectures, documentation, and design assets are irrevocably assigned and transferred to the Client. We do not use proprietary vendor lock-in frameworks; everything is built using standard, modern open-source stacks (e.g. Next.js, TypeScript, PostgreSQL) and transferred directly to the client’s GitHub / GitLab organization.',
    certifications: ['Full IP Assignment Clause', 'Clean Git History Transfer', 'No Vendor Lock-In'],
    keywords: ['IP ownership', 'code transfer', 'GitHub', 'escrow', 'open-source'],
    lastAuditedDate: '2026-08-20'
  },
  {
    id: 'rfp-03',
    category: 'qa_testing',
    tenderPrompt: 'Describe your Quality Assurance (QA), automated testing, and regression testing methodologies prior to production releases.',
    verifiedAnswer: 'Our development workflow operates under an automated CI/CD pipeline where every pull request requires automated linting, unit test execution, and static type-checking. Pre-release testing takes place in an isolated staging environment that mirrors production data schemas. Every release is gated by an automated 17-point SOP regression test suite validating HTTPS certificates, cross-browser responsiveness, payment webhooks, and zero-console-error policies before domain migration.',
    certifications: ['Automated CI/CD', 'Staging Isolation', 'Zero Regression Gate'],
    keywords: ['QA', 'regression', 'automated testing', 'CI/CD', 'staging'],
    lastAuditedDate: '2026-09-10'
  },
  {
    id: 'rfp-04',
    category: 'devops_cloud',
    tenderPrompt: 'What is your disaster recovery strategy, uptime SLA target, and automated backup protocol?',
    verifiedAnswer: 'We target a 99.9% uptime Service Level Agreement (SLA). Production database clusters are configured with automated daily point-in-time recovery (PITR) snapshots retained for 30 days across multi-region geographic backups. Containerized services deploy via blue-green zero-downtime rollouts, allowing instantaneous rollback to the previous stable release hash within 60 seconds if runtime anomalies are detected.',
    certifications: ['99.9% Uptime SLA', 'Multi-Region Backups', 'Automated Rollback'],
    keywords: ['disaster recovery', 'SLA', 'backups', 'blue-green', 'uptime'],
    lastAuditedDate: '2026-09-05'
  },
  {
    id: 'rfp-05',
    category: 'team_velocity',
    tenderPrompt: 'How does your agency manage sprint velocity, client visibility, and change request scoping?',
    verifiedAnswer: 'We practice two-week Agile sprint cycles. Clients receive real-time visibility through a dedicated client portal, weekly recorded Loom video sprint audits, and bi-weekly milestone demonstrations. Any new feature requests outside the agreed Statement of Work (SOW) are formally documented in an Architectural Change Order (ACO) detailing the exact hours and budget delta before coding commences, ensuring zero surprise invoices.',
    certifications: ['Agile Scrum Framework', 'Weekly Loom Audits', 'Transparent Change Orders'],
    keywords: ['Agile', 'sprint velocity', 'change order', 'Loom', 'scrum'],
    lastAuditedDate: '2026-08-30'
  }
];

export const INITIAL_RETAINERS: RetainerAccountHealth[] = [
  {
    id: 'ret-1',
    clientName: 'Julian Vance',
    company: 'Vance Capital Partners',
    contactEmail: 'julian@vancecap.com',
    activeRetainerType: 'growth_dev_retainer',
    monthlyRetainerFeeUSD: 2500,
    renewalDate: '2026-10-01',
    healthScore: 96,
    riskOfChurn: 'low',
    slaResponseTimeHours: 2,
    recommendedUpsell: 'AI Investment Memorandum Auto-Generator add-on ($6,000 one-off + $500/mo)',
    upsellPotentialUSD: 6000,
    lastContactDate: '2026-09-15',
    accountManager: 'Sales Specialist & BD Lead'
  },
  {
    id: 'ret-2',
    clientName: 'Marcus Sterling',
    company: 'Sterling Freight Global',
    contactEmail: 'marcus@sterlinglogistics.com',
    activeRetainerType: 'basic_maintenance',
    monthlyRetainerFeeUSD: 850,
    renewalDate: '2026-10-15',
    healthScore: 88,
    riskOfChurn: 'low',
    slaResponseTimeHours: 4,
    recommendedUpsell: 'Driver Mobile Companion PWA with offline GPS tracking ($8,500)',
    upsellPotentialUSD: 8500,
    lastContactDate: '2026-09-12',
    accountManager: 'Technical Coordinator'
  },
  {
    id: 'ret-3',
    clientName: 'Eleanor Wright',
    company: 'Wright Capital UK',
    contactEmail: 'eleanor@wrightfintech.co.uk',
    activeRetainerType: 'none',
    monthlyRetainerFeeUSD: 0,
    renewalDate: '2026-09-30',
    healthScore: 72,
    riskOfChurn: 'moderate',
    slaResponseTimeHours: 24,
    recommendedUpsell: 'Enterprise Security & Quarterly Penetration Test Retainer ($1,200/mo)',
    upsellPotentialUSD: 14400,
    lastContactDate: '2026-09-08',
    accountManager: 'Head of BD'
  }
];
