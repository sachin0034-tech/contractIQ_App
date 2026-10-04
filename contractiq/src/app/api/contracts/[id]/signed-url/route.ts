import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { createSignedPdfUrl } from '@/services/contract.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async ({ supabase, user, params }) => {
  const signed = await createSignedPdfUrl(supabase, params.id, user.id);
  return NextResponse.json(signed, { headers: { 'Cache-Control': 'private, no-store' } });
});
