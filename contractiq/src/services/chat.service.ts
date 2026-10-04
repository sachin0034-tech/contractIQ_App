import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { CHAT_NOT_FOUND_PHRASE, MAX_CHAT_MESSAGE_CHARS } from '@/lib/constants';
import { limits } from '@/lib/config';
import { AppError } from '@/lib/errors';
import { getOwnedContract } from '@/lib/http';
import { logger } from '@/lib/logger';
import { calculateCostUsd } from '@/lib/ai/cost';
import type { LlmMessage } from '@/lib/ai/types';
import { getLlmClient } from '@/lib/azure';
import { buildChatMessages, CHAT_PROMPT_TOKEN_BUDGET, trimHistoryForBudget } from '@/lib/prompts/chat';
import { generateGroundedAnswer } from '@/lib/prompts/chat-answer';
import { classifyQuery } from '@/lib/prompts/classify-query';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { countTokens } from '@/lib/tokens';
import { findSessionId, getOrCreateSession, insertMessage, listMessages, touchSession } from '@/repositories/chat.repo';
import type { ContractRow } from '@/repositories/contracts.repo';
import type { ChatMessage } from '@/types/domain';

/** Sessions with a stream in flight. Best effort per server instance: stops rapid double sends. */
const activeSessions = new Set<string>();

export async function getChatHistory(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
): Promise<{ session_id: string | null; messages: ChatMessage[] }> {
  await getOwnedContract(supabase, contractId, userId, 'id');
  const sessionId = await findSessionId(supabase, contractId);
  if (!sessionId) return { session_id: null, messages: [] };
  return { session_id: sessionId, messages: await listMessages(supabase, sessionId, limits.maxChatHistory) };
}

type ChatContract = Pick<ContractRow, 'status' | 'contract_text' | 'page_count'>;

export interface ChatAnswer {
  session_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

/**
 * Answers a question about a contract. The question is stored first so it is never lost, the agent is called
 * with the stored contract text (never the PDF), and the answer is grounded in code before it is stored.
 * Failures surface as AppError (HTTP error envelope); a failed answer leaves the stored question in place so
 * an identical retry reuses it instead of duplicating it.
 */
export async function answerQuestion(input: {
  supabase: SupabaseClient;
  user: User;
  contractId: string;
  message: string;
  signal?: AbortSignal;
}): Promise<ChatAnswer> {
  const { supabase, user, contractId, signal } = input;
  const question = input.message.trim();
  if (question.length === 0) throw new AppError('INVALID_INPUT');
  if (question.length > MAX_CHAT_MESSAGE_CHARS) throw new AppError('MESSAGE_TOO_LONG');

  const contract = await getOwnedContract<ChatContract>(
    supabase,
    contractId,
    user.id,
    'status, contract_text, page_count',
  );
  if (contract.status !== 'completed') throw new AppError('CONTRACT_NOT_READY');

  await enforceRateLimit(supabase, 'chat');

  const sessionId = await getOrCreateSession(supabase, contractId, user.id);
  if (activeSessions.has(sessionId)) throw new AppError('RATE_LIMITED', { retryAfterSeconds: 2 });
  activeSessions.add(sessionId);

  try {
    // Load history, then persist the question. A retry of an identical, still unanswered question reuses
    // the stored message instead of duplicating it.
    let stored = await listMessages(supabase, sessionId, limits.maxChatHistory);
    const last = stored[stored.length - 1];
    let userMessage: ChatMessage;
    if (last && last.role === 'user' && last.content === question) {
      userMessage = last;
      stored = stored.slice(0, -1);
    } else {
      userMessage = await insertMessage(supabase, {
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: question,
      });
    }

    const classification = classifyQuery(question);
    const history: LlmMessage[] = stored.map((m) => ({ role: m.role, content: m.content }));
    const fixedTokens = countTokens(contract.contract_text) + countTokens(question) + 800;
    const trimmed = trimHistoryForBudget(history, fixedTokens, CHAT_PROMPT_TOKEN_BUDGET, countTokens);
    const messages = buildChatMessages({
      contractText: contract.contract_text,
      history: trimmed.history,
      question,
      classification,
      omittedHistory: trimmed.dropped > 0,
    });

    const startedAt = Date.now();
    const answer = await generateGroundedAnswer(getLlmClient(), messages, contract.page_count, signal);
    const { grounded } = answer;
    if (grounded.text.trim().length === 0) throw new AppError('AI_INVALID_OUTPUT');

    const assistantMessage = await insertMessage(supabase, {
      session_id: sessionId,
      user_id: user.id,
      role: 'assistant',
      content: grounded.text,
      cited_pages: grounded.cited_pages,
    });
    await touchSession(supabase, sessionId);

    logger.info({
      msg: 'chat_answered',
      contractId,
      classification,
      inputTokens: answer.inputTokens,
      outputTokens: answer.outputTokens,
      costUsd: calculateCostUsd(answer.inputTokens, answer.outputTokens),
      repaired: answer.repaired,
      latencyMs: Date.now() - startedAt,
      historyMessagesSent: trimmed.history.length,
      historyDropped: trimmed.dropped,
      notFound: grounded.text.includes(CHAT_NOT_FOUND_PHRASE),
      ungrounded: grounded.ungrounded,
      invalidCitations: grounded.invalid_citations,
    });

    return { session_id: sessionId, user_message: userMessage, assistant_message: assistantMessage };
  } finally {
    activeSessions.delete(sessionId);
  }
}
