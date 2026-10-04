import type { LlmMessage } from './types';

const LABEL: Record<LlmMessage['role'], string> = {
  system: 'SYSTEM',
  user: 'USER',
  assistant: 'ASSISTANT',
};

/**
 * The Foundry agent accepts a single user message and rejects `system`/`instructions` overrides, so the whole
 * conversation (rules, worked examples, history and the new request) is flattened into one transcript.
 */
export function flattenMessages(messages: LlmMessage[]): string {
  const transcript = messages
    .map((message) => `=== ${LABEL[message.role]} ===\n${message.content}`)
    .join('\n\n');

  return [
    'You are completing the final turn of the conversation transcript below.',
    'Follow the SYSTEM section exactly. Earlier USER and ASSISTANT turns are worked examples or prior conversation.',
    'Reply with only the next ASSISTANT message and nothing else.',
    '',
    transcript,
    '',
    '=== ASSISTANT (write this reply) ===',
  ].join('\n');
}
