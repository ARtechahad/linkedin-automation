import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'syncing' | 'saved' | 'error';

export interface UseDebouncedSaveOptions<T> {
  initialValue: T;
  onSave: (value: T) => Promise<boolean | void | any> | boolean | void;
  delay?: number; // Defaults to 2000ms (2 seconds)
  onSuccess?: (value: T) => void;
  onError?: (error: unknown) => void;
}

export interface UseDebouncedSaveReturn<T> {
  value: T;
  setValue: (updater: T | ((prev: T) => T)) => void;
  saveStatus: SaveStatus;
  isSyncing: boolean;
  isSaved: boolean;
  isError: boolean;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  saveNow: () => Promise<void>;
  resetTo: (newValue: T) => void;
}

/**
 * Custom React hook that debounces save operations by 2000ms (2 seconds).
 * Guarantees automated persistence of Kanban columns, project descriptions, and custom fields
 * while exposing clean visual state indicators ('idle' | 'syncing' | 'saved' | 'error').
 */
export function useDebouncedSave<T>({
  initialValue,
  onSave,
  delay = 2000,
  onSuccess,
  onError
}: UseDebouncedSaveOptions<T>): UseDebouncedSaveReturn<T> {
  const [value, setInternalValue] = useState<T>(initialValue);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References to track timers and latest values across renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isFirstRender = useRef<boolean>(true);
  const onSaveRef = useRef(onSave);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const valueRef = useRef<T>(value);

  // Keep callback refs synchronized
  useEffect(() => {
    onSaveRef.current = onSave;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    valueRef.current = value;
  }, [onSave, onSuccess, onError, value]);

  // Clean unmount handling
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sync internal state if initialValue changes externally (e.g. fresh DB fetch)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Only update if not actively dirty/syncing
    if (saveStatus === 'idle' || saveStatus === 'saved') {
      setInternalValue(initialValue);
      valueRef.current = initialValue;
    }
  }, [initialValue]);

  // Core execution function to persist data
  const executeSave = useCallback(async (dataToSave: T) => {
    if (!isMountedRef.current) return;
    setSaveStatus('syncing');
    setErrorMessage(null);

    try {
      await onSaveRef.current(dataToSave);
      if (!isMountedRef.current) return;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      if (onSuccessRef.current) {
        onSuccessRef.current(dataToSave);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const msg = err?.message || 'Failed to save changes';
      setSaveStatus('error');
      setErrorMessage(msg);
      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
    }
  }, []);

  // Update value and schedule debounced save (2-second timer)
  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setInternalValue(prev => {
        const nextVal = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        valueRef.current = nextVal;

        // Clear existing pending timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // Set status to pending/syncing hint
        setSaveStatus('syncing');

        // Schedule new save after delay (default 2000ms)
        timerRef.current = setTimeout(() => {
          executeSave(nextVal);
        }, delay);

        return nextVal;
      });
    },
    [delay, executeSave]
  );

  // Force immediate save without waiting for 2s debounce
  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await executeSave(valueRef.current);
  }, [executeSave]);

  // Reset internal state without triggering a save
  const resetTo = useCallback((newValue: T) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setInternalValue(newValue);
    valueRef.current = newValue;
    setSaveStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    value,
    setValue,
    saveStatus,
    isSyncing: saveStatus === 'syncing',
    isSaved: saveStatus === 'saved',
    isError: saveStatus === 'error',
    lastSavedAt,
    errorMessage,
    saveNow,
    resetTo
  };
}
