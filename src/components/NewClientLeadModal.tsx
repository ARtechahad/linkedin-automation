import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateCommission } from '../data/sopContent';
import { WebsiteType, LeadChannel } from '../types';
import { X, Plus, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';

export const NewClientLeadModal: React.FC = () => {
  const { isNewLeadModalOpen, setIsNewLeadModalOpen, refreshProjects, showToast, t } = useApp();
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [channel, setChannel] = useState<LeadChannel>('linkedin');
  const [websiteType, setWebsiteType] = useState<WebsiteType>('landing');
  const [finalPrice, setFinalPrice] = useState<number>(250);
  const [purpose, setPurpose] = useState('');
  const [assignedSalesperson, setAssignedSalesperson] = useState('Sarah Jenkins');
  const [submitting, setSubmitting] = useState(false);

  if (!isNewLeadModalOpen) return null;

  // Auto-calculated SOP metrics
  const commission = calculateCommission(finalPrice);
  const advanceDue = Number((finalPrice * 0.5).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setSubmitting(true);
    const newProject = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientCompany: clientCompany.trim() || undefined,
      channel,
      websiteType,
      purpose: purpose.trim() || `${websiteType} website project`,
      finalPrice: Number(finalPrice),
      advancePaid: false,
      advanceAmount: 0,
      balancePaid: false,
      balanceAmount: 0,
      domainTransferred: false,
      status: 'lead',
      commissionRate: commission.percentage,
      commissionAmount: commission.amount,
      commissionStatus: 'pending',
      assignedSalesperson
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        await refreshProjects();
        setIsNewLeadModalOpen(false);
        showToast('🎉 New client lead added into SOP Pipeline!');
        // Reset form
        setClientName('');
        setClientEmail('');
        setClientCompany('');
        setPurpose('');
      } else {
        showToast('Error saving project lead.');
      }
    } catch (e: any) {
      showToast('Network error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('newLead')}
            </h3>
            <p className="text-[11px] text-slate-500">
              Initialize client profile adhering to SOP Steps 1–5
            </p>
          </div>
          <button
            onClick={() => setIsNewLeadModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Client Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Liam Henderson"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Company / Brand (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BlueWave Studios"
                value={clientCompany}
                onChange={e => setClientCompany(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Inbound Channel</label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as LeadChannel)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="linkedin">LinkedIn (B2B)</option>
                <option value="upwork">Upwork</option>
                <option value="email">Direct Email</option>
                <option value="direct">Direct Referral</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Website Type (SOP 4)</label>
              <select
                value={websiteType}
                onChange={e => {
                  const val = e.target.value as WebsiteType;
                  setWebsiteType(val);
                  if (val === 'landing') setFinalPrice(250);
                  if (val === 'ecommerce') setFinalPrice(600);
                  if (val === 'corporate') setFinalPrice(950);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="landing">Landing Page ($200–$300)</option>
                <option value="ecommerce">E-Commerce ($500–$700)</option>
                <option value="corporate">Corporate ($800+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Agreed Project Value ($ USD)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="100"
                step="25"
                required
                value={finalPrice}
                onChange={e => setFinalPrice(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* SOP Breakdown Preview */}
          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/50 text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>SOP 5 Advance Due (50%):</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">${advanceDue}</span>
            </div>
            <div className="flex justify-between">
              <span>SOP 6 Employee Commission:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${commission.amount} ({commission.percentage}%)
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Project Purpose &amp; Deliverables Checklist
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Modern boutique hotel booking website with high-res photos and responsive design."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Lead & Scoping Record'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
