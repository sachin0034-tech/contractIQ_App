import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { toKeyTerm } from '@/repositories/contracts.repo';
import { findOwnedKeyTerm, updateKeyTermEdit } from '@/repositories/keyTerms.repo';
import type { KeyTerm } from '@/types/domain';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves a user's correction. original_value (the AI value) is never modified. Setting the value back to
 * the AI value clears the edit state, so "Revert to AI value" is just another edit.
 */
export async function editKeyTerm(
  supabase: SupabaseClient,
  userId: string,
  termId: string,
  value: string,
): Promise<KeyTerm> {
  if (!UUID.test(termId)) throw new AppError('NOT_FOUND');
  await enforceRateLimit(supabase, 'edit');

  const existing = await findOwnedKeyTerm(supabase, termId, userId);
  if (!existing) throw new AppError('NOT_FOUND');

  const row =
    value === existing.original_value
      ? await updateKeyTermEdit(supabase, termId, userId, { edited_value: null, is_edited: false, edited_at: null })
      : await updateKeyTermEdit(supabase, termId, userId, {
          edited_value: value,
          is_edited: true,
          edited_at: new Date().toISOString(),
        });
  return toKeyTerm(row);
}
