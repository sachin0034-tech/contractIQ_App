export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_PAGES = 30;
export const MAX_CONTRACT_TOKENS = 30_000;
export const MIN_CONTRACT_WORDS = 100;
export const MAX_CUSTOM_TERMS = 5;
export const MAX_CHAT_HISTORY_MESSAGES = 200;
export const MAX_CHAT_MESSAGE_CHARS = 2000;
export const MAX_TERM_VALUE_CHARS = 2000;
export const SIGNED_URL_TTL_SECONDS = 3600;

/** Confidence below this shows the low-confidence warning. */
export const LOW_CONFIDENCE_THRESHOLD = 0.5;
/** Confidence at or above this is the "high" band. */
export const HIGH_CONFIDENCE_THRESHOLD = 0.8;

export const NOT_FOUND_VALUE = 'Not found in document';
export const CHAT_NOT_FOUND_PHRASE = 'I cannot find this in the document.';

export const DISCLAIMER =
  'This is an AI-assisted review tool, not legal advice. Always verify critical terms with a qualified lawyer.';

/** Route prefixes that require a signed-in user (pages only; API handlers authenticate themselves). */
export const PROTECTED_PATH_PREFIXES = ['/dashboard', '/contracts'] as const;
/** Auth pages that signed-in users are redirected away from. */
export const AUTH_PATHS = ['/sign-in', '/sign-up'] as const;
export const DEFAULT_AUTHED_PATH = '/dashboard';
