import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectLead } from '../types';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Star,
  FileCheck,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';

interface PartnerEvaluationModalProps {
  project: ProjectLead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerEvaluationModal: React.FC<PartnerEvaluationModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const { showToast, refreshProjects, role, currentUser } = useApp();

  const [score, setScore] = useState<number>(project?.partnerEvaluationScore || 88);
  const [notes, setNotes] = useState<string>(project?.partnerEvaluationNotes || '');
  const [signOff, setSignOff] = useState<boolean>(project?.partnerSignOff || false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync state if project changes
  React.useEffect(() => {
    if (project) {
      setScore(project.partnerEvaluationScore || 88);
      setNotes(project.partnerEvaluationNotes || '');
      setSignOff(project.partnerSignOff || false);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${project.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('alm_nexus_token') ? { Authorization: `Bearer ${localStorage.getItem('alm_nexus_token')}` } : {})
        },
        body: JSON.stringify({
          partnerEvaluationScore: score,
          partnerEvaluationNotes: notes,
          partnerSignOff: signOff
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 Partner Appraisal Recorded for ${project.clientName} (${score}/100)!`);
        await refreshProjects();
        onClose();
      } else {
        showToast(`Error: ${data.error || 'Failed to submit appraisal'}`);
      }
    } catch (e: any) {
      showToast(`Network error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Partner Deal Evaluation &amp; Appraisal Sign-off
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional Partner: Vance Capital • Project ID: {project.id}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Deal Metadata Snapshot */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Client / Property:</span>
              <span className="font-bold text-slate-900 dark:text-white">{project.clientName} ({project.clientCompany || 'Direct Venture'})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Platform / Type:</span>
              <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">{project.websiteType} • {project.channel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Contract Budget:</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400">${project.finalPrice} USD</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700 line-clamp-2">
              {project.purpose}
            </p>
          </div>

          {/* Appraisal Score Slider (1 - 100) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Partner Appraisal Score</span>
              </label>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200">
                {score} / 100
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Risk / Low (20)</span>
              <span>Viable (60)</span>
              <span>Grade-A / Exceptional (100)</span>
            </div>
          </div>

          {/* Partner Evaluation Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Institutional Appraisal Memo &amp; Due Diligence Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record technical architecture feasibility, property asset verification, and institutional viability..."
              rows={4}
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed resize-none"
            />
          </div>

          {/* Formal Sign-off Checkbox */}
          <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={signOff}
                onChange={(e) => setSignOff(e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-cyan-950 dark:text-cyan-200 block">
                  Institutional Partner Sign-Off
                </span>
                <span className="text-[11px] text-cyan-800 dark:text-cyan-300">
                  I formally certify this deal has passed institutional partner appraisal and authorize execution within the live delivery pipeline.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
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
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submitting ? 'Recording Appraisal...' : 'Submit Partner Appraisal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
