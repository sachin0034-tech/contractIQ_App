# Spec 01: Project Foundation, Conventions, and Shared Contracts

Covers: stack and versions, repo layout, config, shared TypeScript types, error envelope, route handler wrapper, Supabase clients, middleware, design token wiring. Everything else builds on this.

## 1. Stack and Versions

| Item | Version / choice |
|---|---|
| Node | 20 LTS |
| Next.js | 14.2.x, App Router, TypeScript strict |
| React | 18.3 |
| Tailwind CSS | 3.4, tokens from `docs/design.md` |
| Supabase | `@supabase/supabase-js` ^2, `@supabase/ssr` ^0.5 |
| Validation | `zod` ^3 |
| Server state | `@tanstack/react-query` ^5 |
| Client state | `zustand` ^4 (viewer sync only) |
| UI primitives | `@radix-ui/react-{dialog,tooltip,tabs,dropdown-menu,toast}` |
| Forms | `react-hook-form` + `@hookform/resolvers` |
| PDF | `pdfjs-dist` ^4 (client), `pdf-parse` ^1.1.1 (server) |
| Tokens | `js-tiktoken` (encoding `o200k_base`) |
| LLM | `openai` ^4 |
| Logging | `pino` |
| Tests | `vitest`, `@testing-library/react`, `playwright`, `@axe-core/playwright` |
| Hosting | Netlify with `@netlify/plugin-nextjs` |

Path alias: `@/*` maps to `src/*`. Server-only modules start with `import 'server-only'`.

## 2. Directory Layout

As defined in `docs/engineering/engineering-doc.md` Section 11. Implementers must not add top-level folders beyond those listed there.

## 3. Shared Constants (`src/lib/constants.ts`)

```ts
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 20;
export const MAX_CONTRACT_TOKENS = 15_000;
export const MIN_CONTRACT_WORDS = 100;
export const MAX_CUSTOM_TERMS = 5;
export const MAX_CHAT_HISTORY_MESSAGES = 200;
export const MAX_CHAT_MESSAGE_CHARS = 2000;
export const MAX_TERM_VALUE_CHARS = 2000;
export const SIGNED_URL_TTL_SECONDS = 3600;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;   // below: warning
export const HIGH_CONFIDENCE_THRESHOLD = 0.8;  // at or above: green
export const NOT_FOUND_VALUE = 'Not found in document';
export const CHAT_NOT_FOUND_PHRASE = 'I cannot find this in the document.';
export const DISCLAIMER =
  'This is an AI-assisted review tool, not legal advice. Always verify critical terms with a qualified lawyer.';
```

Runtime limits may be overridden by the env vars in `.env.example`; constants are the defaults and the single place that reads `process.env` for limits is `src/lib/config.ts`.

## 4. Domain Types (`src/types/domain.ts`)

```ts
export type ContractType = 'NDA' | 'MSA';
export type DetectedType = ContractType | 'OTHER';
export type ContractStatus = 'uploaded' | 'processing' | 'completed' | 'error';

export interface ContractSummary {
  id: string; name: string; contract_type: ContractType; status: ContractStatus;
  created_at: string; page_count: number;
}
export interface KeyTerm {
  id: string; term_name: string;
  value: string;                 // edited_value ?? original_value
  original_value: string; is_edited: boolean;
  page_number: number | null;    // 1-indexed
  confidence_score: number;      // 0..1
  source_sentence: string | null;
  is_custom: boolean; sort_order: number;
}
export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string;
  cited_pages: number[]; created_at: string;
}
export interface ContractPage { n: number; text: string }
```

Database types are generated: `npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts`.

## 5. Error Model (`src/lib/errors.ts`)

```ts
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    public userMessage: string,
    public retryable = false,
  ) { super(userMessage); }
}
```

Error envelope returned by every route:

```json
{ "error": { "code": "PDF_TOO_LARGE", "message": "PDF must be 10 MB or smaller.", "retryable": false } }
```

Error code table (single source; `ErrorCode` union is derived from it):

| Code | HTTP | User message | Retryable |
|---|---|---|---|
| UNAUTHENTICATED | 401 | Please sign in to continue. | no |
| FORBIDDEN | 403 | You do not have access to this item. | no |
| NOT_FOUND | 404 | We could not find that item. | no |
| INVALID_INPUT | 400 | Some of the information you entered is not valid. | no |
| PDF_TOO_LARGE | 413 | PDF must be 10 MB or smaller. | no |
| NOT_A_PDF | 422 | Please upload a PDF file. | no |
| CORRUPTED_PDF | 422 | We could not read this PDF. It may be corrupted. | no |
| TOO_MANY_PAGES | 422 | PDFs are limited to 20 pages for now. Longer contract support is coming. | no |
| CONTRACT_TOO_LONG | 422 | This contract is too long for now. Longer contract support is coming. | no |
| SCANNED_PDF | 422 | Scanned PDFs are not supported yet. | no |
| TOO_MANY_CUSTOM_TERMS | 422 | You can add up to 5 custom terms. | no |
| INVALID_TERM | 422 | That term name is not allowed. | no |
| MESSAGE_TOO_LONG | 422 | Messages are limited to 2,000 characters. | no |
| ALREADY_PROCESSING | 409 | This contract is already being processed. | no |
| ALREADY_PROCESSED | 409 | This contract has already been processed. | no |
| CONTRACT_NOT_READY | 409 | Process this contract before chatting. | no |
| PDF_UNAVAILABLE | 404 | The PDF is not available. Showing text view instead. | no |
| RATE_LIMITED | 429 | You are going a little fast. Please try again shortly. | yes |
| AI_UNAVAILABLE | 502 | Our AI service is unavailable. Try again in a few minutes. | yes |
| AI_INVALID_OUTPUT | 502 | We could not read the AI response. Please try again. | yes |
| AI_TIMEOUT | 504 | The analysis took too long. Please try again. | yes |
| INTERNAL | 500 | Something went wrong. Please try again. | yes |

## 6. Route Handler Wrapper (`src/lib/http.ts`)

```ts
export function route<T>(
  handler: (ctx: { req: Request; user: User; supabase: SupabaseClient<Database>; params: Record<string,string>; requestId: string }) => Promise<Response>,
  opts?: { auth?: boolean }   // default true
): (req: Request, ctx: { params: Record<string,string> }) => Promise<Response>
```

Behaviour:
1. Generate `requestId` (`crypto.randomUUID()`), set `x-request-id` response header.
2. If `auth !== false`: create the server Supabase client from cookies, call `auth.getUser()` (not `getSession`), throw `UNAUTHENTICATED` when absent.
3. Run handler. `AppError` maps to the envelope. `ZodError` maps to `INVALID_INPUT` (400) with `details` listing field paths (not values). Unknown errors map to `INTERNAL` and are logged with the stack, never returned.
4. Log one structured line: `{requestId, route, method, status, userId, latencyMs}`. Never log contract text, prompts, or message content.

Ownership helper `getOwnedContract(supabase, id, userId)` selects with `.eq('id', id).eq('user_id', userId).single()` and throws `NOT_FOUND` when missing (same response for foreign and missing rows).

## 7. Supabase Clients (`src/lib/supabase/`)

| File | Use | Notes |
|---|---|---|
| `client.ts` | Browser | `createBrowserClient(url, anonKey)` |
| `server.ts` | Server Components and Route Handlers | `createServerClient` with `cookies()` from `next/headers` |
| `middleware.ts` | Session refresh helper | Used by `src/middleware.ts` |
| `admin.ts` | Service role | `import 'server-only'`; used only by `/api/cron/retention`. Never imported by any other file (enforced by an ESLint `no-restricted-imports` rule) |

## 8. Middleware (`src/middleware.ts`)

- Matcher: everything except `_next/static`, `_next/image`, `favicon.ico`, and static asset extensions.
- Refresh session via `supabase.auth.getUser()` and write refreshed cookies to the response.
- Protected prefixes: `/dashboard`, `/contracts`. Unauthenticated: redirect to `/sign-in?next=<path>` (only same-origin relative `next` values accepted).
- Signed-in users visiting `/sign-in` or `/sign-up` are redirected to `/dashboard`.
- Adds security headers to all responses (see Spec 08).

## 9. Design Token Wiring

Source of truth: `docs/design.md`. Implementation rules:
- `src/app/globals.css` declares the primitive and semantic CSS variables from `docs/design.md` Implementation Guidance verbatim, plus these additional semantic tokens: `--border-default: var(--color-grey-100)`, `--border-strong: var(--color-grey-200)`, `--focus-ring: var(--color-blue-500)`, `--status-success-*`, `--status-error-*`, `--status-warning-*` (bg 50, border 200, text 700 or 800 per the Status Badge pattern).
- `tailwind.config.ts` extends `colors` with semantic names only: `text.primary`, `text.secondary`, `bg.primary`, `bg.surface`, `bg.subtle`, `brand`, `border.default`, `border.strong`, `success.{bg,border,text}`, `danger.*`, `warning.*`, `accent`. Primitive scales are not exposed to components.
- Spacing scale limited to multiples of 4px. Radius tokens: `sm 4px`, `md 6px`, `lg 8px`, `xl 12px`.
- Font: Inter (via `next/font/google`, variable `--font-inter`) is the fallback because `Inter Display` is not freely distributable; the CSS stack is `'Inter Display', var(--font-inter), system-ui, sans-serif`. No other typefaces. Letter spacing 0.
- No gradients and no shadows by default (flat depth per design philosophy).
- Confidence colours map to design families: green (>= 0.8) success tokens, amber (0.5 to 0.79) warning tokens, red (< 0.5) danger tokens. Each state also has an icon and text label (never colour alone).

## 10. Scripts and Tooling

`package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test` (vitest run), `test:watch`, `test:e2e` (playwright), `eval` (`tsx evals/run-eval.ts`), `db:types`.

ESLint: `next/core-web-vitals`, `@typescript-eslint/strict`, `no-restricted-imports` for `@/lib/supabase/admin` outside `src/app/api/cron/**`. Prettier: single quotes, 100 cols, trailing commas.

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"
[[plugins]]
  package = "@netlify/plugin-nextjs"
[functions]
  node_bundler = "esbuild"
```
Route-level `export const maxDuration = 60` on `process` and `chat` routes; if the Netlify plan caps synchronous functions below this, apply the async fallback in Spec 03 Section 9.

## 11. Acceptance Criteria

- `npm run typecheck`, `npm run lint`, `npm run build` pass on a clean checkout.
- Importing `@/lib/supabase/admin` from outside the cron route fails lint.
- Hitting `/dashboard` signed out redirects to `/sign-in?next=%2Fdashboard`.
- Every route returns the envelope shape on failure and includes `x-request-id`.
