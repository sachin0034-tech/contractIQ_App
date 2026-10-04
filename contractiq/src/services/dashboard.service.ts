import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/lib/errors';
import { listContracts } from '@/repositories/contracts.repo';
import type { DashboardSummary } from '@/types/api';
import type { ContractType } from '@/types/domain';

async function countCompleted(supabase: SupabaseClient, userId: string, type: ContractType): Promise<number> {
  const { count, error } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('contract_type', type);
  if (error) throw new AppError('INTERNAL', { cause: error });
  return count ?? 0;
}

/** Totals count completed reviews; "recent" lists the 5 newest contracts in any state. */
export async function getDashboardSummary(supabase: SupabaseClient, userId: string): Promise<DashboardSummary> {
  const [nda, msa, recent] = await Promise.all([
    countCompleted(supabase, userId, 'NDA'),
    countCompleted(supabase, userId, 'MSA'),
    listContracts(supabase, userId, { sort: 'created_at', ascending: false, limit: 5, offset: 0 }),
  ]);
  return { total: nda + msa, by_type: { NDA: nda, MSA: msa }, recent };
}
