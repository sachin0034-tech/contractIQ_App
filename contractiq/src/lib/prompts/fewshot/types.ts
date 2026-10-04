import type { ExtractionOutput } from '@/lib/validation/extraction';

export interface FewShotExample {
  /** Contract excerpt in the stored format, with [PAGE N] markers. */
  excerpt: string;
  /** Standard terms requested in this example. */
  terms: string[];
  /** The exact JSON the model should return. Every source_sentence must be verbatim from `excerpt`. */
  expected: ExtractionOutput;
}
