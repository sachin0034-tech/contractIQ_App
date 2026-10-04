import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import type {
  ChatMessage,
  ContractStatus,
  ContractSummary,
  ContractType,
  CustomTerm,
  DetectedType,
  FeedbackRecord,
  KeyTerm,
} from '@/types/domain';

export interface ContractRow {
  id: string;
  user_id: string;
  name: string;
  contract_type: ContractType;
  detected_type: DetectedType | null;
  status: ContractStatus;
  error_code: string | null;
  contract_text: string;
  page_count: number;
  token_count: number;
  file_size_bytes: number;
  file_path: string | null;
  created_at: string;
  updated_at: string;
}

export type ContractListSort = 'created_at' | 'name' | 'contract_type';

const SUMMARY_COLUMNS = 'id, name, contract_type, status, created_at, page_count';

function fail(error: unknown): never {
  throw new AppError('INTERNAL', { cause: error });
}

export async function insertContract(
  supabase: SupabaseClient,
  row: {
    id: string;
    user_id: string;
    name: string;
    contract_type: ContractType;
    contract_text: string;
    page_count: number;
    token_count: number;
    file_size_bytes: number;
  },
): Promise<void> {
  const { error } = await supabase.from('contracts').insert(row);
  if (error) fail(error);
}

export async function setContractFilePath(supabase: SupabaseClient, id: string, filePath: string): Promise<void> {
  const { error } = await supabase.from('contracts').update({ file_path: filePath }).eq('id', id);
  if (error) fail(error);
}

export async function setContractStatus(
  supabase: SupabaseClient,
  id: string,
  status: ContractStatus,
  errorCode: string | null,
): Promise<void> {
  const { error } = await supabase.from('contracts').update({ status, error_code: errorCode }).eq('id', id);
  if (error) fail(error);
}

export interface ProcessingInput {
  id: string;
  contract_type: ContractType;
  contract_text: string;
}

/**
 * Atomically moves a contract from uploaded/error to processing and returns what the AI run needs.
 * Returns null when another request already claimed it (or it is completed).
 */
export async function claimContractForProcessing(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<ProcessingInput | null> {
  const { data, error } = await supabase
    .from('contracts')
    .update({ status: 'processing', error_code: null })
    .eq('id', id)
    .eq('user_id', userId)
    .in('status', ['uploaded', 'error'])
    .select('id, contract_type, contract_text')
    .maybeSingle();
  if (error) fail(error);
  return (data as ProcessingInput | null) ?? null;
}

export async function completeContract(
  supabase: SupabaseClient,
  id: string,
  result: {
    detected_type: DetectedType;
    prompt_version: string;
    token_usage: { input: number; output: number; cost_usd: number };
    processing_ms: number;
  },
): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ status: 'completed', error_code: null, ...result })
    .eq('id', id);
  if (error) fail(error);
}

export async function touchContract(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from('contracts')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) fail(error);
}

export async function listContracts(
  supabase: SupabaseClient,
  userId: string,
  options: { sort: ContractListSort; ascending: boolean; limit: number; offset: number },
): Promise<ContractSummary[]> {
  let query = supabase.from('contracts').select(SUMMARY_COLUMNS).eq('user_id', userId);
  query = query.order(options.sort, { ascending: options.ascending });
  if (options.sort !== 'created_at') query = query.order('created_at', { ascending: false });
  query = query.order('id', { ascending: true }).range(options.offset, options.offset + options.limit - 1);

  const { data, error } = await query;
  if (error) fail(error);
  return (data ?? []) as ContractSummary[];
}

export async function deleteContractRow(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) fail(error);
}

export async function listCustomTerms(supabase: SupabaseClient, contractId: string): Promise<CustomTerm[]> {
  const { data, error } = await supabase
    .from('custom_key_terms')
    .select('id, term_name')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: true });
  if (error) fail(error);
  return (data ?? []) as CustomTerm[];
}

/** Replaces the whole custom term set. The database trigger enforces the maximum of 5. */
export async function replaceCustomTerms(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
  terms: string[],
): Promise<CustomTerm[]> {
  const { error: deleteError } = await supabase.from('custom_key_terms').delete().eq('contract_id', contractId);
  if (deleteError) fail(deleteError);
  if (terms.length === 0) return [];

  const { data, error } = await supabase
    .from('custom_key_terms')
    .insert(terms.map((term_name) => ({ contract_id: contractId, user_id: userId, term_name })))
    .select('id, term_name');
  if (error) {
    if (error.code === '23505') throw new AppError('INVALID_TERM');
    if (error.code === '23514' || /TOO_MANY_CUSTOM_TERMS/.test(error.message)) {
      throw new AppError('TOO_MANY_CUSTOM_TERMS');
    }
    fail(error);
  }
  return (data ?? []) as CustomTerm[];
}

export interface KeyTermRow {
  id: string;
  term_name: string;
  original_value: string;
  edited_value: string | null;
  is_edited: boolean;
  page_number: number | null;
  confidence_score: number | string;
  source_sentence: string | null;
  is_custom: boolean;
  sort_order: number;
}

export function toKeyTerm(row: KeyTermRow): KeyTerm {
  return {
    id: row.id,
    term_name: row.term_name,
    value: row.edited_value ?? row.original_value,
    original_value: row.original_value,
    is_edited: row.is_edited,
    page_number: row.page_number,
    confidence_score: Number(row.confidence_score),
    source_sentence: row.source_sentence,
    is_custom: row.is_custom,
    sort_order: row.sort_order,
  };
}

export const KEY_TERM_COLUMNS =
  'id, term_name, original_value, edited_value, is_edited, page_number, confidence_score, source_sentence, is_custom, sort_order';

export async function listKeyTerms(supabase: SupabaseClient, contractId: string): Promise<KeyTerm[]> {
  const { data, error } = await supabase
    .from('key_terms')
    .select(KEY_TERM_COLUMNS)
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: true });
  if (error) fail(error);
  return ((data ?? []) as KeyTermRow[]).map(toKeyTerm);
}

export async function getFeedback(supabase: SupabaseClient, contractId: string): Promise<FeedbackRecord | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('rating, comment')
    .eq('contract_id', contractId)
    .maybeSingle();
  if (error) fail(error);
  return (data as FeedbackRecord | null) ?? null;
}

export async function getChatSessionId(supabase: SupabaseClient, contractId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contractId)
    .maybeSingle();
  if (error) fail(error);
  return (data as { id: string } | null)?.id ?? null;
}

export type { ChatMessage };
