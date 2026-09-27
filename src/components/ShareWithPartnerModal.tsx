import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectLead } from '../types';
import {
  Share2,
  Users,
  X,
  CheckCircle2,
  Building2,
  Shield,
  Send,
  AlertCircle
} from 'lucide-react';

interface ShareWithPartnerModalProps {
  project: ProjectLead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareWithPartnerModal: React.FC<ShareWithPartnerModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const { showToast, refreshProjects } = useApp();

  const [collaboratorEmail, setCollaboratorEmail] = useState<string>('partner@vance-capital.com');
  const [partnerNotes, setPartnerNotes] = useState<string>('');
  const [sharing, setSharing] = useState<boolean>(false);

  if (!isOpen || !project) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) {
      showToast('Please enter the partner collaborator email address.');
      return;
    }

    try {
      setSharing(true);
      const res = await fetch(`/api/projects/${project.id}/collaborator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('alm_nexus_token') ? { Authorization: `Bearer ${localStorage.getItem('alm_nexus_token')}` } : {})
        },
        body: JSON.stringify({
          collaboratorEmail: collaboratorEmail.trim(),
          partnerEvaluationNotes: partnerNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Deal sheet explicitly shared with ${collaboratorEmail}!`);
        await refreshProjects();
        onClose();
      } else {
        showToast(`Error: ${data.error || 'Failed to share deal sheet'}`);
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Share Deal Sheet with Partner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant isolated evaluation access to institutional collaborator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleShare} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">{project.clientName}</div>
            <div className="text-slate-500">{project.clientCompany || 'Direct Client'} • ${project.finalPrice} USD</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Partner / Collaborator Account
            </label>
            <select
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="partner@vance-capital.com">Marcus Vance (partner@vance-capital.com) • Vance Capital</option>
              <option value="appraisal@realty-group.us">Elena Rostova (appraisal@realty-group.us) • Apex Valuation</option>
              <option value="custom">Enter Custom Email...</option>
            </select>
          </div>

          {collaboratorEmail === 'custom' && (
            <div>
              <input
                type="email"
                placeholder="collaborator@institution.com"
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Handoff Memo / Evaluation Instructions
            </label>
            <textarea
              value={partnerNotes}
              onChange={(e) => setPartnerNotes(e.target.value)}
              placeholder="e.g. Please evaluate commercial valuation and technical feasibility for Miami asset..."
              rows={3}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              Per RBAC security isolation, internal agency sales commissions and financial payout rates are automatically masked from collaborator accounts.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sharing}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sharing ? 'Assigning...' : 'Assign & Share Deal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
