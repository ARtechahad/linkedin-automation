import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService, SyncStatusEvent, QueuedMutation, EntityType, MutationAction } from '../services/offlineSyncService';

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatusEvent>(offlineSyncService.getStatus());
  const [queue, setQueue] = useState<QueuedMutation[]>(offlineSyncService.getQueue());

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setQueue(offlineSyncService.getQueue());
    });
    return () => unsubscribe();
  }, []);

  const queueMutation = useCallback((
    entity: EntityType,
    action: MutationAction,
    targetId: string,
    payload: Record<string, any>
  ) => {
    return offlineSyncService.enqueue(entity, action, targetId, payload);
  }, []);

  const syncNow = useCallback(async () => {
    return await offlineSyncService.processQueue();
  }, []);

  const retryFailed = useCallback(() => {
    offlineSyncService.retryFailed();
  }, []);

  const clearQueue = useCallback(() => {
    offlineSyncService.clearQueue();
  }, []);

  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingCount: status.pendingCount,
    conflictCount: status.conflictCount,
    lastSyncAt: status.lastSyncAt,
    queue,
    queueMutation,
    syncNow,
    retryFailed,
    clearQueue
  };
}
