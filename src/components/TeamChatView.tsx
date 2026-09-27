import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { SkeletonChat } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { saveChatMessageToFirestore, subscribeChatMessagesFromFirestore } from '../lib/firebase';
import {
  Send,
  Hash,
  Smile,
  Paperclip,
  Share2,
  Users,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export const TeamChatView: React.FC = () => {
  const { role, t, showToast, currentUser } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('sales-leads');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const channels = [
    { id: 'sales-leads', name: 'sales-leads', desc: 'Incoming inquiries, pricing negotiations & 50% advances' },
    { id: 'staging-dev', name: 'staging-dev', desc: 'Internal staging servers, QA bugs & transfer locks' },
    { id: 'coordination', name: 'coordination', desc: 'Project timelines, client assets & Trello tracking' },
    { id: 'general', name: 'general-sop', desc: 'Team announcements & SOP Rule reminders' }
  ];

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?channel=${selectedChannel}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.warn('Failed to fetch chat messages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Subscribe to Firestore for real-time messages in this channel
    const unsubscribe = subscribeChatMessagesFromFirestore(selectedChannel, (liveMsgs) => {
      if (liveMsgs && liveMsgs.length > 0) {
        setMessages(liveMsgs as ChatMessage[]);
      }
    });

    const interval = setInterval(fetchMessages, 6000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const senderNames: Record<string, string> = {
      sales: 'Sarah Jenkins (Sales)',
      coordinator: 'Alex Chen (Coordination)',
      developer: 'Marcus Vance (Dev Lead)',
      admin: 'Elena Rostova (Admin)',
      client_guest: 'Guest Client'
    };

    const senderName = currentUser?.name ? `${currentUser.name} (${role.toUpperCase()})` : (senderNames[role] || 'Team Member');

    const newMsgPayload = {
      channel: selectedChannel,
      sender: senderName,
      role: role,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    // Save to Firestore for persistent database storage
    saveChatMessageToFirestore(newMsgPayload).catch(e => console.warn('Firestore chat error:', e));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsgPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setInputText('');
      } else {
        // Optimistic append if server had issue but Firestore succeeded
        setMessages(prev => [...prev, { id: 'msg_' + Date.now(), ...newMsgPayload }]);
        setInputText('');
      }
    } catch (e) {
      // Optimistic append
      setMessages(prev => [...prev, { id: 'msg_' + Date.now(), ...newMsgPayload }]);
      setInputText('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col md:flex-row h-[620px]">
      
      {/* Channels Sidebar */}
      <div className="w-full md:w-64 bg-slate-50/80 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Team Channels
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="space-y-1">
            {channels.map(ch => (
              <button
                key={ch.id}
                id={`channel-btn-${ch.id}`}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition ${
                  selectedChannel === ch.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Hash className="w-4 h-4 shrink-0" />
                <span className="truncate">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current User Role Badge */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Posting as:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col justify-between h-full bg-white dark:bg-slate-900">
        
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {channels.find(c => c.id === selectedChannel)?.name}
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              — {channels.find(c => c.id === selectedChannel)?.desc}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>4 Online</span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {loading ? (
            <SkeletonChat messagesCount={5} />
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState 
                icon={Hash}
                title={`No messages in #${selectedChannel}`}
                description="Start the conversation or drop files here to begin."
              />
            </div>
          ) : (
            messages.map(msg => {
              const isCurrentUser = msg.role === role;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{msg.sender}</span>
                    <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800">
                      {msg.role}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      isCurrentUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-850">
          <input
            id="input-team-chat-message"
            type="text"
            placeholder={`Message #${selectedChannel}...`}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            id="btn-team-chat-send"
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
