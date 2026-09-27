import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WorkspaceConfirmModal } from './WorkspaceConfirmModal';
import {
  fetchGmailProfile,
  listGmailMessages,
  getGmailMessageDetails,
  sendGmailMessage,
  createGmailDraft,
  trashGmailMessage,
  toggleGmailStar,
  toggleGmailRead,
  deleteGmailMessagePermanently,
  ParsedGmailMessage,
  GmailProfile
} from '../services/gmailService';
import { hasGmailAccess, getAccessToken } from '../lib/firebase';
import { generateAI, generateOfflineFallback } from '../services/aiService';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  FileText,
  Search,
  RefreshCw,
  Plus,
  Reply,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Paperclip,
  ExternalLink,
  ShieldCheck,
  User,
  Clock,
  Tag,
  Building2,
  ChevronRight,
  LogOut,
  Maximize2
} from 'lucide-react';

export const GmailWorkspaceView: React.FC = () => {
  const { 
    showToast, 
    loginWithGoogle, 
    currentUser, 
    firebaseUser, 
    openNewLeadModalWithData,
    setIsNewLeadModalOpen,
    aiSettings
  } = useApp() as any;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Mailbox state
  const [currentFolder, setCurrentFolder] = useState<'INBOX' | 'SENT' | 'STARRED' | 'DRAFT' | 'TRASH'>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messages, setMessages] = useState<ParsedGmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParsedGmailMessage | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Compose / Reply state
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [replyThreadId, setReplyThreadId] = useState<string | undefined>(undefined);
  const [isGeneratingAIDraft, setIsGeneratingAIDraft] = useState<boolean>(false);

  // Confirmation Modal state for mutating/destructive operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'send_email' | 'trash_email' | 'delete_email' | 'modify_label';
    title: string;
    description: string;
    details: Array<{ label: string; value: string }>;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    type: 'send_email',
    title: '',
    description: '',
    details: [],
    onConfirm: async () => {}
  });
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  // Check Gmail authentication status on mount
  useEffect(() => {
    checkConnection();
  }, [firebaseUser]);

  const checkConnection = async () => {
    const token = await getAccessToken();
    if (token) {
      setIsConnected(true);
      loadProfileAndMessages('INBOX');
    } else {
      setIsConnected(false);
      setProfile(null);
      setMessages([]);
    }
  };

  const handleGoogleConnect = async () => {
    setAuthLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setIsConnected(true);
        showToast('Connected to Google Workspace Gmail successfully!', 'success');
        await loadProfileAndMessages('INBOX');
      } else {
        showToast(res.message || 'Failed to connect to Google Account', 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Google Sign-In failed', 'warning');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadProfileAndMessages = async (folder: 'INBOX' | 'SENT' | 'STARRED' | 'DRAFT' | 'TRASH', query = '') => {
    setLoading(true);
    try {
      const prof = await fetchGmailProfile();
      setProfile(prof);

      let labelFilter: string[] | undefined = undefined;
      let q = query.trim();

      if (folder === 'INBOX') {
        labelFilter = ['INBOX'];
      } else if (folder === 'SENT') {
        labelFilter = ['SENT'];
      } else if (folder === 'STARRED') {
        labelFilter = ['STARRED'];
      } else if (folder === 'DRAFT') {
        labelFilter = ['DRAFT'];
      } else if (folder === 'TRASH') {
        labelFilter = ['TRASH'];
      }

      const listRes = await listGmailMessages({
        labelIds: labelFilter,
        q: q || undefined,
        maxResults: 15
      });

      if (listRes.messages.length === 0) {
        setMessages([]);
        setSelectedMessage(null);
        return;
      }

      // Fetch message details in parallel
      const detailedMessages = await Promise.all(
        listRes.messages.map(m => getGmailMessageDetails(m.id).catch(() => null))
      );

      const validMessages = detailedMessages.filter((m): m is ParsedGmailMessage => m !== null);
      setMessages(validMessages);

      if (validMessages.length > 0 && !selectedMessage) {
        setSelectedMessage(validMessages[0]);
      }
    } catch (err: any) {
      console.warn('Error loading Gmail data:', err);
      showToast(err.message || 'Could not load emails from Gmail', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderChange = (folder: 'INBOX' | 'SENT' | 'STARRED' | 'DRAFT' | 'TRASH') => {
    setCurrentFolder(folder);
    setSelectedMessage(null);
    loadProfileAndMessages(folder, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProfileAndMessages(currentFolder, searchQuery);
  };

  const handleSelectMessage = async (msg: ParsedGmailMessage) => {
    setSelectedMessage(msg);
    // If unread, mark as read on Gmail
    if (msg.isUnread) {
      try {
        await toggleGmailRead(msg.id, true);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isUnread: false } : m));
      } catch (err) {
        console.warn('Could not mark message as read on Gmail', err);
      }
    }
  };

  const handleToggleStar = async (msg: ParsedGmailMessage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await toggleGmailStar(msg.id, msg.isStarred);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isStarred: updated.isStarred } : m));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(prev => prev ? { ...prev, isStarred: updated.isStarred } : null);
      }
      showToast(updated.isStarred ? 'Starred in Gmail' : 'Unstarred in Gmail', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update star', 'warning');
    }
  };

  /**
   * Trashing an email - MANDATORY EXPLICIT USER CONFIRMATION DIALOG
   */
  const requestTrashEmail = (msg: ParsedGmailMessage) => {
    setConfirmModal({
      isOpen: true,
      type: 'trash_email',
      title: 'Move Email to Gmail Trash?',
      description: 'You are about to move this email message to your Gmail Trash folder. This mutates your Gmail mailbox.',
      details: [
        { label: 'Subject', value: msg.subject },
        { label: 'From', value: msg.from },
        { label: 'Date', value: msg.formattedDate }
      ],
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await trashGmailMessage(msg.id);
          setMessages(prev => prev.filter(m => m.id !== msg.id));
          if (selectedMessage?.id === msg.id) {
            setSelectedMessage(null);
          }
          showToast('Email moved to Gmail Trash', 'info');
        } catch (err: any) {
          showToast(err.message || 'Failed to trash email', 'warning');
        } finally {
          setConfirmLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  /**
   * Sending an email - MANDATORY EXPLICIT USER CONFIRMATION DIALOG
   */
  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      showToast('Please fill in recipient, subject, and message body.', 'warning');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'send_email',
      title: 'Authorize & Send Email via Gmail',
      description: 'You are authorizing this application to send an email from your authenticated Gmail account with your explicit permission.',
      details: [
        { label: 'Recipient (To)', value: composeTo },
        { label: 'Subject', value: composeSubject },
        { label: 'Sender Account', value: profile?.emailAddress || 'Your Google Account' },
        { label: 'Body Length', value: `${composeBody.length} characters` }
      ],
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await sendGmailMessage({
            to: composeTo,
            subject: composeSubject,
            bodyText: composeBody,
            threadId: replyThreadId
          });
          showToast(`Email dispatched successfully to ${composeTo} via Gmail!`, 'success');
          setIsComposeOpen(false);
          setComposeTo('');
          setComposeSubject('');
          setComposeBody('');
          setReplyThreadId(undefined);
          // Refresh sent messages or current folder
          loadProfileAndMessages(currentFolder);
        } catch (err: any) {
          showToast(err.message || 'Failed to send email via Gmail', 'warning');
        } finally {
          setConfirmLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  /**
   * Open reply composer pre-populated
   */
  const openReplyComposer = (msg: ParsedGmailMessage) => {
    setComposeTo(msg.fromEmail || msg.from);
    setComposeSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
    setComposeBody(`\n\n--- On ${msg.formattedDate}, ${msg.from} wrote ---\n> ${msg.bodyText.slice(0, 300).replace(/\n/g, '\n> ')}`);
    setReplyThreadId(msg.threadId);
    setIsComposeOpen(true);
  };

  /**
   * AI-generated reply adhering to Agency SOP Rules
   */
  const handleGenerateAISOPReply = async (msg: ParsedGmailMessage) => {
    setIsGeneratingAIDraft(true);
    try {
      const prompt = `You are a professional project coordinator at an elite international web agency following strict SOP rules:
- SOP 5: 50% Advance payment required to kick off development sprint.
- SOP 8: Live domain cutover ONLY happens after 100% QA pass and final 50% balance payment.
- Maintain a courteous, professional, and clear tone.

Write a polished, concise email reply to this client message:
Sender: ${msg.from}
Subject: ${msg.subject}
Message: ${msg.bodyText}

Generate ONLY the email body text. Do not include subject line or placeholder brackets.`;

      let draftText = '';
      try {
        const response = await generateAI({
          prompt,
          taskType: 'sentiment',
          clientName: msg.fromName || msg.from,
          messageContent: msg.bodyText
        }, aiSettings);
        draftText = response.text;
      } catch {
        const fb = generateOfflineFallback({
          clientName: msg.fromName || msg.from,
          websiteType: 'corporate',
          messageContent: msg.bodyText,
          taskType: 'sentiment'
        });
        draftText = fb.text || 'Thank you for contacting us. We have received your inquiry and will follow up shortly per our SOP guidelines.';
      }

      setComposeTo(msg.fromEmail || msg.from);
      setComposeSubject(msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`);
      setComposeBody(`${draftText}\n\n--- On ${msg.formattedDate}, ${msg.from} wrote ---\n> ${msg.bodyText.slice(0, 200).replace(/\n/g, '\n> ')}`);
      setReplyThreadId(msg.threadId);
      setIsComposeOpen(true);
      showToast('AI Draft formulated using Agency SOP rules!', 'info');
    } catch (err) {
      showToast('Could not generate AI draft', 'warning');
    } finally {
      setIsGeneratingAIDraft(false);
    }
  };

  /**
   * Apply Agency SOP Templates
   */
  const applySOPTemplate = (templateType: 'advance_50' | 'staging_review' | 'balance_50' | 'retainer') => {
    const clientName = composeTo ? composeTo.split('@')[0] : 'Valued Client';
    switch (templateType) {
      case 'advance_50':
        setComposeSubject('Project Kick-Off & 50% Advance Milestone Protocol');
        setComposeBody(
`Dear ${clientName},

Thank you for confirming your project requirements with our engineering team!

As per our Standard Operating Procedure (SOP Rule 5), we require a 50% advance milestone deposit to officially initiate the development sprint, assign dedicated senior developers, and provision your private staging environment.

We accept secure transfer via PayPal or Payoneer. Please let us know if you would like our accounts department to issue the formal invoice today.

Warm regards,
Client Operations Team`
        );
        break;
      case 'staging_review':
        setComposeSubject('Your Private Staging Environment is Ready for Inspection');
        setComposeBody(
`Hi ${clientName},

Great news! Our development team has completed the private staging build and passed internal cross-device QA testing.

Your dedicated staging link is now live for your inspection. Please review the interactive layouts on desktop and mobile:
👉 Staging Link: https://staging-${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.internal-agency.app

Please test and share any refinement requests. Once approved, we will prepare the production domain cutover!

Best regards,
Engineering & QA Team`
        );
        break;
      case 'balance_50':
        setComposeSubject('Staging Approved: Final 50% Balance Clearance & Live Domain Cutover');
        setComposeBody(
`Dear ${clientName},

Thank you for approving the staging build! Everything is tested and ready for your live visitors.

In strict adherence to our Agency SOP (Rule 8: Secure Handover Protocol), please arrange clearance for the remaining 50% balance payment.

Immediately upon verification by our finance desk, our DevOps specialists will point DNS records and transfer full administrator credentials to your company.

Warm regards,
Client Services & DevOps Desk`
        );
        break;
      case 'retainer':
        setComposeSubject('Post-Launch Maintenance, Security Updates & Retainer Proposal');
        setComposeBody(
`Hi ${clientName},

Congratulations once again on the successful live launch of your website!

To ensure your web applications remain updated, secure, and blazing fast, we offer dedicated monthly maintenance retainers covering security audits, plugin updates, and up to 5 hours of priority feature changes.

Let us know if you would like us to reserve a monthly maintenance slot for your business.

Warm regards,
Client Success Team`
        );
        break;
    }
    showToast('Applied SOP email template!', 'info');
  };

  /**
   * Save draft in Gmail
   */
  const handleSaveDraft = async () => {
    if (!composeTo && !composeSubject) {
      showToast('Please specify a recipient or subject to save a draft.', 'warning');
      return;
    }
    try {
      await createGmailDraft({
        to: composeTo,
        subject: composeSubject,
        bodyText: composeBody,
        threadId: replyThreadId
      });
      showToast('Saved draft to your Gmail account', 'success');
      setIsComposeOpen(false);
      if (currentFolder === 'DRAFT') {
        loadProfileAndMessages('DRAFT');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save draft', 'warning');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.25rem)] overflow-hidden bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">
                Gmail Workspace Suite
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-300 font-bold border border-red-500/20">
                Official Google API
              </span>
              {isConnected && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isConnected && profile
                ? `Connected as ${profile.emailAddress} (${profile.messagesTotal.toLocaleString()} emails in mailbox)`
                : 'Direct OAuth integration to read, compose, and dispatch client communications with user permission'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isConnected ? (
            <>
              <button
                onClick={() => loadProfileAndMessages(currentFolder, searchQuery)}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                title="Refresh Gmail"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => {
                  setComposeTo('');
                  setComposeSubject('');
                  setComposeBody('');
                  setReplyThreadId(undefined);
                  setIsComposeOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Compose Email</span>
              </button>
            </>
          ) : (
            <GoogleSignInButton
              onClick={handleGoogleConnect}
              disabled={authLoading}
              text={authLoading ? 'Connecting to Gmail...' : 'Connect Gmail Account'}
            />
          )}
        </div>
      </div>

      {/* Main Mailbox Content */}
      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-4 text-red-600 dark:text-red-400">
            <Mail className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Connect Your Gmail Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Link your Google account with official Workspace permissions to read, reply, organize, and dispatch client proposal emails directly from this dashboard.
          </p>

          <GoogleSignInButton
            onClick={handleGoogleConnect}
            disabled={authLoading}
            text={authLoading ? 'Authorizing Workspace...' : 'Sign in with Google'}
            className="mb-4"
          />

          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-left text-xs space-y-2 w-full mt-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Permission &amp; Privacy Guarantees</span>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc pl-4">
              <li>Access tokens are strictly cached in-memory and never saved to persistent browser storage.</li>
              <li>Every email send, trash, and delete operation requires an explicit user confirmation dialog.</li>
              <li>Full support for SOP templates, milestone invoices, and automated draft assistance.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Folders Left Rail */}
          <div className="w-48 sm:w-56 border-r border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/40 p-3 space-y-1 shrink-0 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-1">
              {[
                { id: 'INBOX', label: 'Inbox', icon: Inbox, count: profile?.messagesTotal },
                { id: 'STARRED', label: 'Starred', icon: Star },
                { id: 'SENT', label: 'Sent', icon: Send },
                { id: 'DRAFT', label: 'Drafts', icon: FileText },
                { id: 'TRASH', label: 'Trash', icon: Trash2 }
              ].map(folder => {
                const Icon = folder.icon;
                const isSelected = currentFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderChange(folder.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{folder.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Account Info Card */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <User className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium truncate">{profile?.emailAddress}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                {profile?.threadsTotal.toLocaleString()} Active Threads
              </span>
            </div>
          </div>

          {/* Messages Column */}
          <div className="w-80 sm:w-96 border-r border-slate-200 dark:border-white/10 flex flex-col bg-white dark:bg-slate-950/20 shrink-0">
            {/* Search Header */}
            <form onSubmit={handleSearchSubmit} className="p-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search in Gmail..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-hidden focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Go
              </button>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 scrollbar-thin">
              {loading ? (
                <div className="p-6 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-red-500 mx-auto" />
                  <p className="text-xs text-slate-400">Fetching messages from Gmail API...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No messages found in this folder.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`p-3.5 transition cursor-pointer text-left ${
                        isSelected
                          ? 'bg-red-50/60 dark:bg-red-500/10 border-l-3 border-red-500'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      } ${msg.isUnread ? 'font-bold' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {msg.isUnread && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                          <span className="text-xs text-slate-900 dark:text-white truncate">
                            {msg.fromName || msg.from}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {msg.formattedDate}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-200 truncate mb-1">
                        {msg.subject}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {msg.snippet}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center gap-1">
                          {msg.hasAttachments && (
                            <Paperclip className="w-3 h-3 text-slate-400" />
                          )}
                          {msg.labelIds.includes('IMPORTANT') && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                              Important
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={e => handleToggleStar(msg, e)}
                          className="text-slate-400 hover:text-amber-500 transition p-0.5"
                        >
                          <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Message Detail Pane */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/30 overflow-hidden">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Message Header */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/60 flex items-start justify-between gap-4 shrink-0">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedMessage.subject}
                      </h2>
                      {selectedMessage.isStarred && (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        From: {selectedMessage.from}
                      </span>
                      <span>•</span>
                      <span>To: {selectedMessage.to}</span>
                      <span>•</span>
                      <span className="font-mono">{selectedMessage.formattedDate}</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openReplyComposer(selectedMessage)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Reply to message"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>

                    <button
                      onClick={() => handleGenerateAISOPReply(selectedMessage)}
                      disabled={isGeneratingAIDraft}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Draft SOP response with AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isGeneratingAIDraft ? 'Drafting...' : 'AI SOP Reply'}</span>
                    </button>

                    <button
                      onClick={() => requestTrashEmail(selectedMessage)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                      title="Move to Trash (requires confirmation)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="flex-1 p-6 overflow-y-auto scrollbar-thin text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {selectedMessage.bodyHtml ? (
                    <div 
                      className="prose dark:prose-invert max-w-none text-xs sm:text-sm font-sans"
                      dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                      {selectedMessage.bodyText}
                    </pre>
                  )}
                </div>

                {/* Bottom Quick Bar */}
                <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px]">Thread ID: {selectedMessage.threadId}</span>
                  </div>
                  <button
                    onClick={() => openReplyComposer(selectedMessage)}
                    className="text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Click here to reply</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 mb-3 opacity-30" />
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No Message Selected
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose an email from the left pane to view its content or compose a new email.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose & Reply Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {replyThreadId ? 'Reply via Gmail' : 'Compose Email via Gmail'}
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {/* SOP Templates Bar */}
            <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-red-500" />
                SOP Templates:
              </span>
              <button
                type="button"
                onClick={() => applySOPTemplate('advance_50')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer font-medium"
              >
                SOP 5: 50% Advance
              </button>
              <button
                type="button"
                onClick={() => applySOPTemplate('staging_review')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer font-medium"
              >
                SOP 8: Staging Ready
              </button>
              <button
                type="button"
                onClick={() => applySOPTemplate('balance_50')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer font-medium"
              >
                SOP 8: Final Balance
              </button>
              <button
                type="button"
                onClick={() => applySOPTemplate('retainer')}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer font-medium"
              >
                SOP 11: Retainer
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={requestSendEmail} className="flex-1 flex flex-col p-5 space-y-3 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  To (Recipient)
                </label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={e => setComposeTo(e.target.value)}
                  placeholder="client@example.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Proposal: Next.js Platform & Development Sprint"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-hidden focus:border-red-500"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[180px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Message Body
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {composeBody.length} characters
                  </span>
                </div>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your email here or apply an SOP template..."
                  required
                  rows={8}
                  className="w-full flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-sans leading-relaxed outline-hidden focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
                >
                  Save as Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize &amp; Send</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog for Mutating Operations */}
      <WorkspaceConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        description={confirmModal.description}
        details={confirmModal.details}
        isLoading={confirmLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
