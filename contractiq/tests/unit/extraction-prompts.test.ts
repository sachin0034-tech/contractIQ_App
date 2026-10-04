import { getEncoding } from 'js-tiktoken';
import { describe, expect, it } from 'vitest';
import { MSA_EXAMPLES } from '@/lib/prompts/fewshot/msa';
import { NDA_EXAMPLES } from '@/lib/prompts/fewshot/nda';
import { buildExtractionMessages, buildRepairMessages } from '@/lib/prompts/extraction';
import { parsePages } from '@/lib/pdf/parse-pages';
import { normalizeForMatch } from '@/lib/pdf/parse-pages';
import { normaliseTerms } from '@/lib/extraction/normalise';
import { extractionSchema, parseExtractionOutput } from '@/lib/validation/extraction';

describe('few-shot examples', () => {
  for (const [label, examples] of [
    ['NDA', NDA_EXAMPLES],
    ['MSA', MSA_EXAMPLES],
  ] as const) {
    it(`${label}: three examples, valid schema, verbatim sources, correct pages, one entry per term`, () => {
      expect(examples).toHaveLength(3);
      for (const example of examples) {
        expect(extractionSchema.safeParse(example.expected).success).toBe(true);
        expect(example.expected.terms.map((t) => t.term_name)).toEqual(example.terms);

        const pages = parsePages(example.excerpt);
        const plain = normalizeForMatch(pages.map((p) => p.text).join(' '));
        for (const term of example.expected.terms) {
          if (term.source_sentence === null) {
            expect(term.value).toBe('Not found in document');
            expect(term.confidence_score).toBe(0);
            continue;
          }
          expect(plain).toContain(normalizeForMatch(term.source_sentence));
          const page = pages.find((p) => normalizeForMatch(p.text).includes(normalizeForMatch(term.source_sentence as string)));
          expect(page?.n).toBe(term.page_number);
        }

        // The examples must survive our own grounding rules unchanged.
        const { terms } = normaliseTerms({
          requested: example.terms.map((name) => ({ name, isCustom: false })),
          returned: example.expected.terms,
          pages,
        });
        terms.forEach((term, i) => {
          expect(term.confidence_score).toBe(example.expected.terms[i].confidence_score);
        });
      }
    });
  }
});

describe('buildExtractionMessages', () => {
  const text = '[PAGE 1]\nSample contract text.';

  it('orders system, 3 example pairs, then the real request', () => {
    const messages = buildExtractionMessages({ type: 'NDA', text, customTerms: ['Audit rights'] });
    expect(messages).toHaveLength(1 + 6 + 1);
    expect(messages[0].role).toBe('system');
    expect(messages.slice(1, 7).map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user', 'assistant']);
    const last = messages[messages.length - 1];
    expect(last.role).toBe('user');
    expect(last.content).toContain('<contract>\n[PAGE 1]\nSample contract text.\n</contract>');
    expect(last.content).toContain('- Governing Law');
    expect(last.content).toContain('USER-REQUESTED TERMS\n- Audit rights');
  });

  it('lists "(none)" when there are no custom terms and uses the right type', () => {
    const messages = buildExtractionMessages({ type: 'MSA', text, customTerms: [] });
    expect(messages[0].content).toContain('from a MSA');
    expect(messages[messages.length - 1].content).toContain('USER-REQUESTED TERMS\n(none)');
    expect(messages[messages.length - 1].content).toContain('- Liability Cap');
  });

  it('keeps a worst-case prompt (15,000 token contract + 5 custom terms) under the 22,000 token guard', () => {
    const encoder = getEncoding('o200k_base');
    const filler = 'The Receiving Party shall keep all Confidential Information strictly confidential. ';
    let body = '[PAGE 1]\n';
    while (encoder.encode(body).length < 15_000) body += filler;
    const messages = buildExtractionMessages({
      type: 'MSA',
      text: body,
      customTerms: ['Audit rights', 'Non-compete radius', 'Data residency', 'Insurance minimums', 'Step-in rights'],
    });
    const tokens = encoder.encode(messages.map((m) => m.content).join('\n')).length;
    expect(tokens).toBeLessThan(22_000);
  });

  it('builds the repair turn', () => {
    const base = buildExtractionMessages({ type: 'NDA', text, customTerms: [] });
    const repair = buildRepairMessages(base, 'oops', { truncated: true });
    expect(repair).toHaveLength(base.length + 2);
    expect(repair[repair.length - 2]).toEqual({ role: 'assistant', content: 'oops' });
    expect(repair[repair.length - 1].content).toContain('not valid JSON');
    expect(repair[repair.length - 1].content).toContain('under 200 characters');
  });
});

describe('parseExtractionOutput', () => {
  it('accepts valid output and rejects malformed or invalid output', () => {
    const valid = JSON.stringify({
      detected_type: 'NDA',
      terms: [{ term_name: 'Parties', value: 'A and B', page_number: 1, confidence_score: 0.9, source_sentence: 'A and B.' }],
    });
    expect(parseExtractionOutput(valid)?.terms).toHaveLength(1);
    expect(parseExtractionOutput('not json')).toBeNull();
    expect(parseExtractionOutput('{"detected_type":"LEASE","terms":[]}')).toBeNull();
    expect(parseExtractionOutput('{"detected_type":"NDA","terms":[{"term_name":"x"}]}')).toBeNull();
  });
});
