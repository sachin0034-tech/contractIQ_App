import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireSupabasePublicEnv } from '@/lib/config';

/**
 * Service role client. Bypasses RLS. Only the retention cron route may import this
 * (enforced by the no-restricted-imports lint rule). Never use it for user-facing queries.
 */
export function createAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  return createSupabaseClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
