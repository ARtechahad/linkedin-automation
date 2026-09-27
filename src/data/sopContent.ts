/**
 * Standard Operating Procedure Content & Data Models
 * Exactly based on the International Client Handling Guide
 */

export interface SOPItem {
  id: number;
  title: string;
  summary: string;
  keyPoints: string[];
  exampleResponse?: string;
  closingMessage?: string;
  badge: string;
  iconName: string;
}

export const SOP_SECTIONS: SOPItem[] = [
  {
    id: 1,
    title: '1. Initial Client Interaction',
    summary: 'When a new client reaches out through LinkedIn, Upwork, email, or any online channel, always maintain a professional and courteous tone. Begin by thanking them for their interest and briefly introducing our services.',
    badge: 'Sales & Outreach',
    iconName: 'MessageSquare',
    exampleResponse: `“Hello [Client Name],\nThank you for contacting us. I would be happy to understand your website requirements so we can propose the most suitable solution for your business.”`,
    keyPoints: [
      'Acknowledge client messages immediately (Target SLA: < 15 minutes).',
      'What type of website are you looking for? (Business, Portfolio, E-commerce, Blog, etc.)',
      'Do you have any inspiration websites or design references?',
      'What is the primary purpose of your website? (Brand awareness, sales, portfolio display, etc.)'
    ]
  },
  {
    id: 2,
    title: '2. Content and Design Requirements',
    summary: 'Discuss the content and materials required for the project. Ask the client to provide logos, text, and images or offer licensed stock photography and copywriting solutions.',
    badge: 'Asset Discovery',
    iconName: 'Palette',
    exampleResponse: `“If you do not have images or content ready, we can use licensed stock images and help create high-quality text content suitable for your website.”`,
    keyPoints: [
      'Company logo (Vector SVG, AI, or High-Resolution PNG preferred).',
      'Website text/content (Home, About, Services, Contact, Terms).',
      'Images or product photos (High resolution).',
      'If not ready, reassure client: We provide licensed premium stock photos and professional copywriting.'
    ]
  },
  {
    id: 3,
    title: '3. Domain and Hosting',
    summary: 'Clarify the client’s domain and hosting status at an early stage to eliminate technical roadblocks before kickoff.',
    badge: 'Infrastructure',
    iconName: 'Server',
    exampleResponse: `“If you have not yet purchased a domain or hosting, we recommend using Hostinger or Namecheap. Once you have completed the purchase, please share the access details so our team can begin setup.”`,
    keyPoints: [
      'If client has domain & hosting: Request login credentials (GoDaddy, Hostinger, Namecheap, Bluehost, Cloudflare) stored securely in encrypted vault.',
      'If client does NOT have domain & hosting: Recommend trusted platforms (Hostinger, Namecheap, Bluehost) and guide them step-by-step through purchase.',
      'Never demand credentials aggressively; explain that access is required strictly for deployment.'
    ]
  },
  {
    id: 4,
    title: '4. Pricing Guidelines',
    summary: 'Always communicate pricing clearly and professionally. Quote within standardized ranges and confirm final quotes only after comprehensive requirements analysis.',
    badge: 'Pricing & Quotation',
    iconName: 'DollarSign',
    keyPoints: [
      'Landing Page / One-Page Website: $200 – $300 (Single-page site suitable for small businesses, lead generation, or marketing campaigns).',
      'E-commerce Website: $500 – $700 (Includes product catalog, shopping cart, checkout, payment gateway integration, inventory).',
      'Corporate / Large Website (8–9 pages): $800 and above (For larger businesses or organizations requiring multiple custom pages and functionalities).',
      'Important Rule: Final pricing must always be confirmed after understanding the complete specifications.'
    ]
  },
  {
    id: 5,
    title: '5. Payment Terms',
    summary: 'Strict milestone-based payment structure protecting both the team and international clients.',
    badge: 'Finance & Payments',
    iconName: 'CreditCard',
    exampleResponse: `“We typically require a 50% upfront payment to begin the project and the remaining balance upon delivery and approval.”`,
    keyPoints: [
      'Accepted Payment Methods: PayPal and Payoneer.',
      '50% advance payment to officially initiate development and kick-off.',
      '50% balance payment upon project completion and client review approval.',
      'Strict Rule: Under no circumstances is the live website handed over prior to balance clearance.'
    ]
  },
  {
    id: 6,
    title: '6. Commission Structure for Employees',
    summary: 'Performance-based incentive system rewarding sales and client coordination efficiency and consistency.',
    badge: 'Commission Ledger',
    iconName: 'TrendingUp',
    keyPoints: [
      'Project Value <= $300: 25% Employee Commission.',
      'Project Value between $300 and $700: 30% Employee Commission.',
      'Project Value > $700: 35% Employee Commission.',
      'High Performer Bonus: Consistent reliability and quality can increase commission up to 40% – 45% at management discretion.'
    ]
  },
  {
    id: 7,
    title: '7. Project Sharing and Communication',
    summary: 'Once a deal closes, the sales rep must immediately log all client requirements and hand them over to management and dev team on Discord.',
    badge: 'Team Handoff',
    iconName: 'Share2',
    keyPoints: [
      'Project details must be shared through Discord or designated platform.',
      'Mandatory handoff fields: Website type and purpose, Content & design preferences, Domain & hosting details, Agreed price & payment confirmation.',
      'Allows design & development teams to begin work promptly without missing client context.'
    ]
  },
  {
    id: 8,
    title: '8. Project Development and Website Transfer',
    summary: 'Secure staging workflow that protects company IP and ensures flawless delivery.',
    badge: 'Development & Transfer',
    iconName: 'Layers',
    keyPoints: [
      'Step 1: Development team builds the website exclusively on internal staging domain for review and testing.',
      'Step 2: Project is demonstrated to the client on staging for inspection, revision, and approval.',
      'Step 3: Transfer to client’s domain/hosting account ONLY occurs after final 50% payment is verified.',
      'Step 4: Quality assurance checklist completed before marking the project closed.'
    ]
  },
  {
    id: 9,
    title: '9. Project Kick-Off Process',
    summary: 'Standardized sequence following payment receipt to ensure smooth onboarding.',
    badge: 'Kick-Off Protocol',
    iconName: 'CheckCircle',
    keyPoints: [
      '1. Confirm project scope, timeline, and deliverables in writing.',
      '2. Create project tracker (e.g., Google Sheet, Trello, or ClientOps board).',
      '3. Begin design and development according to the agreed plan.',
      '4. Share regular progress updates with the client (every 48 hours).',
      '5. Maintain professional communication at all times.'
    ]
  },
  {
    id: 10,
    title: '10. Communication Standards',
    summary: 'High-touch communication standards representing the company brand internationally.',
    badge: 'Brand Standards',
    iconName: 'ShieldCheck',
    exampleResponse: `“Thank you for confirming the details. Our team will now proceed with the initial design phase. We will keep you updated throughout the process. Please feel free to share feedback at any stage.”`,
    keyPoints: [
      'Use clear, concise, and grammatically correct English.',
      'Acknowledge client messages promptly (never leave a message unread).',
      'Avoid jargon and unnecessary technical terms unless the client is technical.',
      'Keep all communications organized and professional across email, Upwork, and chat.'
    ]
  },
  {
    id: 11,
    title: '11. Post-Project and Client Retention',
    summary: 'Transform completed projects into long-term recurring revenue and high-value referrals.',
    badge: 'Retention & Growth',
    iconName: 'Award',
    keyPoints: [
      'Request feedback or a written/video testimonial from the client.',
      'Offer ongoing monthly maintenance and update retainers ($50 – $150/mo).',
      'Add satisfied clients to the VIP referral list for recurring collaborations.',
      'Building long-term relationships through transparency and reliability is key to sustainable agency growth.'
    ]
  }
];

/**
 * Calculates commission percentage and exact dollar amount based on SOP Section 6
 */
export function calculateCommission(projectValue: number, hasHighPerformanceTier = false): {
  percentage: number;
  amount: number;
  tierName: string;
} {
  let percentage = 25;
  let tierName = 'Standard Tier (≤ $300)';

  if (projectValue <= 300) {
    percentage = hasHighPerformanceTier ? 40 : 25;
    tierName = hasHighPerformanceTier ? 'High Performer Tier (40%)' : 'Tier 1: ≤ $300 (25%)';
  } else if (projectValue <= 700) {
    percentage = hasHighPerformanceTier ? 42 : 30;
    tierName = hasHighPerformanceTier ? 'High Performer Tier (42%)' : 'Tier 2: $300 – $700 (30%)';
  } else {
    percentage = hasHighPerformanceTier ? 45 : 35;
    tierName = hasHighPerformanceTier ? 'High Performer Tier (45%)' : 'Tier 3: > $700 (35%)';
  }

  const amount = Number(((projectValue * percentage) / 100).toFixed(2));
  return { percentage, amount, tierName };
}

/**
 * Generates formatted Discord handoff message as mandated in SOP Section 7
 */
export function generateDiscordHandoffText(project: {
  clientName: string;
  clientCompany?: string;
  websiteType: string;
  purpose: string;
  estimatedPrice: number;
  finalPrice: number;
  advancePaid: boolean;
  paymentMethod: string;
  hostingStatus: string;
  hostingProvider?: string;
  assignedSalesperson: string;
  inspirationUrls?: string[];
}): string {
  return `📢 **NEW CLOSED CLIENT HANDOFF (SOP STEP 7)**
--------------------------------------------------
👤 **Client Name:** ${project.clientName} ${project.clientCompany ? `(${project.clientCompany})` : ''}
💼 **Sales Representative:** ${project.assignedSalesperson}
🌐 **Website Type:** ${project.websiteType.toUpperCase()}
🎯 **Primary Purpose:** ${project.purpose}
💰 **Agreed Pricing:** $${project.finalPrice || project.estimatedPrice} USD
💳 **Payment Status:** ${project.advancePaid ? '✅ 50% Advance Received' : '⏳ Advance Pending'} (${project.paymentMethod.toUpperCase()})
🖥️ **Domain & Hosting:** ${project.hostingStatus.replace('_', ' ').toUpperCase()} ${project.hostingProvider ? `(${project.hostingProvider})` : ''}
🔗 **Design References:** ${project.inspirationUrls?.length ? project.inspirationUrls.join(', ') : 'None provided'}
📋 **Next Action:** Coordinator to confirm scope in writing & schedule internal staging build (Step 8 & 9).
--------------------------------------------------`;
}
