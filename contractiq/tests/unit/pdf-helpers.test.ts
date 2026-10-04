import { describe, expect, it } from 'vitest';
import { buildMarkedText, findPageForSentence, parsePages } from '@/lib/pdf/parse-pages';
import { countWords, hasPdfMagicBytes, normalizePageText, sanitizeFilename } from '@/lib/pdf/validate';
import { safeNext } from '@/lib/validation/redirect';

describe('parsePages / buildMarkedText', () => {
  it('round-trips pages', () => {
    const pages = [
      { n: 1, text: 'First page\nsecond line' },
      { n: 2, text: '' },
      { n: 3, text: 'Third page mentions [PAGE inside a line] safely' },
    ];
    expect(parsePages(buildMarkedText(pages))).toEqual(pages);
  });

  it('neutralises a line that looks like a page marker', () => {
    const pages = [{ n: 1, text: 'intro\n[PAGE 9]\noutro' }];
    const parsed = parsePages(buildMarkedText(pages));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toContain('outro');
  });

  it('finds the page for a sentence ignoring case and whitespace', () => {
    const pages = [
      { n: 1, text: 'Nothing here' },
      { n: 2, text: 'The Receiving   Party shall keep\nall information confidential.' },
    ];
    expect(findPageForSentence(pages, 'the receiving party shall keep all information confidential.')).toBe(2);
    expect(findPageForSentence(pages, 'not present')).toBeNull();
  });
});

describe('validate helpers', () => {
  it('detects PDF magic bytes', () => {
    expect(hasPdfMagicBytes(Buffer.from('%PDF-1.7 rest'))).toBe(true);
    expect(hasPdfMagicBytes(Buffer.from('hello world'))).toBe(false);
    expect(hasPdfMagicBytes(Buffer.from('%PD'))).toBe(false);
  });

  it('counts words', () => {
    expect(countWords('  one two\nthree  ')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });

  it('strips NUL and collapses blank lines', () => {
    expect(normalizePageText('a\u0000b\r\n\r\n\r\n\r\nc  ')).toBe('ab\n\nc');
  });

  it('sanitises filenames', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd.pdf');
    expect(sanitizeFilename('Acme NDA (final).pdf')).toBe('Acme NDA _final_.pdf');
    expect(sanitizeFilename('')).toBe('contract.pdf');
    expect(sanitizeFilename('.pdf')).toBe('contract.pdf');
    expect(sanitizeFilename(`${'a'.repeat(300)}.pdf`)).toHaveLength(120);
  });
});

describe('safeNext', () => {
  it('accepts same-origin relative paths only', () => {
    expect(safeNext('/contracts/new?resume=1')).toBe('/contracts/new?resume=1');
    expect(safeNext('//evil.com')).toBe('/dashboard');
    expect(safeNext('https://evil.com')).toBe('/dashboard');
    expect(safeNext('/\\evil.com')).toBe('/dashboard');
    expect(safeNext(null)).toBe('/dashboard');
  });
});
