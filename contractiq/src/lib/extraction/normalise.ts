import { LOW_CONFIDENCE_THRESHOLD, MAX_TERM_VALUE_CHARS, NOT_FOUND_VALUE } from '@/lib/constants';
import { findPageForSentence, normalizeForMatch } from '@/lib/pdf/parse-pages';
import type { RawExtractedTerm } from '@/lib/validation/extraction';
import type { ContractPage } from '@/types/domain';

/** Confidence ceiling applied when a term's supporting sentence is missing or not found in the contract. */
export const UNVERIFIED_CONFIDENCE_CAP = LOW_CONFIDENCE_THRESHOLD - 0.01;

export interface RequestedTerm {
  name: string;
  isCustom: boolean;
}

export interface NormalisedTerm {
  term_name: string;
  value: string;
  page_number: number | null;
  /** 0..1, three decimals */
  confidence_score: number;
  source_sentence: string | null;
  is_custom: boolean;
  sort_order: number;
}

export interface NormalisationStats {
  total: number;
  notFound: number;
  lowConfidence: number;
  sentencesUnverified: number;
}

/** Brings a model-reported confidence into 0..1 (tolerates 0..100) with 3 decimals. */
export function normaliseConfidence(raw: number): number {
  const scaled = raw > 1 ? raw / 100 : raw;
  const clamped = Math.min(1, Math.max(0, scaled));
  return Math.round(clamped * 1000) / 1000;
}

function isNotFoundValue(value: string): boolean {
  return normalizeForMatch(value).startsWith('not found');
}

function notFoundTerm(requested: RequestedTerm, sortOrder: number): NormalisedTerm {
  return {
    term_name: requested.name,
    value: NOT_FOUND_VALUE,
    page_number: null,
    confidence_score: 0,
    source_sentence: null,
    is_custom: requested.isCustom,
    sort_order: sortOrder,
  };
}

/**
 * Turns raw model output into the rows we store, enforcing the grounding rules in code:
 * - exactly one entry per requested term, in request order (missing terms become "Not found")
 * - confidence normalised to 0..1
 * - a value without a verifiable verbatim source sentence is capped below the low-confidence threshold
 * - the page number is taken from where the sentence really is, not from the model
 */
export function normaliseTerms(input: {
  requested: RequestedTerm[];
  returned: RawExtractedTerm[];
  pages: ContractPage[];
}): { terms: NormalisedTerm[]; stats: NormalisationStats } {
  const { requested, returned, pages } = input;
  const plainText = normalizeForMatch(pages.map((page) => page.text).join(' '));

  const byName = new Map<string, RawExtractedTerm>();
  for (const term of returned) {
    const key = normalizeForMatch(term.term_name);
    if (!byName.has(key)) byName.set(key, term);
  }

  const stats: NormalisationStats = { total: requested.length, notFound: 0, lowConfidence: 0, sentencesUnverified: 0 };

  const terms = requested.map((request, index): NormalisedTerm => {
    const raw = byName.get(normalizeForMatch(request.name));
    if (!raw || isNotFoundValue(raw.value)) {
      stats.notFound += 1;
      stats.lowConfidence += 1;
      return notFoundTerm(request, index);
    }

    let confidence = normaliseConfidence(raw.confidence_score);
    let page = raw.page_number;
    const sentence = raw.source_sentence?.trim() ? raw.source_sentence.trim() : null;

    if (!sentence) {
      confidence = Math.min(confidence, UNVERIFIED_CONFIDENCE_CAP);
      stats.sentencesUnverified += 1;
    } else if (!plainText.includes(normalizeForMatch(sentence))) {
      confidence = Math.min(confidence, UNVERIFIED_CONFIDENCE_CAP);
      stats.sentencesUnverified += 1;
      if (page !== null && !pages.some((p) => p.n === page)) page = null;
    } else {
      page = findPageForSentence(pages, sentence) ?? (page !== null && pages.some((p) => p.n === page) ? page : null);
    }

    if (confidence < LOW_CONFIDENCE_THRESHOLD) stats.lowConfidence += 1;

    return {
      term_name: request.name,
      value: raw.value.trim().slice(0, MAX_TERM_VALUE_CHARS),
      page_number: page,
      confidence_score: confidence,
      source_sentence: sentence,
      is_custom: request.isCustom,
      sort_order: index,
    };
  });

  return { terms, stats };
}
