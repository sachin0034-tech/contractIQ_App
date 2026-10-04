export interface TextRange {
  /** Inclusive start offset in the original text. */
  start: number;
  /** Exclusive end offset in the original text. */
  end: number;
}

const QUOTE_MAP: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '‛': "'",
  '“': '"',
  '”': '"',
  '‟': '"',
  '−': '-',
};

function foldChar(char: string): string {
  if (QUOTE_MAP[char]) return QUOTE_MAP[char];
  if (char >= '‐' && char <= '―') return '-';
  return char.toLowerCase();
}

/** Lower-cased text with all whitespace removed, plus a map from each kept character to its original offset. */
function fold(text: string): { folded: string; offsets: number[] } {
  let folded = '';
  const offsets: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (/\s/.test(char)) continue;
    const mapped = foldChar(char);
    for (const part of mapped) {
      folded += part;
      offsets.push(i);
    }
  }
  return { folded, offsets };
}

/**
 * Finds `sentence` inside `text`, ignoring case, whitespace, and typographic quote/dash differences.
 * PDF text often breaks lines or splits words differently from the model's copy, so whitespace is ignored entirely.
 * Returns offsets into the ORIGINAL text, or null when not found.
 */
export function locateSentence(text: string, sentence: string): TextRange | null {
  const needle = fold(sentence).folded;
  if (!needle) return null;
  const haystack = fold(text);
  const index = haystack.folded.indexOf(needle);
  if (index === -1) return null;
  const start = haystack.offsets[index];
  const end = haystack.offsets[index + needle.length - 1] + 1;
  return { start, end };
}

/**
 * Given the text of consecutive spans (as in a PDF.js text layer) and a range over their concatenation,
 * returns the indices of spans that overlap the range.
 */
export function spansOverlapping(spanTexts: string[], range: TextRange): number[] {
  const hit: number[] = [];
  let cursor = 0;
  spanTexts.forEach((text, index) => {
    const spanStart = cursor;
    const spanEnd = cursor + text.length;
    if (text.length > 0 && spanStart < range.end && spanEnd > range.start) hit.push(index);
    cursor = spanEnd;
  });
  return hit;
}

/** Convenience: locate a sentence across spans and return the overlapping span indices (empty when not found). */
export function findSpansForSentence(spanTexts: string[], sentence: string): number[] {
  const range = locateSentence(spanTexts.join(''), sentence);
  return range ? spansOverlapping(spanTexts, range) : [];
}
