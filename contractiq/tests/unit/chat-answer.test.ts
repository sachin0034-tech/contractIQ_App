import { describe, expect, it } from 'vitest';
import type { LlmClient, LlmCompletion } from '@/lib/ai/types';
import { generateGroundedAnswer } from '@/lib/prompts/chat-answer';

function fakeLlm(texts: string[]) {
  const calls: number[] = [];
  const client: LlmClient = {
    async complete(): Promise<LlmCompletion> {
      calls.push(calls.length);
      return { text: texts[calls.length - 1] ?? '', inputTokens: 10, outputTokens: 5, finishReason: 'stop' };
    },
  };
  return { client, calls };
}

const messages = [{ role: 'user' as const, content: 'q' }];

describe('generateGroundedAnswer', () => {
  it('makes one call when the answer is cited', async () => {
    const { client, calls } = fakeLlm(['Based on the document, two years [Page 2].']);
    const result = await generateGroundedAnswer(client, messages, 3);
    expect(calls).toHaveLength(1);
    expect(result.repaired).toBe(false);
    expect(result.grounded.cited_pages).toEqual([2]);
    expect(result.inputTokens).toBe(10);
  });

  it('makes one call when the answer is the not-found sentence', async () => {
    const { client, calls } = fakeLlm(['I cannot find this in the document.']);
    const result = await generateGroundedAnswer(client, messages, 3);
    expect(calls).toHaveLength(1);
    expect(result.grounded.ungrounded).toBe(false);
  });

  it('repairs an uncited answer once and uses the repaired answer, summing token usage', async () => {
    const { client, calls } = fakeLlm(['Based on the document, there is no arbitration.', 'I cannot find this in the document.']);
    const result = await generateGroundedAnswer(client, messages, 3);
    expect(calls).toHaveLength(2);
    expect(result.repaired).toBe(true);
    expect(result.grounded.text).toBe('I cannot find this in the document.');
    expect(result.inputTokens).toBe(20);
    expect(result.outputTokens).toBe(10);
  });

  it('keeps the first answer (with the verify note) when the repair is still uncited, and never loops', async () => {
    const { client, calls } = fakeLlm(['Based on the document, answer one.', 'Based on the document, answer two.']);
    const result = await generateGroundedAnswer(client, messages, 3);
    expect(calls).toHaveLength(2);
    expect(result.grounded.text).toContain('answer one');
    expect(result.grounded.text).toContain('No page reference was returned');
  });

  it('keeps the first answer when the repair call returns nothing', async () => {
    const { client } = fakeLlm(['Based on the document, answer one.', '']);
    const result = await generateGroundedAnswer(client, messages, 3);
    expect(result.grounded.text).toContain('answer one');
  });
});
