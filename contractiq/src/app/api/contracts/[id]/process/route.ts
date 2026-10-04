import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { processContract } from '@/services/extraction.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Runs extraction for a contract. Idempotent: a completed contract returns its stored terms. */
export const POST = route(async ({ supabase, user, params }) => {
  const result = await processContract(supabase, user, params.id);
  return NextResponse.json(result);
});
