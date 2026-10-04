# Spec 03: PDF Upload, Text Extraction, Preview, and Custom Terms (US-002, US-005, FR-02, FR-03, FR-05)

## 1. Wizard UX (`/contracts/new`, `NewContractWizard`, client)

Steps, in one page with a stepper (`aria-current="step"`):

1. **Choose type and upload.** `ContractTypeSelect` (NDA or MSA, required, no default) and `PdfDropzone` (drag and drop or file picker, accept `application/pdf`). Upload starts on file selection after a type is chosen.
2. **Review terms.** `TermPreviewCard` lists the standard terms for the chosen type (static map in `src/lib/prompts/terms.ts`, shown immediately, independent of upload progress). `CustomTermInput` provides "+ Add Key Term"; added terms show a "Custom" badge and a remove button; button disabled at 5 with helper text "5 of 5 custom terms added".
3. **Process.** "Process Contract" enabled only when upload succeeded. Shows `ProcessingProgress` (see Spec 04).

Client pre-checks (fast feedback, server is authoritative): MIME is `application/pdf`, size at most 10 MB. Mobile viewport shows an info note "ContractIQ works best on desktop Chrome or Firefox".

Dropzone states: idle, drag-over, uploading (determinate progress using `XMLHttpRequest` upload progress), success (file name, pages, size), error (message from envelope, "Choose a different file").

## 2. Standard Term Lists (`src/lib/prompts/terms.ts`)

```ts
export const STANDARD_TERMS = {
  NDA: ['Parties','Effective Date','Confidentiality Obligations','Permitted Disclosures',
        'Term & Duration','Governing Law','Jurisdiction','IP Ownership','Non-Solicitation','Breach & Remedy'],
  MSA: ['Parties','Service Scope','Payment Terms','Invoice Schedule','Late Payment Penalty',
        'Liability Cap','Indemnification','IP Ownership','Termination Clause','Governing Law',
        'Dispute Resolution','Notice Period'],
} as const;
```

Each term also has a plain-English tooltip (`TERM_HELP[term]`, 1 sentence, e.g. "Indemnification: who pays if the other side is sued because of this deal.") used in the preview and results panels.

## 3. Upload Endpoint: `POST /api/contracts`

File: `src/app/api/contracts/route.ts`. Runtime `nodejs`. `maxDuration = 30`.

Request: `multipart/form-data` with `file` (File) and `contract_type` (`NDA` | `MSA`).

Pipeline (service `contract.service.ts#createFromUpload`):

| # | Step | Failure |
|---|---|---|
| 1 | Auth and rate limit `check_rate_limit('upload', 20, 3600)` | 401 / 429 RATE_LIMITED |
| 2 | Zod: `contract_type` enum; `file` present | 400 INVALID_INPUT |
| 3 | `file.size <= MAX_PDF_BYTES` | 413 PDF_TOO_LARGE |
| 4 | Read bytes; first 5 bytes equal `%PDF-` and MIME is `application/pdf` | 422 NOT_A_PDF |
| 5 | Parse with `pdf-parse`, using a custom `pagerender` that returns the page text and records it by page index; join as `[PAGE 1]\n<text>\n\n[PAGE 2]\n<text>...` | 422 CORRUPTED_PDF on throw; encrypted PDFs also map here |
| 6 | `numpages <= MAX_PDF_PAGES` (checked before page text is processed when available) | 422 TOO_MANY_PAGES |
| 7 | Normalise text (collapse 3 or more newlines, strip null bytes, trim page whitespace). Word count (split on whitespace) of all pages `>= MIN_CONTRACT_WORDS` | 422 SCANNED_PDF |
| 8 | Token count with `js-tiktoken` `o200k_base` on the full marked text `<= MAX_CONTRACT_TOKENS` | 422 CONTRACT_TOO_LONG |
| 9 | Insert `contracts` row: `status='uploaded'`, `contract_text`, `page_count`, `token_count`, `file_size_bytes`, `name` = sanitised filename, `file_path = null` | 500 INTERNAL |
| 10 | Upload original bytes to Storage bucket `contracts` at `{user_id}/{contract_id}/{sanitisedFilename}` (content type `application/pdf`, `upsert=false`). On success `update contracts set file_path = <that object name>`. On failure: log `storage_upload_failed` with the error message (no content) and continue | Never fails the request |
| 11 | Return 201 | |

Filename sanitisation (`sanitizeFilename`): take the base name, replace anything outside `[A-Za-z0-9._ -]` with `_`, collapse repeats, truncate to 120 chars, ensure `.pdf` suffix. If empty use `contract.pdf`.

Response 201:
```json
{ "id": "uuid", "name": "Acme NDA.pdf", "contract_type": "NDA", "page_count": 12, "token_count": 8210, "has_pdf": true }
```

No partial state: steps 1 to 8 run before any database write. If step 9 succeeds but the process dies before 10, the contract simply has `file_path = null` and the text viewer is used.

## 4. Page Marker Format and Parsing

Stored format (exact):
```
[PAGE 1]
<page 1 text>

[PAGE 2]
<page 2 text>
```
`src/lib/pdf/parse-pages.ts` exports `parsePages(text: string): ContractPage[]` using the regex `/^\[PAGE (\d+)\]\s*$/m` as the delimiter; returns pages ordered by `n`. Round-trip property: `parsePages(buildMarkedText(pages))` equals the input pages (unit tested, including pages containing the text "[PAGE" inside a line).

`findPageForSentence(pages, sentence): number | null` normalises whitespace and case-insensitively matches; returns the first page containing the sentence, or null. Used by Spec 04.

## 5. Preview Terms: `GET /api/contracts/[id]/preview-terms`

Returns `{ "standard": string[], "custom": [{ "id": "uuid", "term_name": "string" }] }`. Standard list is selected by `contracts.contract_type`. Includes `help` map: `{ "standard": [{ "name": "...", "help": "..." }] }` (shape: `standard: {name: string; help: string}[]`).

## 6. Custom Terms: `PUT /api/contracts/[id]/custom-terms`

Request `{ "terms": string[] }` (the full desired set; idempotent replace).

Validation (`src/lib/validation/custom-terms.ts`):
- 0 to 5 items.
- Each trimmed, 2 to 80 chars, matches `^[\p{L}\p{N} &/()'.,+-]+$` (letters, numbers, basic punctuation; no newlines, angle brackets, quotes other than apostrophe, backticks, braces).
- Case-insensitive unique among themselves and not equal (case-insensitive) to any standard term for the contract type.
- Injection filter (`isSuspiciousTermName`): reject names containing (case-insensitive) `ignore`, `disregard`, `system prompt`, `previous instructions`, `you are`, `assistant:`, `</`, `<contract`. Error `INVALID_TERM` with the specific offending index in `details`.

Behaviour: contract must be `uploaded` or `error`, else 409 ALREADY_PROCESSED (or ALREADY_PROCESSING). Within one transaction (Postgres function call is not required; use two statements ordered delete then insert, the 5 term trigger guards the max): delete all existing custom terms for the contract, insert the new set with `user_id`. Response `200 { "custom": [{ "id", "term_name" }] }`.

## 7. Contract Read, Delete, and List

| Endpoint | Behaviour |
|---|---|
| `GET /api/contracts` | Query `sort` in `created_at|name|contract_type` (default `created_at`), `order` in `asc|desc` (default `desc`), `limit` 1 to 100 (default 50), `cursor` (opaque base64 of last `sort value|id`). Returns `{ items: ContractSummary[], next_cursor: string | null }` |
| `GET /api/contracts/[id]` | Returns `{ contract, pages, terms, custom_terms, feedback, chat_session_id }` (see engineering doc Section 9). Updates `last_accessed_at` |
| `DELETE /api/contracts/[id]` | Deletes Storage object (if `file_path`, ignore 404) then the row; cascades remove all child data. 204 |
| `GET /api/contracts/[id]/signed-url` | If `file_path` null: 404 PDF_UNAVAILABLE. Else `createSignedUrl(file_path, 3600)`; on Storage error also 404 PDF_UNAVAILABLE. Returns `{ url, expires_in: 3600 }` |

## 8. Retention: `GET /api/cron/retention`

- Auth: `Authorization: Bearer ${CRON_SECRET}` (constant-time compare); otherwise 401. Not user authenticated.
- Calls `list_expired_contract_files(RETENTION_DAYS)` with the service role client, removes the objects via `storage.from('contracts').remove([...])` in batches of 100, then `update contracts set file_path = null` for those ids, then calls `purge_old_rate_limits()`.
- Scheduled daily via a Netlify scheduled function (`netlify/functions/retention.mts`, schedule `0 3 * * *`) that calls this route.
- Returns `{ deleted_files: n, purged_rate_limits: n }`.
- Extracted text and key terms remain until the user deletes the contract (users can delete at any time). Deviation from the engineering doc: pg_cron is not used because deleting `storage.objects` rows in SQL does not remove the underlying file; the Storage API is required.

## 9. Async Fallback (only if needed)

If measured P95 for `/process` approaches the host's function limit, switch `POST /process` to return `202 { status: 'processing' }` immediately and run extraction in a Netlify background function (`netlify/functions/process-background.mts`), with the client subscribing to `contracts` row updates through Supabase Realtime (add `contracts` to the `supabase_realtime` publication). This changes no schema. Not implemented in MVP unless alpha measurements require it.

## 10. Edge Cases

| Case | Behaviour |
|---|---|
| Password protected or encrypted PDF | CORRUPTED_PDF |
| PDF with text only on some pages | Allowed if total words >= 100; empty pages keep their `[PAGE N]` marker |
| Duplicate upload of the same file | Allowed; separate contract |
| Uploading while another upload is pending | Dropzone disabled during upload |
| Filename with path separators or unicode | Sanitised as above; display name keeps the sanitised value |
| User refreshes between upload and process | Contract is `uploaded`; dashboard row shows "Ready to process" linking to `/contracts/new?resume=<id>` which resumes at step 2 |
| Wrong type selected | Detected after processing (Spec 04) |

## 11. Acceptance Criteria

- 10 MB, 20 page text PDF within limits succeeds; 10.1 MB, 21 pages, 15,001 tokens, scanned (under 100 words), and non-PDF each fail with the exact message in the error table.
- `contracts.contract_text` contains `[PAGE N]` markers for every page.
- With the Storage bucket missing or blocked, upload still returns 201 with `has_pdf = false`.
- Sixth custom term is rejected both by the API (422) and the database trigger.
- Tests: unit (sanitizeFilename, parsePages round trip, validators), integration (each failure path, Storage failure path, replace-set semantics).
