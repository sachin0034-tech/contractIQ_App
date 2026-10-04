import type { DashboardSummary } from '@/types/api';

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-bg-primary p-4">
      <dt className="type-body-sm text-text-secondary">{label}</dt>
      <dd className="type-h5">{value}</dd>
    </div>
  );
}

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <dl className="grid gap-4 md:grid-cols-3" aria-label="Review summary">
      <Card label="Contracts reviewed" value={summary.total} />
      <Card label="NDAs" value={summary.by_type.NDA} />
      <Card label="MSAs" value={summary.by_type.MSA} />
    </dl>
  );
}
