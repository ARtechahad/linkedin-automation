/**
 * Google Docs REST API Client Service
 * 
 * Provides automated proposal and contract generation, cloud document linking,
 * and bi-directional meeting notes/brief synchronization via Google Docs v1 API.
 */

import { getAccessToken } from '../lib/firebase';
import { ProjectLead } from '../types';

export interface GeneratedGoogleDoc {
  documentId: string;
  title: string;
  documentUrl: string;
  createdAt: string;
}

class GoogleDocsService {
  private async fetchGoogleApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google authentication required. Please connect your Google Workspace account.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      throw new Error('Google OAuth token expired or revoked. Please sign in again.');
    }

    return res;
  }

  /**
   * 1. Create a blank Google Document
   */
  public async createBlankDocument(title: string): Promise<{ documentId: string; title: string }> {
    const res = await this.fetchGoogleApi('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create Google Doc (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      documentId: data.documentId,
      title: data.title
    };
  }

  /**
   * 2. Insert formatted text content into Google Document
   */
  public async insertContent(documentId: string, text: string, index: number = 1): Promise<void> {
    const body = {
      requests: [
        {
          insertText: {
            location: { index },
            text
          }
        }
      ]
    };

    const res = await this.fetchGoogleApi(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to insert text in Google Doc (HTTP ${res.status})`);
    }
  }

  /**
   * 3. Generate a complete, professional Agency Service Agreement & Scope Proposal
   */
  public async generateProposalForProject(project: ProjectLead): Promise<GeneratedGoogleDoc> {
    const company = project.clientCompany || project.clientName;
    const docTitle = `Service Agreement & Proposal - ${company} (${project.id})`;

    // 1. Create new doc
    const created = await this.createBlankDocument(docTitle);
    const documentId = created.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Draft comprehensive agreement
    const agreementBody = `
================================================================================
AGENCYOPS INTERNATIONAL - CLIENT SERVICE AGREEMENT & PROJECT PROPOSAL
Ref ID: ${project.id} | Generated: ${new Date().toLocaleDateString()}
================================================================================

1. PARTIES & ENGAGEMENT OVERVIEW
--------------------------------------------------------------------------------
Client Name:        ${project.clientName}
Company / Brand:    ${company}
Client Email:       ${project.clientEmail || 'N/A'}
Client Phone:       ${project.clientPhone || 'N/A'}
Acquisition Channel:${(project.channel || 'Direct').toUpperCase()}
Project Manager:    ${project.assignedSalesperson || 'Agency Operations Lead'}
Target Timeline:    ${project.timelineDays || 14} Business Days

2. STATEMENT OF WORK (SOW) & TECHNICAL SCOPE
--------------------------------------------------------------------------------
Website Scope Type: ${(project.websiteType || 'Landing Page').toUpperCase()}
Agreed Purpose:     ${project.purpose || 'High-converting custom web architecture designed for international clientele.'}
Asset Specifications:
- Logo & Brand Assets: ${project.hasLogo ? 'Supplied by Client' : 'Agency Design Needed'}
- Content & Copywriting: ${project.hasContent ? 'Client Provided' : project.needsContentWriting ? 'Professional Copywriting Package' : 'Placeholder/Standard'}
- Stock Imagery: ${project.useStockPhotos ? 'High-Resolution Curated Stock Included' : 'Custom Assets'}
- Staging Preview Server: ${project.stagingUrl || 'https://staging.agencyops.dev/' + project.id}

3. FINANCIAL TERMS & PAYMENT MILESTONES (STRICT SOP POLICY)
--------------------------------------------------------------------------------
Total Agreed Contract Value:   $${project.finalPrice.toFixed(2)} USD

Payment Breakdown:
- Milestone 1: 50% Advance Deposit:  $${(project.finalPrice * 0.5).toFixed(2)} USD (${project.advancePaid ? 'CLEARED' : 'PENDING'})
  * Mandatory initiation gate: No development begins prior to clearance.
- Milestone 2: 50% Balance Payment:  $${(project.finalPrice * 0.5).toFixed(2)} USD (${project.balancePaid ? 'CLEARED' : 'PENDING'})
  * Final release gate: Staging QA must be signed off, and balance cleared before production domain cutover.

4. 11-STEP OPERATIONAL SOP PIPELINE
--------------------------------------------------------------------------------
Step 1: Lead Verification & Acquisition Channel Intake
Step 2: 50% Advance Deposit Payment Cleared
Step 3: Domain & Hosting Infrastructure Setup
Step 4: Scope & Wireframe Prototype Approval
Step 5: Content, Logo & Digital Brand Assets Ingestion
Step 6: Staging Preview Server Deployment
Step 7: Discord Handover & Team Workspace Sharing
Step 8: Strict Technical QA & Browser Cross-Testing
Step 9: Final 50% Balance Payment Cleared
Step 10: Production DNS Cutover & Domain Ownership Transfer
Step 11: 30-Day Warranty Kickoff & Commission Clearance

5. POST-LAUNCH WARRANTY & SUPPORT
--------------------------------------------------------------------------------
All deliverables include 30 Calendar Days of comprehensive bug fixes, browser updates,
and responsive QA warranty post-launch.

6. AUTHORIZATION & SIGN-OFF
--------------------------------------------------------------------------------
Agency Representative: _______________________      Date: _______________
Client Representative: _______________________      Date: _______________

================================================================================
Generated via AgencyOps Google Workspace Deep Integration Suite
`;

    // 3. Inject text
    await this.insertContent(documentId, agreementBody, 1);

    return {
      documentId,
      title: docTitle,
      documentUrl,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 4. Sync rich notes or scope brief to the Google Doc
   */
  public async appendNotesToDocument(
    documentId: string,
    notes: string,
    author: string = 'Team Note'
  ): Promise<void> {
    const timestamp = new Date().toLocaleString();
    const entry = `\n\n--------------------------------------------------------------------------------\nNOTE ADDED [${timestamp}] - ${author}\n--------------------------------------------------------------------------------\n${notes}\n`;
    await this.insertContent(documentId, entry, 1);
  }
}

export const googleDocsService = new GoogleDocsService();
