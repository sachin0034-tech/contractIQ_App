import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOwnedContract } from '@/lib/http';
import { findFeedbackId, insertFeedback, updateFeedback } from '@/repositories/feedback.repo';
import type { FeedbackRating, FeedbackRecord } from '@/types/domain';

/**
 * One feedback record per user per contract; submitting again edits it.
 * Done as find-then-write rather than an upsert because users may update only rating and comment.
 */
export async function saveFeedback(
  supabase: SupabaseClient,
  userId: string,
  contractId: string,
  rating: FeedbackRating,
  comment: string | null,
): Promise<FeedbackRecord> {
  await getOwnedContract(supabase, contractId, userId, 'id');
  const values = { rating, comment };

  const existing = await findFeedbackId(supabase, contractId, userId);
  if (existing) return updateFeedback(supabase, existing, values);

  const created = await insertFeedback(supabase, { user_id: userId, contract_id: contractId, ...values });
  if (created) return created;

  const racedId = await findFeedbackId(supabase, contractId, userId);
  return updateFeedback(supabase, racedId as string, values);
}
