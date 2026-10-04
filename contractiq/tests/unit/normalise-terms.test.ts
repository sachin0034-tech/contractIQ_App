import { describe, expect, it } from 'vitest';
import { normaliseConfidence, normaliseTerms, UNVERIFIED_CONFIDENCE_CAP } from '@/lib/extraction/normalise';
import type { RawExtractedTerm } from '@/lib/validation/extraction';

const pages = [
  { n: 1, text: 'MUTUAL NDA between Acme Inc. and Beta LLC.' },
  { n: 2, text: 'This Agreement shall be governed by the laws of the State of Delaware.\nTerm is two (2) years.' },
];

function raw(overrides: Partial<RawExtractedTerm> & { term_name: string }): RawExtractedTerm {
  return {
    value: 'Delaware',
    page_number: 2,
    confidence_score: 0.9,
    source_sentence: 'This Agreement shall be governed by the laws of the State of Delaware.',
    ...overrides,
  };
}

describe('normaliseConfidence', () => {
  it('handles both scales and clamps', () => {
    expect(normaliseConfidence(0.87654)).toBe(0.877);
    expect(normaliseConfidence(87)).toBe(0.87);
    expect(normaliseConfidence(100)).toBe(1);
    expect(normaliseConfidence(-1)).toBe(0);
  });
});

describe('normaliseTerms', () => {
  const requested = [
    { name: 'Governing Law', isCustom: false },
    { name: 'Term & Duration', isCustom: false },
    { name: 'Audit rights', isCustom: true },
  ];

  it('keeps request order, fills missing terms, and flags custom terms', () => {
    const { terms, stats } = normaliseTerms({
      requested,
      returned: [raw({ term_name: 'Governing Law' })],
      pages,
    });
    expect(terms.map((t) => t.term_name)).toEqual(['Governing Law', 'Term & Duration', 'Audit rights']);
    expect(terms.map((t) => t.sort_order)).toEqual([0, 1, 2]);
    expect(terms[1]).toMatchObject({ value: 'Not found in document', confidence_score: 0, page_number: null });
    expect(terms[2].is_custom).toBe(true);
    expect(stats).toMatchObject({ total: 3, notFound: 2, lowConfidence: 2, sentencesUnverified: 0 });
  });

  it('keeps confidence when the sentence is verbatim, and corrects the page from the text', () => {
    const { terms } = normaliseTerms({
      requested: [requested[0]],
      returned: [raw({ term_name: 'governing law', page_number: 1 })],
      pages,
    });
    expect(terms[0].confidence_score).toBe(0.9);
    expect(terms[0].page_number).toBe(2);
  });

  it('caps confidence below the low threshold when the sentence is not in the contract', () => {
    const { terms, stats } = normaliseTerms({
      requested: [requested[0]],
      returned: [raw({ term_name: 'Governing Law', source_sentence: 'Totally invented sentence.' })],
      pages,
    });
    expect(terms[0].confidence_score).toBe(UNVERIFIED_CONFIDENCE_CAP);
    expect(terms[0].confidence_score).toBeLessThan(0.5);
    expect(terms[0].source_sentence).toBe('Totally invented sentence.');
    expect(stats.sentencesUnverified).toBe(1);
    expect(stats.lowConfidence).toBe(1);
  });

  it('caps confidence when there is no source sentence at all', () => {
    const { terms } = normaliseTerms({
      requested: [requested[0]],
      returned: [raw({ term_name: 'Governing Law', source_sentence: null })],
      pages,
    });
    expect(terms[0].confidence_score).toBe(UNVERIFIED_CONFIDENCE_CAP);
  });

  it('matches sentences despite curly quotes, case and whitespace differences', () => {
    const { terms } = normaliseTerms({
      requested: [requested[0]],
      returned: [
        raw({
          term_name: 'Governing Law',
          source_sentence: 'THIS AGREEMENT  shall be governed by the laws of the State of Delaware.',
        }),
      ],
      pages,
    });
    expect(terms[0].confidence_score).toBe(0.9);
  });

  it('treats "Not found" variants as not found with zero confidence, and drops unrequested terms', () => {
    const { terms } = normaliseTerms({
      requested: [requested[1]],
      returned: [
        raw({ term_name: 'Term & Duration', value: 'Not found.', confidence_score: 0.9 }),
        raw({ term_name: 'Something Else' }),
      ],
      pages,
    });
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({ value: 'Not found in document', confidence_score: 0, source_sentence: null });
  });

  it('accepts confidence on a 0..100 scale and nulls a page outside the document', () => {
    const { terms } = normaliseTerms({
      requested: [requested[0]],
      returned: [raw({ term_name: 'Governing Law', confidence_score: 85, source_sentence: 'Invented.', page_number: 99 })],
      pages,
    });
    expect(terms[0].confidence_score).toBe(UNVERIFIED_CONFIDENCE_CAP);
    expect(terms[0].page_number).toBeNull();
  });
});
