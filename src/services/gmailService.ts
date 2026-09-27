/**
 * Google Gmail REST API Service
 * Handles OAuth bearer token authentication, message retrieval, MIME body decoding,
 * RFC 2822 email generation, message sending, drafts, and label management.
 */

import { getAccessToken } from '../lib/firebase';

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  size: number;
  data?: string;
  attachmentId?: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailRawMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId?: string;
  internalDate: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
}

export interface ParsedGmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: number;
  formattedDate: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

/**
 * Base64 URL safe decoding supporting Unicode/UTF-8
 */
export function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    try {
      return atob(base64UrlStr.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

/**
 * Base64 URL safe encoding supporting Unicode/UTF-8
 */
export function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Extract body contents recursively from Gmail MIME payload
 */
function extractBodyFromPayload(payload?: GmailMessagePart): { text: string; html: string } {
  let text = '';
  let html = '';

  if (!payload) return { text, html };

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    text += decodeBase64Url(payload.body.data);
  } else if (payload.mimeType === 'text/html' && payload.body?.data) {
    html += decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      const nested = extractBodyFromPayload(part);
      if (nested.text) text += (text ? '\n' : '') + nested.text;
      if (nested.html) html += nested.html;
    }
  }

  return { text, html };
}

/**
 * Parses header values by name
 */
function getHeader(headers: GmailHeader[] = [], name: string): string {
  const target = name.toLowerCase();
  const found = headers.find(h => h.name.toLowerCase() === target);
  return found ? found.value : '';
}

/**
 * Clean sender name and email
 */
function parseSender(fromHeader: string): { name: string; email: string } {
  if (!fromHeader) return { name: 'Unknown', email: '' };
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const rawName = match[1].replace(/^["']|["']$/g, '').trim();
    return {
      name: rawName || match[2],
      email: match[2].trim()
    };
  }
  return {
    name: fromHeader.split('@')[0],
    email: fromHeader.trim()
  };
}

/**
 * Format RFC 2822 timestamp into human-readable representation
 */
function formatEmailDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Parse a raw Gmail API response into clean UI-ready format
 */
export function parseRawGmailMessage(raw: GmailRawMessage): ParsedGmailMessage {
  const headers = raw.payload?.headers || [];
  const fromHeader = getHeader(headers, 'From');
  const { name: fromName, email: fromEmail } = parseSender(fromHeader);
  const to = getHeader(headers, 'To');
  const subject = getHeader(headers, 'Subject') || '(No Subject)';
  const labelIds = raw.labelIds || [];
  const internalDate = Number(raw.internalDate) || Date.now();
  const { text, html } = extractBodyFromPayload(raw.payload);

  const isUnread = labelIds.includes('UNREAD');
  const isStarred = labelIds.includes('STARRED');
  const hasAttachments = Boolean(raw.payload?.parts?.some(p => p.filename && p.filename.length > 0));

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds,
    snippet: raw.snippet || '',
    internalDate,
    formattedDate: formatEmailDate(internalDate),
    from: fromHeader,
    fromName,
    fromEmail,
    to,
    subject,
    bodyText: text || raw.snippet || '',
    bodyHtml: html || undefined,
    isUnread,
    isStarred,
    hasAttachments
  };
}

/**
 * Fetch authenticated user's Gmail profile
 */
export async function fetchGmailProfile(): Promise<GmailProfile> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail API Error: ${res.statusText}`);
  }

  return res.json();
}

/**
 * List message IDs based on query and label
 */
export async function listGmailMessages(options: {
  q?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
} = {}): Promise<{ messages: Array<{ id: string; threadId: string }>; nextPageToken?: string; resultSizeEstimate: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q);
  if (options.maxResults) params.set('maxResults', String(options.maxResults));
  if (options.pageToken) params.set('pageToken', options.pageToken);
  if (options.labelIds && options.labelIds.length > 0) {
    options.labelIds.forEach(l => params.append('labelIds', l));
  }

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gmail listing failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    messages: data.messages || [],
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate || 0
  };
}

/**
 * Get individual message details with full payload
 */
export async function getGmailMessageDetails(id: string): Promise<ParsedGmailMessage> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch email #${id}: ${res.statusText}`);
  }

  const raw = await res.json();
  return parseRawGmailMessage(raw);
}

/**
 * List Gmail labels
 */
export async function listGmailLabels(): Promise<GmailLabel[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to list Gmail labels: ${res.statusText}`);
  }

  const data = await res.json();
  return (data.labels || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    type: l.type === 'system' ? 'system' : 'user',
    messagesTotal: l.messagesTotal,
    messagesUnread: l.messagesUnread
  }));
}

/**
 * Build RFC 2822 compliant email string
 */
function buildRfc2822Email(options: SendEmailOptions, senderEmail: string): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const lines: string[] = [];

  lines.push(`From: ${senderEmail}`);
  lines.push(`To: ${options.to}`);
  if (options.cc) lines.push(`Cc: ${options.cc}`);
  if (options.bcc) lines.push(`Bcc: ${options.bcc}`);
  lines.push(`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`);
  lines.push('MIME-Version: 1.0');
  
  if (options.inReplyTo) {
    lines.push(`In-Reply-To: ${options.inReplyTo}`);
  }
  if (options.references) {
    lines.push(`References: ${options.references}`);
  }

  if (options.bodyHtml) {
    lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(options.bodyText))));
    lines.push('');
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(options.bodyHtml))));
    lines.push('');
    lines.push(`--${boundary}--`);
  } else {
    lines.push('Content-Type: text/plain; charset=UTF-8');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(btoa(unescape(encodeURIComponent(options.bodyText))));
  }

  return lines.join('\r\n');
}

/**
 * Send an email message via Gmail API
 * Note: Must be invoked only after explicit confirmation in UI
 */
export async function sendGmailMessage(options: SendEmailOptions): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  // Fetch sender email
  let senderEmail = 'me';
  try {
    const profile = await fetchGmailProfile();
    senderEmail = profile.emailAddress || 'me';
  } catch {
    senderEmail = 'me';
  }

  const rfc2822 = buildRfc2822Email(options, senderEmail);
  const rawBase64Url = encodeBase64Url(rfc2822);

  const payload: any = { raw: rawBase64Url };
  if (options.threadId) {
    payload.threadId = options.threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to send email: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Create a draft in Gmail
 */
export async function createGmailDraft(options: SendEmailOptions): Promise<{ id: string; message: any }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  let senderEmail = 'me';
  try {
    const profile = await fetchGmailProfile();
    senderEmail = profile.emailAddress || 'me';
  } catch {
    senderEmail = 'me';
  }

  const rfc2822 = buildRfc2822Email(options, senderEmail);
  const rawBase64Url = encodeBase64Url(rfc2822);

  const payload: any = {
    message: {
      raw: rawBase64Url,
      threadId: options.threadId
    }
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create draft: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Move a message to Trash
 * Note: Must be invoked only after explicit confirmation in UI
 */
export async function trashGmailMessage(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to move message to trash: ${res.statusText}`);
  }
}

/**
 * Restore a message from Trash
 */
export async function untrashGmailMessage(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/untrash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to untrash message: ${res.statusText}`);
  }
}

/**
 * Permanently delete a message
 * Note: Must be invoked only after explicit confirmation in UI
 */
export async function deleteGmailMessagePermanently(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete message: ${res.statusText}`);
  }
}

/**
 * Modify message labels (e.g. read/unread, starred, custom)
 */
export async function modifyGmailMessageLabels(
  id: string,
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<ParsedGmailMessage> {
  const token = await getAccessToken();
  if (!token) throw new Error('Gmail authentication token missing. Please sign in with Google.');

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ addLabelIds, removeLabelIds })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to modify labels: ${res.statusText}`);
  }

  const raw = await res.json();
  return parseRawGmailMessage(raw);
}

/**
 * Toggle starred status on a message
 */
export async function toggleGmailStar(id: string, currentlyStarred: boolean): Promise<ParsedGmailMessage> {
  if (currentlyStarred) {
    return modifyGmailMessageLabels(id, [], ['STARRED']);
  } else {
    return modifyGmailMessageLabels(id, ['STARRED'], []);
  }
}

/**
 * Mark message as Read or Unread
 */
export async function toggleGmailRead(id: string, currentlyUnread: boolean): Promise<ParsedGmailMessage> {
  if (currentlyUnread) {
    return modifyGmailMessageLabels(id, [], ['UNREAD']);
  } else {
    return modifyGmailMessageLabels(id, ['UNREAD'], []);
  }
}
