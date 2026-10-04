# Spec 07: Landing Page, Dashboard, Feedback, Export (US-008, US-010, US-011, FR-10, FR-12)

## 1. Landing Page (`/`, Server Component, static)

Sections, all using design tokens (flat, no gradients or shadows):

1. Header: logo "ContractIQ", links "Sign In" (secondary button) and "Get Started Free" (primary button).
2. Hero: H1 "Understand any NDA or MSA in 15 minutes, not 90." Subcopy: "Upload a contract. Get the key terms with page references and confidence scores. Ask questions in plain English." CTAs "Get Started Free" (to `/sign-up`) and "Sign In" (to `/sign-in`). Demo GIF at `public/demo.gif` (placeholder image committed; replace before launch) with `alt` describing the flow and `loading="lazy"`.
3. How it works: 3 steps (Upload, Review key terms, Ask questions).
4. Trust strip: "Every term shows where it came from", "Confidence scores on every term", "Answers only from your document".
5. Footer: "Not legal advice", links to `/legal/terms` and `/legal/privacy`, "Powered by OpenAI GPT-4o".

No JS event handlers in this Server Component; hover and focus styles via CSS classes in `globals.css`. Signed-in visitors see "Go to Dashboard" in place of the two header CTAs (read via server-side `getUser`). Metadata: title, description, Open Graph.

Legal pages `/legal/terms` and `/legal/privacy`: static pages with placeholder structure (headings for Use of Service, Acceptable Use including the third-party confidential contract prohibition, Data Processing, Retention 90 days, Deletion, Contact). Final text requires legal review before public launch (PRD dependency).

## 2. Dashboard (`/dashboard`)

Server Component fetching via the user's Supabase client, with a client `ContractsTable` for sorting.

Content:
- Heading "Dashboard" (H5) and primary button "Review a Contract" (to `/contracts/new`).
- `SummaryCards` (3): Total contracts reviewed, NDAs, MSAs. "Reviewed" counts contracts with `status = 'completed'`; the type cards count all non-deleted contracts of that type that are completed.
- "Recent" is the same table sorted by date; the table shows all contracts (paginated 25 per page via cursor).
- Empty state when zero contracts: text exactly "No contracts reviewed yet. Upload your first contract to begin" and the primary button.

`ContractsTable` columns: Name, Type (badge), Date uploaded, Status (badge), actions menu. Sortable by Name, Type, Date (buttons with `aria-sort`); default Date descending. Row click or Enter opens `/contracts/[id]` (rows are links). Status badges: Completed (success), Processing (warning, spinner), Ready to process (neutral, links to resume), Failed (danger, "Try again" action which opens the contract page with the process CTA). Actions menu: Open, Delete.

Delete flow: Radix dialog "Delete this contract?" body "This permanently deletes the contract, its key terms, and chat history. This cannot be undone." with Cancel and Delete (danger) buttons; calls `DELETE /api/contracts/[id]`; optimistic removal; on failure restore and toast.

Endpoint `GET /api/dashboard/summary` returns:
```json
{ "total": 12, "by_type": { "NDA": 7, "MSA": 5 }, "recent": [ { "id": "uuid", "name": "x.pdf", "contract_type": "NDA", "status": "completed", "created_at": "iso" } ] }
```
Computed with two queries under RLS: a grouped count (`select contract_type, count(*) ... where status='completed' group by contract_type`) and `order by created_at desc limit 5`.

Performance: dashboard first paint at most 1.5 seconds with 200 contracts (indexes `contracts_user_id_created_at_idx`, `contracts_user_id_type_idx`).

States: loading skeleton for cards and 5 table rows; error banner with retry.

## 3. Feedback (US-010, FR-12)

`FeedbackWidget` at the bottom of the results right pane: "Were the extracted terms accurate?" with thumbs up and thumbs down buttons (`aria-pressed`) and optional comment textarea (max 2,000 chars, shown after a rating is chosen) and "Send feedback" button.

`POST /api/contracts/[id]/feedback`: request `{ "rating": "up" | "down", "comment"?: string }`; ownership check; upsert on `(user_id, contract_id)`; response 200 `{ "rating", "comment" }`. The widget pre-fills from the contract payload `feedback` field and says "Update feedback" if present. Toast "Thanks for your feedback".

Optional survey mapping for the beta (PRD: "Were the extracted terms accurate? Yes / Partially / No"): thumbs up is Yes, thumbs down is No; "Partially" is captured by a thumbs-down with the comment prompt "What was wrong?". NPS prompt (0 to 10) is out of MVP scope and tracked as a v1.1 item.

## 4. Onboarding Tooltips (v1.0)

First visit to `/contracts/new` and `/contracts/[id]` shows a one-time coach mark sequence (3 steps each) using Radix Popover; completion sets `profiles.onboarding_completed = true` (allowed by column grants) and is mirrored in `localStorage` for instant dismissal. Skippable, keyboard accessible.

## 5. Export (v1.1, P2, US-011)

`GET /api/contracts/[id]/export?format=csv|pdf` (hidden behind `NEXT_PUBLIC_ENABLE_EXPORT` flag until v1.1).

- CSV columns: `term_name,value,page_number,confidence_percent,is_edited,source_sentence`; UTF-8 with BOM; values quoted and escaped; formula injection guard (prefix cells starting with `=`, `+`, `-`, `@` with a single quote).
- PDF: server generated summary (title, contract name and type, date, disclaimer, table of terms with page and confidence) using `pdf-lib`; includes the not-legal-advice disclaimer.
- Uses `edited_value ?? original_value`.
- Response `Content-Disposition: attachment; filename="<contract-name>-key-terms.<ext>"` (sanitised). Generation at most 5 seconds.

## 6. Acceptance Criteria

- Landing page renders without client JS errors and passes Lighthouse accessibility at least 95.
- Dashboard shows correct totals and type split, sorting works for the three sortable columns, row opens results, delete removes the contract and all children (verified in integration test).
- Empty state text matches exactly.
- Feedback persists, can be updated, and a second user cannot read or write it.
- CSV export (v1.1) neutralises formula cells and includes edited values.
- Tests: component (table sorting, empty state, dialog), integration (summary counts, feedback upsert, cascade delete), E2E (delete, feedback).
