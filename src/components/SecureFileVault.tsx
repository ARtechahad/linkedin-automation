import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SecureFileRecord } from '../types';
import {
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  Key,
  Image as ImageIcon,
  Download,
  Plus,
  EyeOff,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SecureFileVault: React.FC = () => {
  const { role, t, showToast } = useApp();
  const [files, setFiles] = useState<SecureFileRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'asset' | 'credential' | 'contract' | 'deliverable'>('asset');
  const [newFileAccessRole, setNewFileAccessRole] = useState<'all' | 'coordinator' | 'developer' | 'admin'>('all');

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.warn('Failed to fetch files:', e);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    // Generate SHA-256 mock hash
    const mockHash = 'sha256-' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const payload = {
      name: newFileName.trim(),
      category: newFileCategory,
      size: '1.4 MB',
      accessRole: newFileAccessRole,
      sha256: mockHash
    };

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(prev => [data.file, ...prev]);
        setIsUploading(false);
        setNewFileName('');
        showToast('Secure asset uploaded and registered in vault.');
      }
    } catch (e) {
      showToast('Error uploading asset.');
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'credential': return Key;
      case 'asset': return ImageIcon;
      case 'contract': return FileText;
      case 'deliverable': return ShieldCheck;
      default: return FileText;
    }
  };

  const hasAccess = (requiredRole?: string): boolean => {
    if (!requiredRole || requiredRole === 'all') return true;
    if (role === 'admin') return true;
    if (requiredRole === 'developer') return role === 'developer' || role === 'coordinator';
    if (requiredRole === 'coordinator') return role === 'coordinator';
    return (role as string) === requiredRole;
  };

  const filteredFiles = files.filter(f => selectedCategory === 'all' || f.category === selectedCategory);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('fileVault')}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              RBAC Protected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Encrypted client assets, hosting credentials (SOP 3), and project deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploading(!isUploading)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Secure Asset</span>
          </button>
        </div>
      </div>

      {/* RBAC Active Role Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-700 dark:text-slate-300">
            Active Security Clearance: <strong>{role.toUpperCase().replace('_', ' ')}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Switch role in the top navigation bar to test access isolation.
        </span>
      </div>

      {/* Upload Modal Form */}
      {isUploading && (
        <form onSubmit={handleUpload} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Register New Secure File / Credential
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">File Name or Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Acme-cPanel-Access.enc"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Asset Category</label>
              <select
                value={newFileCategory}
                onChange={e => setNewFileCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="asset">Client Logo &amp; Assets (SOP 2)</option>
                <option value="credential">Hosting Credentials (SOP 3)</option>
                <option value="contract">Milestone Contract (SOP 5)</option>
                <option value="deliverable">Final Export (SOP 8)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Access Role Required</label>
              <select
                value={newFileAccessRole}
                onChange={e => setNewFileAccessRole(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">Public to Team (All)</option>
                <option value="coordinator">Coordinator &amp; Above</option>
                <option value="developer">Developer &amp; Above</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploading(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Confirm &amp; Encrypt
            </button>
          </div>
        </form>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'asset', 'credential', 'contract', 'deliverable'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {cat === 'all' ? 'All Files' : cat + 's'}
          </button>
        ))}
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => {
          const Icon = getCategoryIcon(file.category);
          const accessible = hasAccess(file.accessRole);

          return (
            <div
              key={file.id}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                accessible
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                  : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    accessible
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950 text-rose-600 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {accessible ? 'Clearance Granted' : 'Locked for ' + role}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Category: <span className="capitalize">{file.category}</span> • {file.size}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 font-mono text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{file.sha256}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Required: {file.accessRole}
                </span>

                {accessible ? (
                  <button
                    onClick={() => showToast(`Simulated download: ${file.name} (SHA-256 verified)`)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Restricted</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
