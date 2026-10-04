import { z } from 'zod';

const termSchema = z.object({
  term_name: z.string().min(1).max(120),
  value: z.string().min(1).max(2000),
  page_number: z.number().int().min(1).nullable(),
  // The prompt asks for 0..1; 0..100 is tolerated and normalised afterwards.
  confidence_score: z.number().min(0).max(100),
  source_sentence: z.string().max(4000).nullable(),
});

export const extractionSchema = z.object({
  detected_type: z.enum(['NDA', 'MSA', 'OTHER']),
  terms: z.array(termSchema).max(40),
});

export type RawExtractedTerm = z.infer<typeof termSchema>;
export type ExtractionOutput = z.infer<typeof extractionSchema>;

/** Parses model output text into a validated extraction, or null when it is not valid. */
export function parseExtractionOutput(text: string): ExtractionOutput | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const result = extractionSchema.safeParse(json);
  return result.success ? result.data : null;
}
