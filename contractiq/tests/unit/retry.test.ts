import { describe, expect, it } from 'vitest';
import { withRetry } from '@/lib/ai/retry';

const retryable = (error: unknown) => error instanceof Error && error.message === 'transient';

function options(overrides: Partial<Parameters<typeof withRetry>[1]> = {}) {
  const sleeps: number[] = [];
  return {
    sleeps,
    opts: {
      attempts: 3,
      baseMs: 1000,
      factor: 2,
      jitter: 0,
      isRetryable: retryable,
      sleep: async (ms: number) => {
        sleeps.push(ms);
      },
      ...overrides,
    },
  };
}

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const { opts, sleeps } = options();
    await expect(withRetry(async () => 'ok', opts)).resolves.toBe('ok');
    expect(sleeps).toEqual([]);
  });

  it('retries with exponential backoff and then succeeds', async () => {
    const { opts, sleeps } = options();
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return 'done';
    }, opts);
    expect(result).toBe('done');
    expect(calls).toBe(3);
    expect(sleeps).toEqual([1000, 2000]);
  });

  it('gives up after the configured attempts and rethrows the last error', async () => {
    const { opts } = options();
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new Error('transient');
      }, opts),
    ).rejects.toThrow('transient');
    expect(calls).toBe(3);
  });

  it('does not retry non-retryable errors', async () => {
    const { opts } = options();
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new Error('bad request');
      }, opts),
    ).rejects.toThrow('bad request');
    expect(calls).toBe(1);
  });

  it('stops retrying once the deadline would be exceeded', async () => {
    let clock = 0;
    const { opts } = options({ deadlineMs: 1500, now: () => clock, sleep: async (ms) => void (clock += ms) });
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls += 1;
        throw new Error('transient');
      }, opts),
    ).rejects.toThrow('transient');
    // First retry waits 1000ms (within 1500). Second would need 2000ms more, so it stops.
    expect(calls).toBe(2);
  });
});
