'use client';

import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Tone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastApi {
  toast: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_CLASS: Record<Tone, string> = {
  success: 'border-success-border bg-success-bg text-success-text',
  error: 'border-danger-border bg-danger-bg text-danger-text',
  info: 'border-border bg-bg-primary text-text-primary',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: Tone = 'info') => {
    setItems((current) => [...current, { id: Date.now() + Math.random(), message, tone }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      <Toast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((item) => (
          <Toast.Root
            key={item.id}
            onOpenChange={(open) => {
              if (!open) setItems((current) => current.filter((t) => t.id !== item.id));
            }}
            className={`flex items-start gap-3 rounded-lg border p-3 type-body-lg ${TONE_CLASS[item.tone]}`}
          >
            <Toast.Description className="flex-1">{item.message}</Toast.Description>
            <Toast.Close aria-label="Dismiss notification" className="rounded-sm p-1 hover:bg-bg-subtle">
              <X className="h-4 w-4" aria-hidden="true" />
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-2 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
