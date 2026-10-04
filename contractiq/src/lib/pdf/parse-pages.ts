import type { ContractPage } from '@/types/domain';

/** A line that is exactly a page marker, e.g. "[PAGE 12]". */
const MARKER_LINE = /^\[PAGE (\d+)\]\s*$/;

/**
 * Normalises text for tolerant comparison: unifies typographic quotes and dashes, collapses all
 * whitespace (including non-breaking spaces) and lower-cases.
 */
export function normalizeForMatch(value: string): string {
  return value
    .replace(/[\u2018\u2019\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201f]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Builds the stored contract text:
 *   [PAGE 1]\n<text>\n\n[PAGE 2]\n<text>
 * Page text lines that happen to look like a marker are neutralised so parsing is lossless.
 */
export function buildMarkedText(pages: ContractPage[]): string {
  return pages
    .map((page) => {
      const safe = page.text
        .split('\n')
        .map((line) => (MARKER_LINE.test(line) ? line.replace('[PAGE', '[ PAGE') : line))
        .join('\n');
      return `[PAGE ${page.n}]\n${safe}`;
    })
    .join('\n\n');
}

/** Inverse of buildMarkedText. Returns pages ordered by page number. */
export function parsePages(markedText: string): ContractPage[] {
  const pages: ContractPage[] = [];
  let current: { n: number; lines: string[] } | null = null;

  for (const line of markedText.split('\n')) {
    const match = MARKER_LINE.exec(line);
    if (match) {
      if (current) pages.push({ n: current.n, text: current.lines.join('\n').replace(/\n+$/, '') });
      current = { n: Number.parseInt(match[1], 10), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) pages.push({ n: current.n, text: current.lines.join('\n').replace(/\n+$/, '') });

  return pages.sort((a, b) => a.n - b.n);
}

/** Returns the first page whose text contains the sentence (whitespace and case insensitive), or null. */
export function findPageForSentence(pages: ContractPage[], sentence: string): number | null {
  const needle = normalizeForMatch(sentence);
  if (!needle) return null;
  for (const page of pages) {
    if (normalizeForMatch(page.text).includes(needle)) return page.n;
  }
  return null;
}
