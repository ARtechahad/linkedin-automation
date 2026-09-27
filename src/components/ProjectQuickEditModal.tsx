import React, { useState } from 'react';
import { ProjectLead, WebsiteType, LeadChannel } from '../types';
import { useDebouncedSave } from '../hooks/useDebouncedSave';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import {
  X,
  FileText,
  Building2,
  DollarSign,
  Globe2,
  CheckCircle2,
  Sparkles,
  Link,
  MessageSquare,
  Layers,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectQuickEditModalProps {
  project: ProjectLead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveToBackend: (projectId: string, updates: Partial<ProjectLead>) => Promise<boolean | void>;
}

export const ProjectQuickEditModal: React.FC<ProjectQuickEditModalProps> = ({
  project,
  isOpen,
  onClose,
  onSaveToBackend
}) => {
  if (!isOpen || !project) return null;

  // Use the useDebouncedSave hook with 2-second debounce timer
  const {
    value: formData,
    setValue: setFormData,
    saveStatus,
    lastSavedAt,
    errorMessage,
    saveNow
  } = useDebouncedSave<Partial<ProjectLead>>({
    initialValue: {
      clientName: project.clientName,
      clientCompany: project.clientCompany || '',
      purpose: project.purpose,
      assetNotes: project.assetNotes || '',
      websiteType: project.websiteType,
      finalPrice: project.finalPrice,
      stagingUrl: project.stagingUrl || '',
      trackerUrl: project.trackerUrl || '',
      hasLogo: project.hasLogo,
      hasContent: project.hasContent,
      hasImages: project.hasImages,
      useStockPhotos: project.useStockPhotos,
      needsContentWriting: project.needsContentWriting
    },
    delay: 2000, // 2-second debounce delay as requested
    onSave: async (updates) => {
      await onSaveToBackend(project.id, updates);
    }
  });

  const handleFieldChange = (field: keyof ProjectLead, val: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-slate-900/95 text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Edit Project &amp; Scope Details
                  </h3>
                  <AutoSaveIndicator
                    status={saveStatus}
                    lastSavedAt={lastSavedAt}
                    errorMessage={errorMessage}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {project.clientName} • {project.clientCompany || 'Direct Client'} ({project.id})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={saveNow}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Force Save Immediately"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Now</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Auto-save notification callout */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>2-Second Auto-Save Active:</strong> Changes made here automatically persist to the database backend with zero data loss.
                </span>
              </div>
              <AutoSaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
            </div>

            {/* Client Name & Company */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={formData.clientName || ''}
                  onChange={e => handleFieldChange('clientName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Alexander Vance"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={formData.clientCompany || ''}
                  onChange={e => handleFieldChange('clientCompany', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Lumina Health Clinics UK"
                />
              </div>
            </div>

            {/* Project Description & Purpose (Primary debounced field) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-indigo-300">
                  Project Description &amp; Scope Purpose (Debounced Auto-Save)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(formData.purpose || '').length} characters
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.purpose || ''}
                onChange={e => handleFieldChange('purpose', e.target.value)}
                placeholder="Describe the client's website purpose, requirements, target audiences, and special features..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-indigo-500/30 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition leading-relaxed font-sans"
              />
            </div>

            {/* Asset Notes & Hosting Specs */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Asset Notes &amp; Client Specifications
              </label>
              <textarea
                rows={2}
                value={formData.assetNotes || ''}
                onChange={e => handleFieldChange('assetNotes', e.target.value)}
                placeholder="Notes on client-provided logo, branding guidelines, content copy, or stock photography preferences..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition leading-relaxed font-sans"
              />
            </div>

            {/* Website Type & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Website Scope Type
                </label>
                <select
                  value={formData.websiteType || 'landing'}
                  onChange={e => handleFieldChange('websiteType', e.target.value as WebsiteType)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="landing">Landing Page ($200 - $300)</option>
                  <option value="ecommerce">E-Commerce Store ($500 - $700)</option>
                  <option value="corporate">Corporate Multi-page ($800+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Agreed Total Project Price ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={formData.finalPrice || 0}
                    onChange={e => handleFieldChange('finalPrice', Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* URLs (Staging & Live) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Staging Preview URL (Internal Domain)
                </label>
                <input
                  type="text"
                  value={formData.stagingUrl || ''}
                  onChange={e => handleFieldChange('stagingUrl', e.target.value)}
                  placeholder="https://staging.agencyops.dev/project-xyz"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Tracker / Milestone URL
                </label>
                <input
                  type="text"
                  value={formData.trackerUrl || ''}
                  onChange={e => handleFieldChange('trackerUrl', e.target.value)}
                  placeholder="https://trello.com/b/xyz or Notion URL"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Asset Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.hasLogo)}
                  onChange={e => handleFieldChange('hasLogo', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Logo Ready</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.hasContent)}
                  onChange={e => handleFieldChange('hasContent', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Content Provided</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.hasImages)}
                  onChange={e => handleFieldChange('hasImages', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Images Uploaded</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.useStockPhotos)}
                  onChange={e => handleFieldChange('useStockPhotos', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Use Stock Photos</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(formData.needsContentWriting)}
                  onChange={e => handleFieldChange('needsContentWriting', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Copywriting Needed</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-800/40 text-xs">
            <AutoSaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              errorMessage={errorMessage}
            />
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
