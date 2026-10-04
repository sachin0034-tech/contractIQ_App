import 'server-only';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { limits } from '@/lib/config';
import { SIGNED_URL_TTL_SECONDS } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import { getOwnedContract } from '@/lib/http';
import { logger } from '@/lib/logger';
import { extractPdfPages } from '@/lib/pdf/extract';
import { buildMarkedText, parsePages } from '@/lib/pdf/parse-pages';
import { countWords, hasPdfMagicBytes, sanitizeFilename } from '@/lib/pdf/validate';
import { STANDARD_TERMS, TERM_HELP } from '@/lib/prompts/terms';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { countTokens } from '@/lib/tokens';
import { validateCustomTerms } from '@/lib/validation/custom-terms';
import {
  type ContractListSort,
  type ContractRow,
  deleteContractRow,
  getChatSessionId,
  getFeedback,
  insertContract,
  listContracts,
  listCustomTerms,
  listKeyTerms,
  replaceCustomTerms,
  setContractFilePath,
  setContractStatus,
  touchContract,
} from '@/repositories/contracts.repo';
import type { ContractDetail } from '@/types/api';
import type { ContractSummary, ContractType, CustomTerm } from '@/types/domain';

const STORAGE_BUCKET = 'contracts';
/** A contract stuck in "processing" longer than this is treated as a crashed run. */
export const STALE_PROCESSING_MS = 3 * 60 * 1000;

export interface UploadResult {
  id: string;
  name: string;
  contract_type: ContractType;
  page_count: number;
  token_count: number;
  has_pdf: boolean;
}

/**
 * Validates an uploaded PDF, extracts its text once (with [PAGE N] markers), stores it on the
 * contract row, and uploads the original file to Storage on a best-effort basis.
 * All validation runs before any database write, so a rejected upload leaves nothing behind.
 */
export async function createFromUpload(
  supabase: SupabaseClient,
  user: User,
  file: File,
  contractType: ContractType,
): Promise<UploadResult> {
  await enforceRateLimit(supabase, 'upload');

  if (file.size > limits.maxPdfBytes) throw new AppError('PDF_TOO_LARGE');
  if (file.size === 0) throw new AppError('NOT_A_PDF');
  if (file.type && file.type !== 'application/pdf') throw new AppError('NOT_A_PDF');

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasPdfMagicBytes(buffer)) throw new AppError('NOT_A_PDF');

  const { pages, numPages } = await extractPdfPages(buffer);

  const totalWords = pages.reduce((sum, page) => sum + countWords(page.text), 0);
  if (totalWords < limits.minContractWords) throw new AppError('SCANNED_PDF');

  const contractText = buildMarkedText(pages);
  const tokenCount = countTokens(contractText);
  if (tokenCount > limits.maxContractTokens) throw new AppError('CONTRACT_TOO_LONG');

  const id = crypto.randomUUID();
  const name = sanitizeFilename(file.name);

  await insertContract(supabase, {
    id,
    user_id: user.id,
    name,
    contract_type: contractType,
    contract_text: contractText,
    page_count: numPages,
    token_count: tokenCount,
    file_size_bytes: file.size,
  });

  // Storage is only needed for the inline PDF viewer. A failure here must never fail the upload:
  // the AI pipeline and the text viewer both read contract_text from the database.
  let hasPdf = false;
  const objectPath = `${user.id}/${id}/${name}`;
  try {
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, buffer, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;
    await setContractFilePath(supabase, id, objectPath);
    hasPdf = true;
  } catch (error) {
    logger.warn({
      msg: 'storage_upload_failed',
      contractId: id,
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }

  return { id, name, contract_type: contractType, page_count: numPages, token_count: tokenCount, has_pdf: hasPdf };
}

/** Loads everything the results page needs. Also records access time and heals crashed runs. */
export async function getContractDetail(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
): Promise<ContractDetail> {
  let row = await getOwnedContract<ContractRow>(supabase, contractId, userId);

  if (row.status === 'processing' && Date.now() - new Date(row.updated_at).getTime() > STALE_PROCESSING_MS) {
    await setContractStatus(supabase, contractId, 'error', 'AI_TIMEOUT');
    row = { ...row, status: 'error', error_code: 'AI_TIMEOUT' };
  }

  const [terms, customTerms, feedback, chatSessionId] = await Promise.all([
    listKeyTerms(supabase, contractId),
    listCustomTerms(supabase, contractId),
    getFeedback(supabase, contractId),
    getChatSessionId(supabase, contractId),
    touchContract(supabase, contractId),
  ]);

  return {
    contract: {
      id: row.id,
      name: row.name,
      contract_type: row.contract_type,
      detected_type: row.detected_type,
      status: row.status,
      error_code: row.error_code,
      page_count: row.page_count,
      has_pdf: row.file_path !== null,
      created_at: row.created_at,
    },
    pages: parsePages(row.contract_text),
    terms,
    custom_terms: customTerms,
    feedback,
    chat_session_id: chatSessionId,
  };
}

export async function listUserContracts(
  supabase: SupabaseClient,
  userId: string,
  options: { sort: ContractListSort; ascending: boolean; limit: number; offset: number },
): Promise<{ items: ContractSummary[]; nextOffset: number | null }> {
  const rows = await listContracts(supabase, userId, { ...options, limit: options.limit + 1 });
  const hasMore = rows.length > options.limit;
  return {
    items: hasMore ? rows.slice(0, options.limit) : rows,
    nextOffset: hasMore ? options.offset + options.limit : null,
  };
}

/** Deletes the stored PDF (if any) and the contract row; child rows cascade. */
export async function deleteContract(supabase: SupabaseClient, contractId: string, userId: string): Promise<void> {
  const row = await getOwnedContract<Pick<ContractRow, 'id' | 'file_path'>>(
    supabase,
    contractId,
    userId,
    'id, file_path',
  );

  if (row.file_path) {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([row.file_path]);
    if (error) {
      logger.warn({ msg: 'storage_delete_failed', contractId, reason: error.message });
    }
  }
  await deleteContractRow(supabase, contractId);
}

export async function createSignedPdfUrl(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
): Promise<{ url: string; expires_in: number }> {
  const row = await getOwnedContract<Pick<ContractRow, 'file_path'>>(supabase, contractId, userId, 'file_path');
  if (!row.file_path) throw new AppError('PDF_UNAVAILABLE');

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw new AppError('PDF_UNAVAILABLE');
  return { url: data.signedUrl, expires_in: SIGNED_URL_TTL_SECONDS };
}

export async function getTermPreview(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
): Promise<{ standard: { name: string; help: string }[]; custom: CustomTerm[] }> {
  const row = await getOwnedContract<Pick<ContractRow, 'contract_type'>>(
    supabase,
    contractId,
    userId,
    'contract_type',
  );
  const custom = await listCustomTerms(supabase, contractId);
  return {
    standard: STANDARD_TERMS[row.contract_type].map((name) => ({ name, help: TERM_HELP[name] ?? '' })),
    custom,
  };
}

/** Replaces the custom term set. Only allowed before the contract has been processed. */
export async function setCustomTerms(
  supabase: SupabaseClient,
  contractId: string,
  userId: string,
  rawTerms: string[],
): Promise<CustomTerm[]> {
  const row = await getOwnedContract<Pick<ContractRow, 'contract_type' | 'status'>>(
    supabase,
    contractId,
    userId,
    'contract_type, status',
  );
  if (row.status === 'processing') throw new AppError('ALREADY_PROCESSING');
  if (row.status === 'completed') throw new AppError('ALREADY_PROCESSED');

  const { terms, problem } = validateCustomTerms(rawTerms, row.contract_type);
  if (problem) {
    throw new AppError('INVALID_TERM', {
      details: [{ path: `terms.${problem.index}`, message: problem.reason }],
    });
  }
  return replaceCustomTerms(supabase, contractId, userId, terms);
}
