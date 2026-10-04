export interface RetryOptions {
  attempts: number;
  baseMs: number;
  factor: number;
  /** Fraction of the delay randomised, e.g. 0.2 means plus or minus 20%. */
  jitter: number;
  /** Stop retrying once this much wall-clock time has passed since the first attempt. */
  deadlineMs?: number;
  isRetryable: (error: unknown) => boolean;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  random?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn`, retrying retryable failures with exponential backoff (base, base*factor, ...).
 * The last error is rethrown when attempts or the deadline are exhausted.
 */
export async function withRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const startedAt = now();

  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.isRetryable(error)) throw error;

      const base = options.baseMs * options.factor ** (attempt - 1);
      const delay = Math.round(base * (1 + (random() * 2 - 1) * options.jitter));
      if (options.deadlineMs !== undefined && now() - startedAt + delay > options.deadlineMs) throw error;
      await sleep(delay);
    }
  }
  throw lastError;
}
