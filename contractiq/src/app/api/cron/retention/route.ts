import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { limits } from '@/lib/config';
import { AppError } from '@/lib/errors';
import { publicRoute } from '@/lib/http';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 100;

function isAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Daily retention job: removes stored PDFs not accessed for RETENTION_DAYS and clears file_path.
 * Extracted text and key terms stay until the user deletes the contract.
 */
export const GET = publicRoute(async ({ req }) => {
  if (!isAuthorized(req.headers.get('authorization'))) throw new AppError('UNAUTHENTICATED');

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('list_expired_contract_files', { p_days: limits.retentionDays });
  if (error) throw new AppError('INTERNAL', { cause: error });

  const expired = (data ?? []) as { contract_id: string; file_path: string }[];
  let deletedFiles = 0;

  for (let i = 0; i < expired.length; i += BATCH_SIZE) {
    const batch = expired.slice(i, i + BATCH_SIZE);
    const { error: removeError } = await admin.storage.from('contracts').remove(batch.map((row) => row.file_path));
    if (removeError) {
      logger.error({ msg: 'retention_remove_failed', reason: removeError.message });
      continue;
    }
    const { error: updateError } = await admin
      .from('contracts')
      .update({ file_path: null })
      .in('id', batch.map((row) => row.contract_id));
    if (updateError) {
      logger.error({ msg: 'retention_update_failed', reason: updateError.message });
      continue;
    }
    deletedFiles += batch.length;
  }

  const { data: purged, error: purgeError } = await admin.rpc('purge_old_rate_limits');
  if (purgeError) logger.error({ msg: 'rate_limit_purge_failed', reason: purgeError.message });

  return NextResponse.json({ deleted_files: deletedFiles, purged_rate_limits: Number(purged ?? 0) });
});
