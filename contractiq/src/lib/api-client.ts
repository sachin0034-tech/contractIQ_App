import type { ErrorCode, ErrorEnvelope } from '@/lib/errors';

/** Error raised for any non-2xx API response or network failure, carrying the server's envelope fields. */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode | 'NETWORK',
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
    /** Raw upstream error text; only present outside production. */
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK_MESSAGE = 'We could not reach the server. Check your connection and try again.';

function toApiError(status: number, body: unknown): ApiError {
  const envelope = body as Partial<ErrorEnvelope> | null;
  if (envelope?.error?.code) {
    return new ApiError(
      envelope.error.code,
      envelope.error.message,
      status,
      envelope.error.retryable ?? false,
      envelope.error.detail,
    );
  }
  return new ApiError('INTERNAL', 'Something went wrong. Please try again.', status, true);
}

/** Redirects to sign-in when the session has expired. Only runs in the browser. */
function handleUnauthenticated() {
  if (typeof window === 'undefined') return;
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/sign-in?next=${encodeURIComponent(here)}`);
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new ApiError('NETWORK', NETWORK_MESSAGE, 0, true);
  }

  if (response.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body; handled below.
  }

  if (!response.ok) {
    const error = toApiError(response.status, body);
    if (error.code === 'UNAUTHENTICATED') handleUnauthenticated();
    throw error;
  }
  return body as T;
}

export function jsonRequest(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export interface UploadedContract {
  id: string;
  name: string;
  contract_type: 'NDA' | 'MSA';
  page_count: number;
  token_count: number;
  has_pdf: boolean;
}

/** Uploads a PDF with progress reporting (fetch cannot report upload progress). */
export function uploadContract(
  file: File,
  contractType: 'NDA' | 'MSA',
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadedContract> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/contracts');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new ApiError('NETWORK', NETWORK_MESSAGE, 0, true));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON body; handled below.
      }
      if (xhr.status === 201) {
        resolve(body as UploadedContract);
        return;
      }
      const error = toApiError(xhr.status, body);
      if (error.code === 'UNAUTHENTICATED') handleUnauthenticated();
      reject(error);
    };

    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append('contract_type', contractType);
    form.append('file', file);
    xhr.send(form);
  });
}
