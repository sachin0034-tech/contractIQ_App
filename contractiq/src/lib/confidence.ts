import { HIGH_CONFIDENCE_THRESHOLD, LOW_CONFIDENCE_THRESHOLD } from '@/lib/constants';

export type ConfidenceBand = 'high' | 'medium' | 'low';

/** The only place confidence thresholds are applied. */
export function bandFor(score: number): ConfidenceBand {
  if (score >= HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (score >= LOW_CONFIDENCE_THRESHOLD) return 'medium';
  return 'low';
}

/** Whole-number percentage, rounded down so a score just under 50% never displays as "50%". */
export function formatConfidence(score: number): string {
  return `${Math.floor(score * 100 + 1e-9)}%`;
}

export const BAND_LABEL: Record<ConfidenceBand, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
