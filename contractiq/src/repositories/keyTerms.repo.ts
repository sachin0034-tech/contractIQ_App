import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import type { NormalisedTerm } from '@/lib/extraction/normalise';
import { KEY_TERM_COLUMNS, type KeyTermRow } from '@/repositories/contracts.repo';

export async function deleteKeyTerms(supabase: SupabaseClient, contractId: string): Promise<void> {
  const { error } = await supabase.from('key_terms').delete().eq('contract_id', contractId);
  if (error) throw new AppError('INTERNAL', { cause: error });
}

/** Inserts extracted terms. original_value is the AI value and is immutable afterwards. */
export async function insertKeyTerms(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
  terms: NormalisedTerm[],
): Promise<void> {
  if (terms.length === 0) return;
  const { error } = await supabase.from('key_terms').insert(
    terms.map((term) => ({
      contract_id: contractId,
      user_id: userId,
      term_name: term.term_name,
      original_value: term.value,
      page_number: term.page_number,
      confidence_score: term.confidence_score,
      source_sentence: term.source_sentence,
      is_custom: term.is_custom,
      sort_order: term.sort_order,
    })),
  );
  if (error) throw new AppError('INTERNAL', { cause: error });
}

export async function findOwnedKeyTerm(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<{ id: string; original_value: string } | null> {
  const { data, error } = await supabase
    .from('key_terms')
    .select('id, original_value')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new AppError('INTERNAL', { cause: error });
  return (data as { id: string; original_value: string } | null) ?? null;
}

/** Updates only the user-editable columns (column grants enforce this in the database too). */
export async function updateKeyTermEdit(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  edit: { edited_value: string | null; is_edited: boolean; edited_at: string | null },
): Promise<KeyTermRow> {
  const { data, error } = await supabase
    .from('key_terms')
    .update(edit)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KEY_TERM_COLUMNS)
    .maybeSingle();
  if (error) throw new AppError('INTERNAL', { cause: error });
  if (!data) throw new AppError('NOT_FOUND');
  return data as unknown as KeyTermRow;
}
