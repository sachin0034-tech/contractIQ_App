import {
  MAX_CHAT_HISTORY_MESSAGES,
  MAX_CONTRACT_TOKENS,
  MAX_CUSTOM_TERMS,
  MAX_PDF_BYTES,
  MAX_PDF_PAGES,
  MIN_CONTRACT_WORDS,
} from '@/lib/constants';

/** Reads a positive integer env var, falling back to the default when unset or invalid. */
function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Runtime limits. This is the only module that reads limit env vars. Server-side use only. */
export const limits = {
  maxPdfBytes: intFromEnv('MAX_PDF_BYTES', MAX_PDF_BYTES),
  maxPdfPages: intFromEnv('MAX_PDF_PAGES', MAX_PDF_PAGES),
  maxContractTokens: intFromEnv('MAX_CONTRACT_TOKENS', MAX_CONTRACT_TOKENS),
  minContractWords: intFromEnv('MIN_CONTRACT_WORDS', MIN_CONTRACT_WORDS),
  maxCustomTerms: intFromEnv('MAX_CUSTOM_TERMS', MAX_CUSTOM_TERMS),
  maxChatHistory: intFromEnv('MAX_CHAT_HISTORY_MESSAGES', MAX_CHAT_HISTORY_MESSAGES),
  retentionDays: intFromEnv('RETENTION_DAYS', 90),
} as const;

export const rateLimits = {
  upload: { max: intFromEnv('RATE_LIMIT_UPLOAD_PER_HOUR', 20), windowSeconds: 3600 },
  process: { max: intFromEnv('RATE_LIMIT_PROCESS_PER_HOUR', 10), windowSeconds: 3600 },
  chat: { max: intFromEnv('RATE_LIMIT_CHAT_PER_MINUTE', 30), windowSeconds: 60 },
  edit: { max: intFromEnv('RATE_LIMIT_EDIT_PER_MINUTE', 120), windowSeconds: 60 },
} as const;

export type RateLimitBucket = keyof typeof rateLimits;

/** Public Supabase settings, or null when the project is not configured. */
export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/** Same as getSupabasePublicEnv but throws a clear error when missing. */
export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.',
    );
  }
  return env;
}
