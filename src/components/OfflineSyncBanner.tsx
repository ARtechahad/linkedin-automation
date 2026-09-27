import React, { useState } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, conflictCount, lastSyncAt, syncNow, queue, retryFailed } = useOfflineSync();
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  // If online with 0 pending items, keep banner clean
  if (isOnline && pendingCount === 0 && conflictCount === 0 && !isSyncing) {
    return null;
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <>
      {/* Top Reconnection / Offline Alert Pill */}
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-6 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs transition-all ${
              !isOnline
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                : isSyncing
                ? 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-semibold">Offline Mode Active</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="font-semibold">Syncing {pendingCount} queued change(s)...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Back Online • Synced</span>
                </>
              )}

              {pendingCount > 0 && !isSyncing && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                  {pendingCount} Queued
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              {isOnline && pendingCount > 0 && !isSyncing && (
                <button
                  onClick={() => syncNow()}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition cursor-pointer"
                >
                  Sync Now
                </button>
              )}

              <button
                onClick={() => setShowDrawer(true)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition cursor-pointer"
                title="View Queue Details"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Queue Drawer Modal */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass-card rounded-2xl border border-white/10 shadow-2xl bg-slate-900 text-slate-100 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Offline Sync Queue &amp; Conflict Resolution</h3>
                    <p className="text-[11px] text-slate-400">
                      Status: {isOnline ? 'Online' : 'Offline'} • Last Sync: {formatTime(lastSyncAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-300">
                  <p className="font-semibold text-white mb-1">Automatic Conflict Resolution Strategy:</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Changes made during international travel are saved to the persistent local queue. When reconnected, a 3-way field-level merge resolves divergent updates while enforcing SOP milestone gate integrity.
                  </p>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                    All local changes are fully synced with the backend database.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {queue.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                              {item.action} {item.entity}
                            </span>
                            <span className="text-slate-200 font-semibold">{item.targetId}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString()} • Retries: {item.retryCount}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'syncing'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : item.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-white/10 flex items-center justify-between bg-slate-800/40 text-xs">
                <button
                  onClick={retryFailed}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Retry All
                </button>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
