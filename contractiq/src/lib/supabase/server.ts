import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSupabasePublicEnv } from '@/lib/config';

/**
 * Supabase client for Server Components and Route Handlers. Runs as the signed-in user,
 * so Row Level Security applies to every query.
 */
export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session, so ignoring this is safe.
        }
      },
    },
  });
}

export type ServerSupabaseClient = ReturnType<typeof createClient>;
