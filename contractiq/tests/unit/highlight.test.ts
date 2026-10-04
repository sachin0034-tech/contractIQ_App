import { describe, expect, it } from 'vitest';
import { findSpansForSentence, locateSentence, spansOverlapping } from '@/lib/pdf/highlight';

describe('locateSentence', () => {
  const text = 'Intro text.\nThe Receiving   Party shall keep\nall information “confidential”.\nOutro.';

  it('finds a sentence across line breaks, case and quote differences, returning original offsets', () => {
    const range = locateSentence(text, 'the receiving party shall keep all information "confidential".');
    expect(range).not.toBeNull();
    expect(text.slice(range!.start, range!.end)).toBe(
      'The Receiving   Party shall keep\nall information “confidential”.',
    );
  });

  it('returns null when the sentence is absent or empty', () => {
    expect(locateSentence(text, 'not in the text')).toBeNull();
    expect(locateSentence(text, '   ')).toBeNull();
  });
});

describe('findSpansForSentence', () => {
  it('maps a sentence onto the overlapping PDF text-layer spans, even when words are split across spans', () => {
    const spans = ['Intro ', 'The Recei', 'ving Party ', 'shall keep', ' all info', 'rmation.', ' Outro'];
    expect(findSpansForSentence(spans, 'The Receiving Party shall keep all information.')).toEqual([1, 2, 3, 4, 5]);
    expect(findSpansForSentence(spans, 'missing sentence')).toEqual([]);
  });

  it('skips empty spans', () => {
    expect(spansOverlapping(['ab', '', 'cd'], { start: 1, end: 3 })).toEqual([0, 2]);
  });
});
