import { createBrowserClient } from '@supabase/ssr';
import { requireSupabasePublicEnv } from '@/lib/config';

/** Browser Supabase client (anon key, user session from cookies). */
export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
