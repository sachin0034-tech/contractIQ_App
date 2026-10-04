import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import type { ChatMessage, ChatRole } from '@/types/domain';

const MESSAGE_COLUMNS = 'id, role, content, cited_pages, created_at';

function fail(error: unknown): never {
  throw new AppError('INTERNAL', { cause: error });
}

export async function findSessionId(supabase: SupabaseClient, contractId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contractId)
    .maybeSingle();
  if (error) fail(error);
  return (data as { id: string } | null)?.id ?? null;
}

/** One session per contract (unique constraint). Safe against two simultaneous first messages. */
export async function getOrCreateSession(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
): Promise<string> {
  const existing = await findSessionId(supabase, contractId);
  if (existing) return existing;

  const { error } = await supabase
    .from('chat_sessions')
    .upsert({ contract_id: contractId, user_id: userId }, { onConflict: 'contract_id', ignoreDuplicates: true });
  if (error) fail(error);

  const created = await findSessionId(supabase, contractId);
  if (!created) fail(new Error('chat session missing after upsert'));
  return created;
}

/** Most recent `limit` messages, returned oldest first. */
export async function listMessages(
  supabase: SupabaseClient,
  sessionId: string,
  limit: number,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (error) fail(error);
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function insertMessage(
  supabase: SupabaseClient,
  message: { session_id: string; user_id: string; role: ChatRole; content: string; cited_pages?: number[] },
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ cited_pages: [], ...message })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) fail(error);
  return data as ChatMessage;
}

export async function touchSession(supabase: SupabaseClient, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) fail(error);
}
