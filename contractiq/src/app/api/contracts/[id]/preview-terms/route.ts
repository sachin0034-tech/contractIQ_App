import { NextResponse } from 'next/server';
import { route } from '@/lib/http';
import { getTermPreview } from '@/services/contract.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = route(async ({ supabase, user, params }) => {
  const preview = await getTermPreview(supabase, params.id, user.id);
  return NextResponse.json(preview);
});
