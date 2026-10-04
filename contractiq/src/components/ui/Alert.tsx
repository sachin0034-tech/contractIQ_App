import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'warning' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  error: 'border-danger-border bg-danger-bg text-danger-text',
  success: 'border-success-border bg-success-bg text-success-text',
  warning: 'border-warning-border bg-warning-bg text-warning-text',
  info: 'border-border bg-bg-surface text-text-primary',
};

const ICON: Record<Tone, typeof Info> = {
  error: AlertTriangle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

/** Inline status message. Errors use role="alert"; other tones use role="status". */
export function Alert({ tone = 'info', children, className = '' }: AlertProps) {
  const Icon = ICON[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-md border p-3 type-body-sm ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
