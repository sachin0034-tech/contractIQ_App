import { CHAT_NOT_FOUND_PHRASE } from '@/lib/constants';

export interface GroundingResult {
  text: string;
  /** Valid, unique, sorted page numbers cited in the final text. */
  cited_pages: number[];
  modified: boolean;
  /** Citations that pointed outside the document and were removed. */
  invalid_citations: number;
  /** True when no valid citation exists and the answer is not the not-found phrase. */
  ungrounded: boolean;
}

const CITATION = /\[Page (\d+)\]/g;
const PREFIX = 'Based on the document';
const UNGROUNDED_NOTE = '(No page reference was returned for this answer. Please verify it in the document.)';

/**
 * Enforces the chat grounding contract in code, whatever the model produced:
 * citations must point at real pages, every answer carries a citation (or is the not-found phrase),
 * and answers open with "Based on the document".
 */
export function enforceGrounding(rawText: string, pageCount: number): GroundingResult {
  let text = rawText.trim();
  let modified = false;
  let invalid = 0;

  text = text.replace(CITATION, (match, digits: string) => {
    const page = Number.parseInt(digits, 10);
    if (page >= 1 && page <= pageCount) return match;
    invalid += 1;
    modified = true;
    return '';
  });
  if (invalid > 0) text = text.replace(/[ \t]{2,}/g, ' ').replace(/ +([.,;:])/g, '$1').trim();

  const isNotFound = text.toLowerCase().includes(CHAT_NOT_FOUND_PHRASE.toLowerCase());

  if (!isNotFound && !text.startsWith(PREFIX)) {
    const first = text.charAt(0);
    const second = text.charAt(1);
    const lowerFirst = first === first.toUpperCase() && first !== first.toLowerCase() && second !== second.toUpperCase();
    text = `${PREFIX}, ${lowerFirst ? first.toLowerCase() + text.slice(1) : text}`;
    modified = true;
  }

  const cited = new Set<number>();
  for (const match of text.matchAll(CITATION)) cited.add(Number.parseInt(match[1], 10));

  const ungrounded = !isNotFound && cited.size === 0;
  if (ungrounded) {
    text = `${text}\n\n${UNGROUNDED_NOTE}`;
    modified = true;
  }

  return {
    text,
    cited_pages: [...cited].sort((a, b) => a - b),
    modified,
    invalid_citations: invalid,
    ungrounded,
  };
}
