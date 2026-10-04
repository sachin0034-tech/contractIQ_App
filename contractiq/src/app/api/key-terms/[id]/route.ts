import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MAX_TERM_VALUE_CHARS } from '@/lib/constants';
import { parseJson, route } from '@/lib/http';
import { editKeyTerm } from '@/services/keyTerms.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  value: z.string().trim().min(1, 'Value cannot be empty').max(MAX_TERM_VALUE_CHARS, 'Value is too long'),
});

export const PATCH = route(async ({ req, supabase, user, params }) => {
  const { value } = await parseJson(req, patchSchema);
  const term = await editKeyTerm(supabase, user.id, params.id, value);
  return NextResponse.json(term);
});
