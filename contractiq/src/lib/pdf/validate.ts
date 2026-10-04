const PDF_MAGIC = '%PDF-';

/** True when the buffer starts with the PDF header. */
export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false;
  for (let i = 0; i < PDF_MAGIC.length; i += 1) {
    if (bytes[i] !== PDF_MAGIC.charCodeAt(i)) return false;
  }
  return true;
}

/** Counts whitespace-separated words. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Normalises extracted page text: strips NUL and other control characters (Postgres rejects NUL),
 * unifies line endings, trims line ends and collapses 3 or more blank lines.
 */
export function normalizePageText(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Makes a user-supplied filename safe to use as a storage object name and display name. */
export function sanitizeFilename(original: string): string {
  const base = original.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .replace(/[^A-Za-z0-9._ -]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Work on the stem so ".pdf" or "..." cannot turn into a hidden or empty file name.
  const stem = cleaned
    .replace(/\.pdf$/i, '')
    .replace(/^[._\s-]+/, '')
    .slice(0, 116);
  return stem ? `${stem}.pdf` : 'contract.pdf';
}
