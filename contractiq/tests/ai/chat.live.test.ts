// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getLlmClient } from '@/lib/azure';
import { buildChatMessages } from '@/lib/prompts/chat';
import { generateGroundedAnswer } from '@/lib/prompts/chat-answer';
import { classifyQuery } from '@/lib/prompts/classify-query';
import { buildMarkedText } from '@/lib/pdf/parse-pages';

// Live chat grounding check against the Azure AI Foundry agent (fictional contract).
// Run with: set -a; . ./.env.local; set +a; RUN_LIVE_AI=1 npx vitest run tests/ai
const live = process.env.RUN_LIVE_AI === '1' && !!process.env.AZURE_API_KEY && !!process.env.AZURE_AGENT_ENDPOINT;

const TEXT = buildMarkedText([
  { n: 1, text: 'MUTUAL NDA between Zephyr Robotics Inc. and Lumen Foods LLC, effective June 12, 2026.' },
  {
    n: 2,
    text: '3. Term. This Agreement continues for two (2) years from the Effective Date.\n4. Governing Law. This Agreement is governed by the laws of the State of Texas.',
  },
]);

async function ask(question: string) {
  const messages = buildChatMessages({
    contractText: TEXT,
    history: [],
    question,
    classification: classifyQuery(question),
    omittedHistory: false,
  });
  const answer = await generateGroundedAnswer(getLlmClient(), messages, 2);
  return { raw: answer.grounded.text, grounded: answer.grounded, repaired: answer.repaired };
}

describe.skipIf(!live)('live chat grounding via Azure AI Foundry agent', () => {
  it('answers an in-document question with a valid page citation', async () => {
    const { raw, grounded, repaired } = await ask('How long does the agreement last?');
    console.log('IN-DOC (repaired=' + repaired + '):', raw.slice(0, 300));
    expect(grounded.text.toLowerCase()).toContain('two');
    expect(grounded.cited_pages).toContain(2);
    expect(grounded.ungrounded).toBe(false);
  }, 90_000);

  it('says it cannot find information that is not in the document', async () => {
    const { raw, grounded, repaired } = await ask('Does this agreement require arbitration in Singapore?');
    console.log('NOT-IN-DOC (repaired=' + repaired + '):', raw.slice(0, 300));
    expect(grounded.text.toLowerCase()).toContain('cannot find this in the document');
  }, 90_000);
});
