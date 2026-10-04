import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rateLimits, type RateLimitBucket } from '@/lib/config';
import { AppError } from '@/lib/errors';

/**
 * Fixed-window per-user rate limit backed by the check_rate_limit() SQL function
 * (works across serverless instances). Throws RATE_LIMITED with a Retry-After hint.
 */
export async function enforceRateLimit(supabase: SupabaseClient, bucket: RateLimitBucket): Promise<void> {
  const { max, windowSeconds } = rateLimits[bucket];
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket: bucket,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new AppError('INTERNAL', { cause: error });
  }
  if (data !== true) {
    const retryAfterSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
    throw new AppError('RATE_LIMITED', { retryAfterSeconds });
  }
}
