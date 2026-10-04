import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, route } from '@/lib/http';
import { answerQuestion, getChatHistory } from '@/services/chat.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Length limits are enforced in the service so they map to MESSAGE_TOO_LONG.
const bodySchema = z.object({ message: z.string() });

export const GET = route(async ({ supabase, user, params }) => {
  const history = await getChatHistory(supabase, params.id, user.id);
  return NextResponse.json(history, { headers: { 'Cache-Control': 'private, no-store' } });
});

export const POST = route(async ({ req, supabase, user, params }) => {
  const { message } = await parseJson(req, bodySchema);
  const answer = await answerQuestion({ supabase, user, contractId: params.id, message, signal: req.signal });
  return NextResponse.json(answer);
});
