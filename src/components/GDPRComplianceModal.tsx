import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  X,
  Download,
  Trash2,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const GDPRComplianceModal: React.FC = () => {
  const { isGDPRModalOpen, setIsGDPRModalOpen, showToast, refreshProjects } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [purging, setPurging] = useState(false);

  if (!isGDPRModalOpen) return null;

  // Article 15 - Right of Access / DSAR export
  const handleExportDSAR = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/gdpr/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-data-subject-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('GDPR Data Subject Access Request (DSAR) export downloaded.');
    } catch (e: any) {
      showToast('Error exporting GDPR records.');
    } finally {
      setDownloading(false);
    }
  };

  // Article 17 - Right to be Forgotten / Purge
  const handlePurge = async () => {
    const confirm = window.confirm(
      'GDPR Article 17 Notice: Are you sure you want to scrub client personally identifiable information (PII) and credentials from non-active records?'
    );
    if (!confirm) return;

    setPurging(true);
    try {
      const res = await fetch('/api/gdpr/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Client requested right to be forgotten' })
      });
      if (res.ok) {
        await refreshProjects();
        showToast('GDPR Article 17 compliance purge executed successfully.');
      } else {
        showToast('Error executing purge.');
      }
    } catch (e) {
      showToast('Network error during GDPR purge.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                GDPR &amp; International Data Privacy Compliance
              </h3>
              <p className="text-[11px] text-slate-500">
                EU Regulation 2016/679 &amp; SOP Data Confidentiality Protocols
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGDPRModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
            <p>
              In accordance with European Union General Data Protection Regulation (GDPR) and the agency SOP:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero unsolicited 3rd party tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted hosting credentials vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Full role-based access control (RBAC)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audit logging for live domain transfers</span>
              </div>
            </div>
          </div>

          {/* Action: Article 15 DSAR */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Article 15: Right of Access (DSAR)
              </h4>
              <p className="text-[11px] text-slate-500">
                Export all stored project leads, client emails, and metadata in standard machine-readable JSON format.
              </p>
            </div>
            <button
              onClick={handleExportDSAR}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition shrink-0 ml-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Download JSON'}</span>
            </button>
          </div>

          {/* Action: Article 17 Right to be Forgotten */}
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Article 17: Right to Erasure / Purge
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Anonymize client PII (emails, names, credentials) across closed projects upon client request.
              </p>
            </div>
            <button
              onClick={handlePurge}
              disabled={purging}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition shrink-0 ml-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{purging ? 'Purging...' : 'Execute Purge'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2">
            Data Controller: ClientOps Agency • Inquiries: privacy@agency-clientops.internal
          </div>

        </div>

      </div>
    </div>
  );
};
