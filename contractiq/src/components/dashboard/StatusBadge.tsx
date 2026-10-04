import { Loader2 } from 'lucide-react';
import type { ContractStatus } from '@/types/domain';

const CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'badge-success' },
  processing: { label: 'Processing', className: 'badge-warning' },
  uploaded: { label: 'Ready to process', className: '' },
  error: { label: 'Failed', className: 'badge-danger' },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`badge ${className || 'border-border-strong bg-bg-surface text-text-secondary'}`}>
      {status === 'processing' ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
