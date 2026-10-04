import { z } from 'zod';
import { MAX_CUSTOM_TERMS } from '@/lib/constants';
import { STANDARD_TERMS } from '@/lib/prompts/terms';
import type { ContractType } from '@/types/domain';

const ALLOWED_CHARS = /^[\p{L}\p{N} &/()'.,+-]+$/u;

/** Phrases that suggest an attempt to instruct the model through a term name. */
const SUSPICIOUS_PATTERNS = [
  'ignore',
  'disregard',
  'system prompt',
  'previous instructions',
  'you are',
  'assistant:',
  '</',
  '<contract',
];

export function isSuspiciousTermName(name: string): boolean {
  const lower = name.toLowerCase();
  return SUSPICIOUS_PATTERNS.some((pattern) => lower.includes(pattern));
}

export type TermNameProblem = 'length' | 'characters' | 'not_allowed' | 'standard_duplicate';

export const TERM_NAME_MESSAGES: Record<TermNameProblem, string> = {
  length: 'Term names must be 2 to 80 characters.',
  characters: 'Use letters, numbers and basic punctuation only.',
  not_allowed: 'That term name is not allowed.',
  standard_duplicate: 'That term is already included by default.',
};

/** Validates one custom term name. Returns the problem, or null when valid. Safe for client and server. */
export function checkTermName(name: string, type: ContractType): TermNameProblem | null {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return 'length';
  if (!ALLOWED_CHARS.test(trimmed)) return 'characters';
  if (isSuspiciousTermName(trimmed)) return 'not_allowed';
  const lower = trimmed.toLowerCase();
  if (STANDARD_TERMS[type].some((term) => term.toLowerCase() === lower)) return 'standard_duplicate';
  return null;
}

export const customTermsRequestSchema = z.object({
  terms: z.array(z.string()).max(MAX_CUSTOM_TERMS, 'You can add up to 5 custom terms.'),
});

export interface CustomTermsValidation {
  terms: string[];
  /** First problem found, with the index of the offending item. */
  problem: { index: number; reason: TermNameProblem | 'duplicate' } | null;
}

/** Trims and validates a full set of custom terms (case-insensitive unique, valid names). */
export function validateCustomTerms(rawTerms: string[], type: ContractType): CustomTermsValidation {
  const terms = rawTerms.map((t) => t.trim());
  const seen = new Set<string>();
  for (let index = 0; index < terms.length; index += 1) {
    const problem = checkTermName(terms[index], type);
    if (problem) return { terms, problem: { index, reason: problem } };
    const key = terms[index].toLowerCase();
    if (seen.has(key)) return { terms, problem: { index, reason: 'duplicate' } };
    seen.add(key);
  }
  return { terms, problem: null };
}
