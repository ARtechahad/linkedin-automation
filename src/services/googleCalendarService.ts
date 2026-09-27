/**
 * Google Calendar REST API Client Service
 * 
 * Automates calendar event scheduling for client meetings, milestone deliverables,
 * payment deadlines, with color coding, smart reminders, and timeline synchronization.
 */

import { getAccessToken } from '../lib/firebase';
import { ProjectLead } from '../types';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string; // '11' = Red (Urgent/Payment), '1' = Blue (Meeting), '10' = Green (Complete/Delivery)
  htmlLink?: string;
  status?: string;
  hangoutLink?: string;
}

export type EventUrgencyType = 'meeting' | 'payment_deadline' | 'staging_deliverable' | 'final_handover';

class GoogleCalendarService {
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
   * 1. List upcoming events from primary calendar
   */
  public async listUpcomingEvents(maxResults: number = 25): Promise<GoogleCalendarEvent[]> {
    const now = new Date().toISOString();
    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now
    )}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

    const res = await this.fetchGoogleApi(endpoint);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Calendar events (HTTP ${res.status})`);
    }

    const data = await res.json();
    return data.items || [];
  }

  /**
   * 2. Create single calendar event
   */
  public async createEvent(eventPayload: {
    summary: string;
    description: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    urgency: EventUrgencyType;
    attendees?: string[];
  }): Promise<GoogleCalendarEvent> {
    // Google Calendar standard color IDs:
    // '1' = Lavender / Blue (Meetings)
    // '11' = Flamingo / Red (Strict Payment Deadlines & Overdue)
    // '10' = Basil / Green (Completed Phases & Delivery)
    // '5' = Banana / Yellow (Staging Review)
    let colorId = '1';
    if (eventPayload.urgency === 'payment_deadline') colorId = '11';
    else if (eventPayload.urgency === 'final_handover') colorId = '10';
    else if (eventPayload.urgency === 'staging_deliverable') colorId = '5';

    const body: Record<string, any> = {
      summary: eventPayload.summary,
      description: eventPayload.description,
      colorId,
      start: {
        dateTime: eventPayload.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventPayload.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 1440 }, // 24 hours prior reminder
          { method: 'email', minutes: 60 }    // 1 hour prior email
        ]
      }
    };

    if (eventPayload.attendees && eventPayload.attendees.length > 0) {
      body.attendees = eventPayload.attendees.map(email => ({ email }));
    }

    const res = await this.fetchGoogleApi('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create calendar event (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * 3. Automatically schedule standard project timeline events
   */
  public async scheduleMilestonesForProject(
    project: ProjectLead
  ): Promise<{ scheduledEvents: GoogleCalendarEvent[]; primaryLink: string }> {
    const company = project.clientCompany || project.clientName;
    const now = new Date();

    // 1. Kickoff & Discovery Meeting (in 24 hours) - Blue
    const kickoffStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    kickoffStart.setHours(15, 0, 0, 0); // 3:00 PM
    const kickoffEnd = new Date(kickoffStart.getTime() + 45 * 60 * 1000);

    const kickoffEvent = await this.createEvent({
      summary: `[Meeting] Kickoff & Discovery: ${company}`,
      description: `Client: ${project.clientName} (${company})\nProject ID: ${project.id}\nScope: ${project.purpose}\nDeal Value: $${project.finalPrice}\nChannel: ${project.channel.toUpperCase()}`,
      startTime: kickoffStart.toISOString(),
      endTime: kickoffEnd.toISOString(),
      urgency: 'meeting',
      attendees: project.clientEmail ? [project.clientEmail] : undefined
    });

    // 2. 50% Advance Payment Clearance Deadline (in 3 days) - Red
    const advDeadlineStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    advDeadlineStart.setHours(17, 0, 0, 0);
    const advDeadlineEnd = new Date(advDeadlineStart.getTime() + 30 * 60 * 1000);

    const advEvent = await this.createEvent({
      summary: `[Deadline: Payment] 50% Advance Invoice Due: $${project.finalPrice * 0.5} (${company})`,
      description: `Strict SOP Step 2 Gate:\nDevelopment cannot commence until 50% advance deposit ($${project.finalPrice * 0.5}) clears.\nClient: ${project.clientName} (${project.clientEmail || 'No email'})`,
      startTime: advDeadlineStart.toISOString(),
      endTime: advDeadlineEnd.toISOString(),
      urgency: 'payment_deadline'
    });

    // 3. Staging Deliverable Review (in 7 days) - Yellow
    const stagingStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    stagingStart.setHours(14, 0, 0, 0);
    const stagingEnd = new Date(stagingStart.getTime() + 60 * 60 * 1000);

    const stagingEvent = await this.createEvent({
      summary: `[Milestone] Staging Preview & QA Review: ${company}`,
      description: `SOP Step 6-8 Review:\nDeliver staging preview URL for client feedback and cross-browser testing.\nStaging Server: ${project.stagingUrl || 'https://staging.agencyops.dev/' + project.id}`,
      startTime: stagingStart.toISOString(),
      endTime: stagingEnd.toISOString(),
      urgency: 'staging_deliverable'
    });

    // 4. Target Final Delivery & DNS Handover - Green
    const deliveryDays = project.timelineDays || 14;
    const deliveryStart = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    deliveryStart.setHours(16, 0, 0, 0);
    const deliveryEnd = new Date(deliveryStart.getTime() + 60 * 60 * 1000);

    const deliveryEvent = await this.createEvent({
      summary: `[Launch & Delivery] Live Domain Handover: ${company}`,
      description: `SOP Step 9-11 Handover:\nVerify final 50% balance payment cleared ($${project.finalPrice * 0.5}) before releasing DNS transfer.\nInitiate 30-day warranty.`,
      startTime: deliveryStart.toISOString(),
      endTime: deliveryEnd.toISOString(),
      urgency: 'final_handover'
    });

    return {
      scheduledEvents: [kickoffEvent, advEvent, stagingEvent, deliveryEvent],
      primaryLink: kickoffEvent.htmlLink || 'https://calendar.google.com'
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();
