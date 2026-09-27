import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateDiscordHandoffText } from '../data/sopContent';
import { X, Copy, Check, Share2 } from 'lucide-react';

export const DiscordExportModal: React.FC = () => {
  const { discordExportModalData, setDiscordExportModalData, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!discordExportModalData) return null;

  const discordText = generateDiscordHandoffText(discordExportModalData);

  const handleCopy = () => {
    navigator.clipboard.writeText(discordText);
    setCopied(true);
    showToast('Discord Handoff Markdown copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                SOP Step 7: Discord Project Handoff
              </h3>
              <p className="text-[11px] text-slate-500">
                Standard format for internal coordination and developer assignments
              </p>
            </div>
          </div>
          <button
            onClick={() => setDiscordExportModalData(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
            {discordText}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Paste this directly into your agency Discord channel (e.g. <code>#client-handoffs</code>). The developer and coordinator will be notified to review assets and initiate the staging build.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDiscordExportModalData(null)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Discord Format'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
