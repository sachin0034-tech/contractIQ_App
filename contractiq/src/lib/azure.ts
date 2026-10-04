import 'server-only';
import OpenAI from 'openai';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { withRetry } from './ai/retry';
import {
  AzureConfigError,
  extractOutputText,
  normalizeAgentEndpoint,
  type AzureResponseLike,
} from './ai/azure-helpers';
import { flattenMessages } from './ai/flatten';
import type { LlmClient, LlmCompletion, LlmCompletionRequest } from './ai/types';

/** `v1` is the documented default for agent endpoints. Override with AZURE_API_VERSION if Azure rotates it. */
const DEFAULT_API_VERSION = 'v1';
const DEFAULT_TIMEOUT_MS = 55_000;
/** Total wall-clock budget for one logical call including retries (routes allow 60 seconds). */
const RETRY_DEADLINE_MS = 55_000;

/** The agent has its own model configured in Foundry. `model` and `instructions` must never be sent. */
interface AgentResponses {
  create(
    body: { input: Array<{ role: 'user'; content: string }>; store: false },
    options?: { timeout?: number; signal?: AbortSignal },
  ): Promise<AzureResponseLike>;
}

function statusOf(error: unknown): number | undefined {
  return error instanceof OpenAI.APIError ? error.status : undefined;
}

function isTimeout(error: unknown): boolean {
  return error instanceof OpenAI.APIConnectionTimeoutError;
}

/** 429, 5xx, network errors and timeouts are worth retrying; other 4xx are configuration or request problems. */
export function isRetryableAzureError(error: unknown): boolean {
  if (isTimeout(error)) return true;
  if (error instanceof OpenAI.APIConnectionError) return true;
  const status = statusOf(error);
  return status === 429 || (status !== undefined && status >= 500);
}

/**
 * Maps a provider failure to the user-facing AppError. The real Azure message is kept as `detail`
 * so credential and endpoint problems can be diagnosed (it is only returned to clients outside production).
 */
export function toAzureAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const detail = error instanceof Error ? error.message : 'Unknown error';
  if (isTimeout(error)) return new AppError('AI_TIMEOUT', { cause: error, detail });
  if (statusOf(error) === 400) return new AppError('AI_INVALID_OUTPUT', { cause: error, detail });
  return new AppError('AI_UNAVAILABLE', { cause: error, detail });
}

function readTimeoutMs(): number {
  const parsed = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_MS ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

class AzureAgentClient implements LlmClient {
  private readonly responses: AgentResponses;
  private readonly timeoutMs = readTimeoutMs();

  constructor(apiKey: string, baseURL: string, apiVersion: string) {
    const client = new OpenAI({
      apiKey,
      baseURL,
      // Azure requires the key both as the standard bearer credential and as an api-key header.
      defaultHeaders: { 'api-key': apiKey },
      defaultQuery: { 'api-version': apiVersion },
      // Retry policy lives in withRetry so it is explicit and testable.
      maxRetries: 0,
    });
    // The SDK's types require `model`, which Azure rejects for agents, so the call is typed narrowly instead.
    this.responses = client.responses as unknown as AgentResponses;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletion> {
    const input = [{ role: 'user' as const, content: flattenMessages(request.messages) }];
    try {
      return await withRetry(
        async (attempt) => {
          if (attempt > 1) logger.warn({ msg: 'llm_retry', attempt });
          // store:false keeps contract content out of the agent's memory store (verified against the agent endpoint:
          // content sent with store:false is never recalled in later calls).
          const response = await this.responses.create(
            { input, store: false },
            { timeout: this.timeoutMs, signal: request.signal },
          );
          if (response.status === 'failed') {
            throw new Error(response.error?.message ?? 'The agent run failed.');
          }
          return {
            text: extractOutputText(response),
            inputTokens: response.usage?.input_tokens ?? 0,
            outputTokens: response.usage?.output_tokens ?? 0,
            finishReason: response.status === 'incomplete' ? ('length' as const) : ('stop' as const),
          };
        },
        {
          attempts: 3,
          baseMs: 1000,
          factor: 2,
          jitter: 0.2,
          deadlineMs: RETRY_DEADLINE_MS,
          isRetryable: isRetryableAzureError,
        },
      );
    } catch (error) {
      logger.error({
        msg: 'llm_call_failed',
        status: statusOf(error),
        reason: error instanceof Error ? error.message : 'unknown',
      });
      throw toAzureAppError(error);
    }
  }
}

let cached: LlmClient | null = null;

/** Returns the Azure AI Foundry agent client. Fails with AI_UNAVAILABLE when credentials are missing or malformed. */
export function getLlmClient(): LlmClient {
  if (cached) return cached;
  const apiKey = process.env.AZURE_API_KEY;
  const endpoint = process.env.AZURE_AGENT_ENDPOINT;
  if (!apiKey || !endpoint) {
    logger.error({ msg: 'azure_credentials_missing', hasKey: Boolean(apiKey), hasEndpoint: Boolean(endpoint) });
    throw new AppError('AI_UNAVAILABLE', { detail: 'AZURE_API_KEY and AZURE_AGENT_ENDPOINT must both be set.' });
  }
  try {
    cached = new AzureAgentClient(
      apiKey,
      normalizeAgentEndpoint(endpoint),
      process.env.AZURE_API_VERSION || DEFAULT_API_VERSION,
    );
  } catch (error) {
    if (error instanceof AzureConfigError) {
      logger.error({ msg: 'azure_config_invalid', reason: error.message });
      throw new AppError('AI_UNAVAILABLE', { detail: error.message });
    }
    throw error;
  }
  return cached;
}
