import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ClientCommunicationMessage, CommunicationChannel, MessageSentiment } from '../types';
import { generateAI, generateOfflineFallback } from '../services/aiService';
import { SkeletonInbox } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import {
  Inbox,
  Search,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  MessageSquare,
  Linkedin,
  Mail,
  RefreshCw,
  ExternalLink,
  Plus,
  Bot,
  User,
  ShieldCheck,
  Zap,
  Tag,
  Globe2,
  Server,
  Cloud,
  Sliders
} from 'lucide-react';

export const UnifiedInboxView: React.FC = () => {
  const { t, showToast, projects, openClientPortal, aiSettings, setIsAISettingsModalOpen, setActiveTab } = useApp();

  const [messages, setMessages] = useState<ClientCommunicationMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ClientCommunicationMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');

  // AI draft state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // New simulated inquiry modal
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [simChannel, setSimChannel] = useState<CommunicationChannel>('linkedin');
  const [simName, setSimName] = useState<string>('');
  const [simCompany, setSimCompany] = useState<string>('');
  const [simSubject, setSimSubject] = useState<string>('');
  const [simContent, setSimContent] = useState<string>('');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inbox/messages');
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        if (data.messages.length > 0 && !selectedMessage) {
          setSelectedMessage(data.messages[0]);
          if (data.messages[0].aiSuggestedReply) {
            setReplyText(data.messages[0].aiSuggestedReply.body);
          }
        }
      }
    } catch (err) {
      console.error('Error loading inbox messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSelectMessage = (msg: ClientCommunicationMessage) => {
    setSelectedMessage(msg);
    if (msg.aiSuggestedReply) {
      setReplyText(msg.aiSuggestedReply.body);
    } else {
      setReplyText('');
    }

    // If unread, mark read
    if (msg.status === 'unread') {
      fetch(`/api/inbox/status/${msg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      }).then(() => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
      });
    }
  };

  const handleGenerateAIReply = async () => {
    if (!selectedMessage) return;
    setIsGeneratingAI(true);
    try {
      const result = await generateAI(
        {
          taskType: 'sentiment',
          clientName: selectedMessage.clientName,
          companyName: selectedMessage.clientCompany,
          subject: selectedMessage.subject,
          messageContent: selectedMessage.content,
          channel: selectedMessage.channel
        },
        aiSettings
      );

      const sentiment = (result.sentiment || selectedMessage.sentiment || 'positive') as any;
      const sentimentScore = result.sentimentScore || selectedMessage.sentimentScore || 85;
      const suggestedReply = {
        subject: result.suggestedSubject || `Re: ${selectedMessage.subject}`,
        body: result.text,
        ruleApplied: result.ruleApplied || 'SOP Rule 1: Professional Discovery & Scope',
        confidence: result.isFallback ? 92 : 98
      };

      setReplyText(suggestedReply.body);
      setSelectedMessage(prev => prev ? {
        ...prev,
        sentiment,
        sentimentScore,
        aiSuggestedReply: suggestedReply
      } : null);
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? {
        ...m,
        sentiment,
        sentimentScore,
        aiSuggestedReply: suggestedReply
      } : m));

      if (result.isFallback) {
        showToast('Offline SOP rules analyzed sentiment & drafted reply (Zero-downtime).');
      } else {
        showToast(`${result.providerUsed.toUpperCase()} analyzed sentiment & drafted SOP reply.`);
      }
    } catch (err: any) {
      console.warn('AI reply generation failed, applying emergency fallback:', err);
      const fallback = generateOfflineFallback({
        taskType: 'sentiment',
        clientName: selectedMessage.clientName,
        subject: selectedMessage.subject,
        messageContent: selectedMessage.content
      });
      setReplyText(fallback.text);
      showToast('SOP emergency fallback template applied.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    try {
      setIsSendingReply(true);
      const res = await fetch(`/api/inbox/reply/${selectedMessage.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText,
          senderName: 'Tariq Mehmood (Senior Sales Partner)',
          channel: selectedMessage.channel
        })
      });
      const data = await res.json();
      if (data.success && data.replyItem) {
        const updatedReplies = [...(selectedMessage.replies || []), data.replyItem];
        const updatedMsg = { ...selectedMessage, status: 'replied' as const, replies: updatedReplies };
        setSelectedMessage(updatedMsg);
        setMessages(prev => prev.map(m => m.id === selectedMessage.id ? updatedMsg : m));
        showToast(`Reply sent via ${selectedMessage.channel.toUpperCase()} & logged to SOP audit thread.`);
      }
    } catch (err) {
      console.error('Error sending reply', err);
      showToast('Failed to send reply.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSimulateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simContent) return;

    try {
      const res = await fetch('/api/inbox/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: simName,
          clientCompany: simCompany || 'Prospective Client LLC',
          channel: simChannel,
          subject: simSubject || `Inquiry regarding website development`,
          content: simContent,
          sentiment: 'positive',
          sentimentScore: 88,
          urgency: 'high'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [data.data, ...prev]);
        setSelectedMessage(data.data);
        setShowSimulateModal(false);
        setSimName('');
        setSimCompany('');
        setSimSubject('');
        setSimContent('');
        showToast(`Simulated incoming inquiry from ${data.data.clientName} logged.`);
      }
    } catch (err) {
      console.error('Error simulating inquiry', err);
    }
  };

  // Channel badge styling
  const getChannelBadge = (ch: CommunicationChannel) => {
    switch (ch) {
      case 'linkedin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Linkedin className="w-3 h-3 text-blue-600" />
            <span>LinkedIn</span>
          </span>
        );
      case 'upwork':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>Upwork</span>
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Mail className="w-3 h-3 text-amber-600" />
            <span>Email</span>
          </span>
        );
      case 'discord':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <MessageSquare className="w-3 h-3 text-indigo-600" />
            <span>Discord</span>
          </span>
        );
    }
  };

  const getSentimentBadge = (sentiment: MessageSentiment, score: number) => {
    switch (sentiment) {
      case 'urgent_pricing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Urgent Pricing ({score}%)</span>
          </span>
        );
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Positive ({score}%)</span>
          </span>
        );
      case 'hesitant':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Hesitant / Scoping ({score}%)</span>
          </span>
        );
      case 'revision_request':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Tag className="w-3 h-3 text-purple-600" />
            <span>Revision Request ({score}%)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span>Neutral ({score}%)</span>
          </span>
        );
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (selectedChannel !== 'all' && m.channel !== selectedChannel) return false;
    if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
    if (selectedSentiment !== 'all' && m.sentiment !== selectedSentiment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.clientName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        (m.clientCompany && m.clientCompany.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const unreadCount = (messages || []).filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>{t('inbox') || 'Unified Client Communications Inbox'}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
              {unreadCount} Unread
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time cross-channel communications hub for LinkedIn, Upwork, Email, and Discord with Gemini sentiment scoring and SOP-compliant reply drafting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('gmail')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-red-500" />
            <span>Open Gmail Suite</span>
          </button>

          <button
            id="btn-inbox-refresh"
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-inbox-simulate"
            onClick={() => setShowSimulateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Incoming Inquiry</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Filters & Message List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search & Channel Selector */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="inbox-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inquiries, clients, or keywords..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Channel Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: 'All Channels' },
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'upwork', label: 'Upwork' },
                { id: 'email', label: 'Email' },
                { id: 'discord', label: 'Discord' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedChannel(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                    selectedChannel === tab.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status & Sentiment Filters */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread Only</option>
                <option value="replied">Replied</option>
                <option value="read">Read</option>
              </select>

              <select
                value={selectedSentiment}
                onChange={e => setSelectedSentiment(e.target.value)}
                className="text-[11px] bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
              >
                <option value="all">All Sentiments</option>
                <option value="urgent_pricing">Urgent Pricing</option>
                <option value="positive">Positive</option>
                <option value="hesitant">Hesitant</option>
                <option value="revision_request">Revision Request</option>
              </select>
            </div>

          </div>

          {/* Messages Scroll List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {loading ? (
              <SkeletonInbox itemsCount={5} />
            ) : filteredMessages.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No inquiries found"
                description={
                  searchQuery || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedSentiment !== 'all'
                    ? 'No client communications match your selected filters or search query.'
                    : 'Your unified inbox is currently empty. Simulate an incoming inquiry to test sentiment scoring and AI replies.'
                }
                actionLabel={
                  searchQuery || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedSentiment !== 'all'
                    ? 'Reset Filters'
                    : 'Simulate Incoming Inquiry'
                }
                onAction={
                  searchQuery || selectedChannel !== 'all' || selectedStatus !== 'all' || selectedSentiment !== 'all'
                    ? () => {
                        setSearchQuery('');
                        setSelectedChannel('all');
                        setSelectedStatus('all');
                        setSelectedSentiment('all');
                      }
                    : () => setShowSimulateModal(true)
                }
                variant="subtle"
              />
            ) : (
              filteredMessages.map(msg => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    id={`inbox-msg-card-${msg.id}`}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                      isSelected
                        ? 'glass-card border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/40 hover:bg-slate-800/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getChannelBadge(msg.channel)}
                        {msg.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Unread" />
                        )}
                        {msg.status === 'replied' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Replied</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {msg.clientName}
                      </h4>
                      {msg.clientCompany && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate text-right">
                          {msg.clientCompany}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">
                      {msg.subject}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>{getSentimentBadge(msg.sentiment, msg.sentimentScore)}</div>
                      {msg.replies && msg.replies.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Conversation Thread & AI Assistant (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {selectedMessage ? (
            <div className="space-y-4">
              
              {/* Message Details Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getChannelBadge(selectedMessage.channel)}
                      {getSentimentBadge(selectedMessage.sentiment, selectedMessage.sentimentScore)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedMessage.subject}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMessage.clientName}</span>
                      <span>•</span>
                      <span>{selectedMessage.clientEmail}</span>
                      {selectedMessage.clientCompany && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">{selectedMessage.clientCompany}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project linkage action */}
                  {selectedMessage.projectId && (
                    <button
                      onClick={() => openClientPortal(selectedMessage.projectId!)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition shrink-0"
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Open Client Portal</span>
                    </button>
                  )}
                </div>

                {/* Gemini Sentiment & Intent Analysis Card */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <span>Gemini Sentiment Analysis</span>
                        <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                          (Confidence {selectedMessage.sentimentScore}%)
                        </span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Urgency: {selectedMessage.urgency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      Client indicates interest in project specifications. Recommended SOP rule: Provide clear staging server assurance and reinforce the standard 50% advance milestone deposit.
                    </p>
                  </div>
                </div>

                {/* Incoming message text body */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>

                {/* Thread Replies if any */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Thread History ({selectedMessage.replies.length})</span>
                    </h4>

                    {selectedMessage.replies.map(rep => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{rep.sender}</span>
                          </span>
                          <span className="text-slate-400">
                            {new Date(rep.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-[11px]">
                          {rep.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* SOP Reply Composer with Gemini AI Assistant */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Instant SOP-Compliant Reply Generator
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAISettingsModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                      title="Click to change AI Provider"
                    >
                      {aiSettings.provider === 'local' ? (
                        <>
                          <Server className="w-2.5 h-2.5 text-emerald-500" />
                          <span>Local ({aiSettings.localModel})</span>
                        </>
                      ) : aiSettings.provider === 'cloud' ? (
                        <>
                          <Cloud className="w-2.5 h-2.5 text-blue-500" />
                          <span>Cloud ({aiSettings.cloudService})</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5 text-amber-500" />
                          <span>Offline Mode</span>
                        </>
                      )}
                      <Sliders className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  </div>

                  <button
                    id="btn-inbox-ai-draft"
                    onClick={handleGenerateAIReply}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingAI
                        ? 'Analyzing...'
                        : aiSettings.provider === 'local'
                        ? `Draft via Local (${aiSettings.localModel})`
                        : aiSettings.provider === 'cloud'
                        ? `Draft with Cloud AI`
                        : 'Draft via Offline SOP Rules'}
                    </span>
                  </button>
                </div>

                {/* AI Rule banner if draft present */}
                {selectedMessage.aiSuggestedReply && (
                  <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                    <span className="font-semibold">
                      Applied: {selectedMessage.aiSuggestedReply.ruleApplied}
                    </span>
                    <span>Confidence: {selectedMessage.aiSuggestedReply.confidence}%</span>
                  </div>
                )}

                {/* Reply Editor */}
                <textarea
                  id="inbox-reply-textarea"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={6}
                  placeholder="Type your consultative reply or click 'Draft with Gemini AI' to auto-generate an SOP-compliant response..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                />

                {/* Send Footer */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Channel: <strong className="uppercase text-slate-700 dark:text-slate-300">{selectedMessage.channel}</strong> (Direct API & Webhook dispatch)
                  </span>

                  <button
                    id="btn-inbox-send-reply"
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingReply ? 'animate-pulse' : ''}`} />
                    <span>{isSendingReply ? 'Sending...' : `Send Reply via ${selectedMessage.channel.toUpperCase()}`}</span>
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/10 p-8">
              <EmptyState
                icon={MessageSquare}
                title="No conversation selected"
                description="Select an inquiry from the inbox on the left to inspect real-time AI sentiment analysis, thread history, and SOP-compliant drafting tools."
              />
            </div>
          )}

        </div>

      </div>

      {/* Modal: Simulate Incoming Inquiry */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-modal border border-white/10 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-600" />
                <span>Simulate Incoming Client Inquiry</span>
              </h3>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateInquiry} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Platform Channel
                </label>
                <select
                  value={simChannel}
                  onChange={e => setSimChannel(e.target.value as CommunicationChannel)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="linkedin">LinkedIn (InMail / Message)</option>
                  <option value="upwork">Upwork (Direct Client Message)</option>
                  <option value="email">Corporate Inbound Email</option>
                  <option value="discord">Discord Developer / Client Server</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Full Name
                </label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={e => setSimName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={simCompany}
                  onChange={e => setSimCompany(e.target.value)}
                  placeholder="e.g. Bloom Cosmetics London"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={simSubject}
                  onChange={e => setSimSubject(e.target.value)}
                  placeholder="e.g. Need staging review date & advance invoice"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  rows={4}
                  value={simContent}
                  onChange={e => setSimContent(e.target.value)}
                  placeholder="Type inquiry details regarding website development, pricing, or revisions..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Inject Inquiry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
