import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BAND_LABEL, bandFor, formatConfidence, type ConfidenceBand } from '@/lib/confidence';

const BAND_CLASS: Record<ConfidenceBand, string> = {
  high: 'badge-success',
  medium: 'badge-warning',
  low: 'badge-danger',
};

/** Confidence shown as icon + text label + percentage, never colour alone. */
export function ConfidenceBadge({ score }: { score: number }) {
  const band = bandFor(score);
  const Icon = band === 'high' ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`badge ${BAND_CLASS[band]}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{BAND_LABEL[band]}</span>
      <span>{formatConfidence(score)}</span>
      <span className="sr-only">confidence</span>
    </span>
  );
}
