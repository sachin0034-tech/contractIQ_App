import { DEFAULT_AUTHED_PATH } from '@/lib/constants';

/**
 * Accepts only same-origin relative paths for post-login redirects.
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com") and backslash tricks.
 */
export function safeNext(next: string | null | undefined, fallback: string = DEFAULT_AUTHED_PATH): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//') || next.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
