/** Single source of truth for API error codes: HTTP status, user message, retryability. */
export const ERROR_DEFINITIONS = {
  UNAUTHENTICATED: { status: 401, message: 'Please sign in to continue.', retryable: false },
  FORBIDDEN: { status: 403, message: 'You do not have access to this item.', retryable: false },
  NOT_FOUND: { status: 404, message: 'We could not find that item.', retryable: false },
  INVALID_INPUT: { status: 400, message: 'Some of the information you entered is not valid.', retryable: false },
  PDF_TOO_LARGE: { status: 413, message: 'PDF must be 10 MB or smaller.', retryable: false },
  NOT_A_PDF: { status: 422, message: 'Please upload a PDF file.', retryable: false },
  CORRUPTED_PDF: { status: 422, message: 'We could not read this PDF. It may be corrupted.', retryable: false },
  TOO_MANY_PAGES: {
    status: 422,
    message: 'PDFs are limited to 20 pages for now. Longer contract support is coming.',
    retryable: false,
  },
  CONTRACT_TOO_LONG: {
    status: 422,
    message: 'This contract is too long for now. Longer contract support is coming.',
    retryable: false,
  },
  SCANNED_PDF: { status: 422, message: 'Scanned PDFs are not supported yet.', retryable: false },
  TOO_MANY_CUSTOM_TERMS: { status: 422, message: 'You can add up to 5 custom terms.', retryable: false },
  INVALID_TERM: { status: 422, message: 'That term name is not allowed.', retryable: false },
  MESSAGE_TOO_LONG: { status: 422, message: 'Messages are limited to 2,000 characters.', retryable: false },
  ALREADY_PROCESSING: { status: 409, message: 'This contract is already being processed.', retryable: false },
  ALREADY_PROCESSED: { status: 409, message: 'This contract has already been processed.', retryable: false },
  CONTRACT_NOT_READY: { status: 409, message: 'Process this contract before chatting.', retryable: false },
  PDF_UNAVAILABLE: { status: 404, message: 'The PDF is not available. Showing text view instead.', retryable: false },
  RATE_LIMITED: {
    status: 429,
    message: 'You are going a little fast. Please try again shortly.',
    retryable: true,
  },
  AI_UNAVAILABLE: {
    status: 502,
    message: 'Our AI service is unavailable. Try again in a few minutes.',
    retryable: true,
  },
  AI_INVALID_OUTPUT: {
    status: 502,
    message: 'We could not read the AI response. Please try again.',
    retryable: true,
  },
  AI_TIMEOUT: { status: 504, message: 'The analysis took too long. Please try again.', retryable: true },
  INTERNAL: { status: 500, message: 'Something went wrong. Please try again.', retryable: true },
} as const;

export type ErrorCode = keyof typeof ERROR_DEFINITIONS;

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
    details?: Array<{ path: string; message: string }>;
    /** Raw upstream error text. Only included outside production, or when EXPOSE_ERROR_DETAILS=true. */
    detail?: string;
  };
}

function exposeErrorDetail(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.EXPOSE_ERROR_DETAILS === 'true';
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly details?: Array<{ path: string; message: string }>;
  readonly detail?: string;

  constructor(
    code: ErrorCode,
    options: {
      message?: string;
      retryAfterSeconds?: number;
      details?: Array<{ path: string; message: string }>;
      /** Raw upstream error text for diagnosis. */
      detail?: string;
      cause?: unknown;
    } = {},
  ) {
    const def = ERROR_DEFINITIONS[code];
    super(options.message ?? def.message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = def.status;
    this.retryable = def.retryable;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
    this.detail = options.detail;
  }

  toEnvelope(): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        ...(this.details ? { details: this.details } : {}),
        ...(this.detail && exposeErrorDetail() ? { detail: this.detail } : {}),
      },
    };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
