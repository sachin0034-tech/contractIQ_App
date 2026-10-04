import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, route } from '@/lib/http';
import { saveFeedback } from '@/services/feedback.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const feedbackSchema = z.object({
  rating: z.enum(['up', 'down']),
  comment: z
    .string()
    .trim()
    .max(2000, 'Comment is too long')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const POST = route(async ({ req, supabase, user, params }) => {
  const { rating, comment } = await parseJson(req, feedbackSchema);
  const saved = await saveFeedback(supabase, user.id, params.id, rating, comment);
  return NextResponse.json(saved);
});
