# Spec 08: Security, Privacy, and Compliance Baseline

This spec defines the controls built into each feature during Stage 4. The deeper audit and hardening pass is Stage 7 (`/security-foundation`).

## 1. Data Isolation

| Layer | Control |
|---|---|
| Database | RLS enabled on every table; policies in `supabase-schema.sql`; child inserts require parent ownership |
| Column grants | Authenticated users can update only the columns listed in Section 8 of the schema file (contract text, owner ids, original AI values, counters are not writable) |
| Storage | Private bucket `contracts`; policies require `auth.uid()::text = (storage.foldername(name))[1]` |
| API | Every handler uses the user's JWT client and additionally filters by `user_id`; foreign or missing rows both return 404 |
| Service role | Only `src/lib/supabase/admin.ts`, used only by `/api/cron/retention` (lint enforced) |

RLS test matrix (Spec 09): for each table and each of select, insert, update, delete, and for the Storage bucket, user B acting on user A rows must be denied, and anonymous must be denied.

## 2. Secrets

- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` are server-only (no `NEXT_PUBLIC_` prefix).
- CI step greps the built `.next/static` for `sk-`, `service_role`, and the literal env var names; fails on a match.
- `.env.local` is gitignored; `.env.example` has empty values only.

## 3. Transport and Headers (set in `next.config.mjs` `headers()` and middleware)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';   # Next.js inline bootstrap; tighten with nonces in Stage 7
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  worker-src 'self' blob:;
  frame-src 'self' https://*.supabase.co;                 # signed PDF URLs if embedded as fallback
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```
Note: PDF.js fetches the signed URL from `*.supabase.co` (`connect-src`). CSP is validated in the E2E suite by loading the results page and asserting no CSP violation console errors.

## 4. Input Validation and Output Safety

- All API inputs validated with Zod; limits listed per spec.
- File: MIME, magic bytes, size, page and token limits, sanitised filename.
- Free text (custom term names, chat messages, feedback comments, edits) is stored as text and rendered as text only. No `dangerouslySetInnerHTML` anywhere (ESLint rule `react/no-danger` as error).
- Model output is never interpreted as HTML or markdown with HTML.
- CSV export guards against formula injection (Spec 07).

## 5. Prompt Injection and Data Handling with the LLM

- Contract text and custom term names are fenced and declared as data in system prompts (Specs 04 and 06).
- The model has no tools, no network, and no ability to write to the database; outputs pass Zod validation and post-processing before storage.
- Only the contract text, term names, and chat history of the requesting user are sent to OpenAI; no email or names. The `user` parameter is a SHA-256 hash of the user id (no salt).
- OpenAI data usage: API traffic is not used for training by default; the DPA is confirmed before EU onboarding (launch gate). No contract content is logged by ContractIQ.

## 6. Rate Limiting and Abuse Controls

| Bucket | Limit | Window |
|---|---|---|
| upload | 20 | 1 hour |
| process | 10 | 1 hour |
| chat | 30 | 1 minute |
| edit | 120 | 1 minute |

Implemented through `check_rate_limit(bucket, max, window_seconds)` (fixed window; limits configurable by env). Exceeding returns 429 RATE_LIMITED with a `Retry-After` header equal to the seconds left in the window. Supabase Auth's built-in limits cover sign-in and sign-up. Cost guard: OpenAI project spend limit set to the monthly budget; `OPENAI_MONTHLY_BUDGET_USD` drives a log warning at 80% based on a daily summed `token_usage` query.

## 7. Privacy, Retention, and Deletion

| Item | Rule |
|---|---|
| Stored data | PDF (Storage, optional), extracted text (`contracts.contract_text`), key terms, chat messages, feedback, profile (email, optional name) |
| Encryption | At rest AES-256 and in transit TLS by platform defaults |
| PDF retention | Auto-deleted 90 days after last access (`/api/cron/retention`); text and terms remain until the user deletes the contract |
| User deletion | Delete a contract from the dashboard (cascade). Account deletion on request: delete the `auth.users` row via the Supabase dashboard (cascades to all tables) and remove the user's Storage folder; documented in `docs/security/security-plan.md` (Stage 7) |
| Training | No model training on user data. Corrections export for prompt improvement is opt-in and anonymised via the `term_corrections` view (no user or contract ids) |
| Consent for corrections | Not collected in MVP; the view is used only by the product team in aggregate until an opt-in toggle ships (tracked for v1.1). Do not export it outside the team before then |

## 8. Disclosures (UI)

- Not-legal-advice banner on every results page (`DISCLAIMER`).
- Chat input footer short disclaimer.
- Footer: "Powered by OpenAI GPT-4o".
- Terms of service clause prohibiting analysis of third-party confidential contracts without permission.

## 9. Logging and Monitoring

- Structured JSON logs via `pino`; redaction paths: `*.contract_text`, `*.message`, `*.content`, `req.headers.authorization`, `req.headers.cookie`.
- Health: `GET /api/health` returns `{ ok: true, supabase: true|false, time }` (Supabase check is a trivial `select 1` through PostgREST with the anon key); monitored by Uptime Robot every 5 minutes with Slack alert.
- Alert triggers: error rate above 5% over 5 minutes, process P95 above 30 seconds, daily OpenAI spend over 80% of the daily budget share, Storage above 70%.
- Incident communication: per PRD (P0 banner and email within 1 hour, status page within 30 minutes; P1 banner within 2 hours).

## 10. Acceptance Criteria

- All RLS tests pass for every table and Storage; cross-user access attempts return no rows or 403/404.
- No secrets in client bundle (CI check).
- Security headers present on all routes; CSP produces no violations in E2E.
- A user cannot change `contract_text`, `analyses_count`, `user_id`, or `original_value` via the Supabase client with their own JWT (negative tests).
- Rate limit returns 429 on the 11th process request within an hour.
