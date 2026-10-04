import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import type { FeedbackRating, FeedbackRecord } from '@/types/domain';

function fail(error: unknown): never {
  throw new AppError('INTERNAL', { cause: error });
}

export async function findFeedbackId(supabase: SupabaseClient, contractId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('id')
    .eq('contract_id', contractId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) fail(error);
  return (data as { id: string } | null)?.id ?? null;
}

export async function updateFeedback(
  supabase: SupabaseClient,
  id: string,
  values: { rating: FeedbackRating; comment: string | null },
): Promise<FeedbackRecord> {
  const { data, error } = await supabase
    .from('user_feedback')
    .update(values)
    .eq('id', id)
    .select('rating, comment')
    .single();
  if (error) fail(error);
  return data as FeedbackRecord;
}

/** Returns null when a concurrent request already created the row (unique violation). */
export async function insertFeedback(
  supabase: SupabaseClient,
  row: { user_id: string; contract_id: string; rating: FeedbackRating; comment: string | null },
): Promise<FeedbackRecord | null> {
  const { data, error } = await supabase.from('user_feedback').insert(row).select('rating, comment').single();
  if (error) {
    if (error.code === '23505') return null;
    fail(error);
  }
  return data as FeedbackRecord;
}
