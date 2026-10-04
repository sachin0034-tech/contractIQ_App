import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import { getOwnedContract } from '@/lib/http';
import { logger } from '@/lib/logger';
import { normaliseTerms, type RequestedTerm } from '@/lib/extraction/normalise';
import { calculateCostUsd, COST_ALERT_USD, COST_WARN_USD } from '@/lib/ai/cost';
import type { LlmClient, LlmCompletion, LlmMessage } from '@/lib/ai/types';
import { getLlmClient } from '@/lib/azure';
import { parsePages } from '@/lib/pdf/parse-pages';
import { buildExtractionMessages, buildRepairMessages } from '@/lib/prompts/extraction';
import { STANDARD_TERMS } from '@/lib/prompts/terms';
import { PROMPT_VERSION } from '@/lib/prompts/version';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { countTokens } from '@/lib/tokens';
import { parseExtractionOutput, type ExtractionOutput } from '@/lib/validation/extraction';
import {
  claimContractForProcessing,
  completeContract,
  listCustomTerms,
  listKeyTerms,
  setContractStatus,
  type ContractRow,
} from '@/repositories/contracts.repo';
import { deleteKeyTerms, insertKeyTerms } from '@/repositories/keyTerms.repo';
import type { DetectedType, KeyTerm } from '@/types/domain';
import { STALE_PROCESSING_MS } from './contract.service';

/**
 * Upper bound for the full prompt (system rules, few-shot examples, a 15,000 token contract, terms).
 * Slightly above the 20,000 in the spec because the few-shot examples alone use about 3,000 tokens.
 */
const MAX_PROMPT_TOKENS = 37_000;

export interface ProcessResult {
  status: 'completed';
  terms: KeyTerm[];
  detected_type: DetectedType;
  type_mismatch: boolean;
  processing_ms: number;
}

type ProcessRow = Pick<ContractRow, 'status' | 'updated_at' | 'detected_type' | 'contract_type'> & {
  processing_ms: number | null;
};

function isTypeMismatch(selected: ContractRow['contract_type'], detected: DetectedType): boolean {
  return detected !== selected;
}

/** Calls the model, then makes at most one repair attempt if the output is not valid JSON. */
async function extractWithRepair(
  llm: LlmClient,
  messages: LlmMessage[],
): Promise<{ output: ExtractionOutput; inputTokens: number; outputTokens: number; repaired: boolean }> {
  const call = (msgs: LlmMessage[]) => llm.complete({ messages: msgs });
  const parse = (completion: LlmCompletion) =>
    completion.finishReason === 'length' ? null : parseExtractionOutput(completion.text);

  const first = await call(messages);
  const firstParsed = parse(first);
  if (firstParsed) {
    return { output: firstParsed, inputTokens: first.inputTokens, outputTokens: first.outputTokens, repaired: false };
  }

  const second = await call(buildRepairMessages(messages, first.text, { truncated: first.finishReason === 'length' }));
  const secondParsed = parse(second);
  if (!secondParsed) throw new AppError('AI_INVALID_OUTPUT');
  return {
    output: secondParsed,
    inputTokens: first.inputTokens + second.inputTokens,
    outputTokens: first.outputTokens + second.outputTokens,
    repaired: true,
  };
}

/**
 * Runs key term extraction for a contract: claims it atomically, calls the model with the stored text
 * (never the PDF), validates and grounds the output in code, and stores the terms.
 * On any failure the contract is left in status "error" with no partial terms, so it can be retried.
 */
export async function processContract(
  supabase: SupabaseClient,
  user: User,
  contractId: string,
): Promise<ProcessResult> {
  const row = await getOwnedContract<ProcessRow>(
    supabase,
    contractId,
    user.id,
    'status, updated_at, detected_type, processing_ms, contract_type',
  );

  if (row.status === 'completed') {
    const detected = row.detected_type ?? row.contract_type;
    return {
      status: 'completed',
      terms: await listKeyTerms(supabase, contractId),
      detected_type: detected,
      type_mismatch: isTypeMismatch(row.contract_type, detected),
      processing_ms: row.processing_ms ?? 0,
    };
  }

  if (row.status === 'processing') {
    if (Date.now() - new Date(row.updated_at).getTime() <= STALE_PROCESSING_MS) {
      throw new AppError('ALREADY_PROCESSING');
    }
    // A previous run crashed without finishing; allow a fresh attempt.
    await setContractStatus(supabase, contractId, 'error', 'AI_TIMEOUT');
  }

  await enforceRateLimit(supabase, 'process');

  const input = await claimContractForProcessing(supabase, contractId, user.id);
  if (!input) throw new AppError('ALREADY_PROCESSING');

  const startedAt = Date.now();
  try {
    const customTerms = (await listCustomTerms(supabase, contractId)).map((term) => term.term_name);
    const messages = buildExtractionMessages({
      type: input.contract_type,
      text: input.contract_text,
      customTerms,
    });

    const promptTokens = countTokens(messages.map((message) => message.content).join('\n'));
    if (promptTokens > MAX_PROMPT_TOKENS) throw new AppError('CONTRACT_TOO_LONG');

    const { output, inputTokens, outputTokens, repaired } = await extractWithRepair(
      getLlmClient(),
      messages,
    );

    const requested: RequestedTerm[] = [
      ...STANDARD_TERMS[input.contract_type].map((name) => ({ name, isCustom: false })),
      ...customTerms.map((name) => ({ name, isCustom: true })),
    ];
    const { terms, stats } = normaliseTerms({
      requested,
      returned: output.terms,
      pages: parsePages(input.contract_text),
    });

    await deleteKeyTerms(supabase, contractId);
    await insertKeyTerms(supabase, contractId, user.id, terms);

    const costUsd = calculateCostUsd(inputTokens, outputTokens);
    const processingMs = Date.now() - startedAt;
    await completeContract(supabase, contractId, {
      detected_type: output.detected_type,
      prompt_version: PROMPT_VERSION,
      token_usage: { input: inputTokens, output: outputTokens, cost_usd: costUsd },
      processing_ms: processingMs,
    });

    const { error: counterError } = await supabase.rpc('increment_analyses_count');
    if (counterError) logger.warn({ msg: 'analyses_counter_failed', reason: counterError.message });

    const metrics = {
      msg: 'extraction_completed',
      contractId,
      promptVersion: PROMPT_VERSION,
      inputTokens,
      outputTokens,
      costUsd,
      latencyMs: processingMs,
      repairRetry: repaired,
      termsTotal: stats.total,
      termsNotFound: stats.notFound,
      termsLowConfidence: stats.lowConfidence,
      sentencesUnverified: stats.sentencesUnverified,
    };
    if (costUsd > COST_ALERT_USD) logger.error({ ...metrics, alert: 'cost_above_ceiling' });
    else if (costUsd > COST_WARN_USD) logger.warn({ ...metrics, alert: 'cost_above_budget' });
    else logger.info(metrics);

    return {
      status: 'completed',
      terms: await listKeyTerms(supabase, contractId),
      detected_type: output.detected_type,
      type_mismatch: isTypeMismatch(input.contract_type, output.detected_type),
      processing_ms: processingMs,
    };
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('INTERNAL', { cause: error });
    try {
      await deleteKeyTerms(supabase, contractId);
      await setContractStatus(supabase, contractId, 'error', appError.code);
    } catch (cleanupError) {
      logger.error({ msg: 'extraction_cleanup_failed', contractId, err: cleanupError });
    }
    throw appError;
  }
}
