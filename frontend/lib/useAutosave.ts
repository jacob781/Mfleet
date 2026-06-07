import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { saveDraft } from './driverApi';
import type { DriverFormValues } from './driverTypes';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave(token: string, methods: UseFormReturn<DriverFormValues>) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<number | undefined>(undefined);

  const save = useCallback(async () => {
    setStatus('saving');
    try {
      await saveDraft(token, methods.getValues() as unknown as Record<string, unknown>);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }, [token, methods]);

  useEffect(() => {
    const sub = methods.watch(() => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => { void save(); }, 2000);
    });
    return () => {
      sub.unsubscribe();
      window.clearTimeout(timer.current);
    };
  }, [methods, save]);

  return { status, saveNow: save };
}
