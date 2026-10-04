import { NextResponse } from 'next/server';
import { getSupabasePublicEnv } from '@/lib/config';
import { publicRoute } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function pingSupabase(): Promise<boolean> {
  const env = getSupabasePublicEnv();
  if (!env) return false;
  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.anonKey },
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const GET = publicRoute(async () => {
  const supabase = await pingSupabase();
  return NextResponse.json({ ok: true, supabase, time: new Date().toISOString() });
});
