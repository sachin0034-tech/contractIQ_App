import { NextResponse } from 'next/server';
import { parseJson, route } from '@/lib/http';
import { customTermsRequestSchema } from '@/lib/validation/custom-terms';
import { setCustomTerms } from '@/services/contract.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Idempotent replace of the full custom term set. */
export const PUT = route(async ({ req, supabase, user, params }) => {
  const { terms } = await parseJson(req, customTermsRequestSchema);
  const custom = await setCustomTerms(supabase, params.id, user.id, terms);
  return NextResponse.json({ custom });
});
