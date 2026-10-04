import type { LlmClient, LlmMessage } from '@/lib/ai/types';
import { enforceGrounding, type GroundingResult } from './chat-check';

const REPAIR_INSTRUCTION =
  'Your answer did not include a page citation. Rewrite it so every claim ends with [Page X], using only the contract text. ' +
  'If the contract does not contain the answer, reply exactly: I cannot find this in the document. ' +
  'Do not say the document "does not require", "does not mention" or "does not include" something; use that exact sentence instead.';

export interface GroundedAnswer {
  grounded: GroundingResult;
  inputTokens: number;
  outputTokens: number;
  /** True when a second call was needed to obtain citations or the not-found sentence. */
  repaired: boolean;
}

/**
 * Gets an answer and enforces the grounding contract. Some models (notably tool-equipped Foundry agents) ignore
 * the citation rule, so an uncited answer gets exactly one repair attempt before the best answer is returned
 * (with a visible "verify this" note added by enforceGrounding if it is still uncited).
 */
export async function generateGroundedAnswer(
  llm: LlmClient,
  messages: LlmMessage[],
  pageCount: number,
  signal?: AbortSignal,
): Promise<GroundedAnswer> {
  const first = await llm.complete({ messages, signal });
  const firstGrounded = enforceGrounding(first.text, pageCount);
  if (!firstGrounded.ungrounded || first.text.trim().length === 0) {
    return {
      grounded: firstGrounded,
      inputTokens: first.inputTokens,
      outputTokens: first.outputTokens,
      repaired: false,
    };
  }

  const second = await llm.complete({
    messages: [...messages, { role: 'assistant', content: first.text }, { role: 'user', content: REPAIR_INSTRUCTION }],
    signal,
  });
  const secondGrounded = enforceGrounding(second.text, pageCount);
  const best = second.text.trim().length > 0 && !secondGrounded.ungrounded ? secondGrounded : firstGrounded;

  return {
    grounded: best,
    inputTokens: first.inputTokens + second.inputTokens,
    outputTokens: first.outputTokens + second.outputTokens,
    repaired: true,
  };
}
