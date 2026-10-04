import { describe, expect, it } from 'vitest';
import { buildChatMessages, buildSystemPrompt, trimHistoryForBudget } from '@/lib/prompts/chat';
import { enforceGrounding } from '@/lib/prompts/chat-check';
import { classifyQuery } from '@/lib/prompts/classify-query';

describe('classifyQuery', () => {
  const cases: Array<[string, 'contract' | 'history' | 'both']> = [
    ['Is there an auto-renewal clause?', 'contract'],
    ['What happens if I breach the NDA?', 'contract'],
    ['Who owns the intellectual property?', 'contract'],
    ['What is the notice period for termination?', 'contract'],
    ['Does the agreement cover indemnification?', 'contract'],
    ['hello', 'contract'],
    ['What did you say earlier?', 'history'],
    ['Can you repeat that?', 'history'],
    ['You mentioned something before, what was it?', 'history'],
    ['Summarize our conversation', 'history'],
    ['What was your last answer?', 'history'],
    ['What did I ask previously?', 'history'],
    ['Earlier you said the term is 2 years, which clause is that?', 'both'],
    ['You told me about liability before. Which section says it?', 'both'],
    ['Previously you cited the governing law page, is it page 2?', 'both'],
    ['Repeat that answer about payment terms', 'both'],
    ['Where is the confidentiality clause?', 'contract'],
    ['Can I terminate early?', 'contract'],
    ['Summarise this contract', 'contract'],
    ['What was in the last message about renewal?', 'both'],
  ];
  it.each(cases)('%s -> %s', (message, expected) => {
    expect(classifyQuery(message)).toBe(expected);
  });
});

describe('enforceGrounding', () => {
  it('keeps a well-formed cited answer unchanged', () => {
    const text = 'Based on the document, the term is 2 years [Page 2].';
    const result = enforceGrounding(text, 5);
    expect(result).toMatchObject({ text, cited_pages: [2], modified: false, ungrounded: false });
  });

  it('collects unique sorted pages across several citations', () => {
    const result = enforceGrounding('Based on the document, A [Page 5] and B [Page 2] and again [Page 5].', 6);
    expect(result.cited_pages).toEqual([2, 5]);
  });

  it('removes citations outside the document', () => {
    const result = enforceGrounding('Based on the document, it is annual [Page 2] [Page 99].', 5);
    expect(result.text).not.toContain('99');
    expect(result.cited_pages).toEqual([2]);
    expect(result.invalid_citations).toBe(1);
    expect(result.modified).toBe(true);
  });

  it('accepts the not-found phrase without a citation', () => {
    const result = enforceGrounding('I cannot find this in the document. You could check the schedules.', 5);
    expect(result.ungrounded).toBe(false);
    expect(result.cited_pages).toEqual([]);
    expect(result.text.startsWith('I cannot find')).toBe(true);
  });

  it('flags answers with no citation', () => {
    const result = enforceGrounding('Based on the document, the term is 2 years.', 5);
    expect(result.ungrounded).toBe(true);
    expect(result.text).toContain('No page reference was returned');
  });

  it('adds the required prefix and lower-cases a normal first letter, but keeps acronyms', () => {
    expect(enforceGrounding('The term is 2 years [Page 1].', 3).text).toBe(
      'Based on the document, the term is 2 years [Page 1].',
    );
    expect(enforceGrounding('NDA terms last 2 years [Page 1].', 3).text).toBe(
      'Based on the document, NDA terms last 2 years [Page 1].',
    );
  });
});

describe('trimHistoryForBudget', () => {
  const count = (text: string) => text.length;
  const msg = (n: number) => ({ role: (n % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant', content: 'x'.repeat(100) });
  const history = Array.from({ length: 6 }, (_, i) => msg(i));

  it('keeps everything when it fits', () => {
    expect(trimHistoryForBudget(history, 100, 10_000, count)).toEqual({ history, dropped: 0 });
  });

  it('drops the oldest messages in pairs until it fits', () => {
    const result = trimHistoryForBudget(history, 100, 100 + 3 * 104 + 10, count);
    expect(result.dropped).toBe(4);
    expect(result.history).toHaveLength(2);
  });

  it('can drop all history but never more', () => {
    expect(trimHistoryForBudget(history, 1_000_000, 10, count)).toMatchObject({ dropped: 6, history: [] });
  });
});

describe('buildChatMessages', () => {
  it('always includes the contract and orders system, contract, history, question', () => {
    const messages = buildChatMessages({
      contractText: '[PAGE 1]\nHello',
      history: [{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1' }],
      question: 'q2',
      classification: 'history',
      omittedHistory: true,
    });
    expect(messages.map((m) => m.role)).toEqual(['system', 'user', 'user', 'assistant', 'user']);
    expect(messages[1].content).toContain('<contract>\n[PAGE 1]\nHello\n</contract>');
    expect(messages[0].content).toContain('earlier conversation');
    expect(messages[0].content).toContain('Earlier messages were omitted for length.');
    expect(messages[4].content).toBe('q2');
  });

  it('adds no addendum for plain contract questions', () => {
    expect(buildSystemPrompt('contract', false)).not.toContain('earlier conversation');
  });
});
