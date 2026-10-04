# Spec 05: Results Page, Key Terms Panel, Viewer, Inline Edit (US-003, US-004, US-006, US-009, US-011-partial, FR-04, FR-06, FR-07, FR-11)

## 1. Page: `/contracts/[id]`

`src/app/(app)/contracts/[id]/page.tsx` is a Server Component that fetches the contract under the user's session (RLS) and passes initial data to `ResultsLayout` (client). If `status` is `uploaded` or `error`, render `ContractNotReady` with the relevant CTA (Process / Try again) instead of the results. If `processing`, show the progress component and poll `GET /api/contracts/[id]` every 3 seconds until it changes.

Layout (desktop at least 1024px): two columns, left 55% `ViewerPane`, right 45% `RightPane` with Tabs "Key Terms" and "Chat". Below 1024px: top-level tabs "Document", "Key Terms", "Chat". `DisclaimerBanner` sits above both panes, always visible, uses the `warning` status tokens, text from `DISCLAIMER`. Footer shows "Powered by OpenAI GPT-4o".

Page chrome: contract name (H5), type badge, status badge, "Back to dashboard", `ExportMenu` (v1.1, hidden in MVP), `FeedbackWidget` at the bottom of the right pane.

## 2. Viewer Contract

Both viewers implement:

```ts
interface ViewerProps {
  pages: ContractPage[];             // from contract_text (always available)
  targetPage: number | null;         // 1-indexed; change triggers scroll
  highlightText: string | null;      // source sentence to mark on the target page
  onPageVisible?: (n: number) => void;
}
```

State lives in `src/stores/viewer.store.ts` (Zustand): `{ targetPage, highlightText, highlightTermId, goTo(page, text?, termId?) , clear() }`. `goTo` always creates a new object so selecting the same page again re-triggers the scroll.

### 2.1 `ViewerPane` selection logic

1. Call `GET /api/contracts/[id]/signed-url` once on mount (React Query, `staleTime` 50 minutes, refetch on 403 from PDF.js).
2. If it returns a URL, render `PdfViewer`. If 404 PDF_UNAVAILABLE, or PDF.js raises a load or render error, render `TextViewer` and show a small note "Showing text view" (plus a "Download PDF" link when a signed URL exists but rendering failed).
3. Both components receive the same `ViewerProps`.

### 2.2 `PdfViewer` (client, `pdfjs-dist`)

- Worker configured via `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`.
- Renders pages lazily with an IntersectionObserver (render when within 1 viewport of the screen, release canvases far away). Each page wrapper has `id="page-{n}"`, `data-page`, and a fixed aspect ratio placeholder to avoid layout jumps.
- Zoom controls: buttons and `Ctrl +/-` within the viewer; range 50% to 300%, step 25%, default fit-to-width. Page indicator "Page X of N".
- Text layer enabled (for selection and highlight).
- On `targetPage` change: `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the page wrapper (respects `prefers-reduced-motion` by using `auto`), then highlight: after the page's text layer renders, find the highlight sentence by walking text-layer spans, concatenating their `textContent` with a normalised whitespace map, locating the normalised sentence, and adding class `viewer-highlight` to the covering spans (design token: `--status-warning-bg` background, `--status-warning-border` 2px left border). If the sentence cannot be located, apply `viewer-page-flash` (outline in `--focus-ring` for 1.5 seconds) to the whole page. Highlight is cleared on the next `goTo` or when the user presses Escape.
- Page visibility reporting uses the most visible page.

### 2.3 `TextViewer` (client)

- Renders each page as `<section id="page-{n}" aria-labelledby="page-label-{n}">` with a sticky label "Page n" and text in a `pre-wrap` block (body-lg type, max line length 80ch).
- Same `targetPage` scroll and highlight behaviour; the highlight uses `<mark class="viewer-highlight">` found by normalised substring search within the page text, falling back to the page flash.
- Search box (client side substring, optional, in v1.0).

Parity requirement (FR-06): any `goTo()` that works in `PdfViewer` must work in `TextViewer` with the same inputs. A shared test suite runs both with identical cases.

## 3. Key Terms Panel (`KeyTermsPanel`)

Sorted by `sort_order` (standard terms first, then custom). Header shows "N terms, M need verification" where M counts confidence below 0.5.

### 3.1 `KeyTermRow` anatomy

| Part | Spec |
|---|---|
| Term name | Body-lg Medium, with a help tooltip icon (`TERM_HELP`); "Custom" badge for custom terms; "Edited" badge when `is_edited` |
| Value | Body-lg; click or Enter on the value enters inline edit; shows `edited_value` when edited |
| Page chip | `Page {n}` button; click calls `goTo(n, source_sentence, termId)`; absent (shows "No page") when null |
| Confidence | `ConfidenceBadge` showing `{round(score*100)}%` plus text label, bands below |
| Why? | Disclosure button (`aria-expanded`) revealing the verbatim `source_sentence` in a quote block; if null: "No supporting sentence was found." |
| Row click | Selecting a row (not editing) also calls `goTo` and marks the row `aria-current` |

### 3.2 Confidence bands (`src/lib/confidence.ts`)

| Band | Range (score) | Label | Tokens | Icon |
|---|---|---|---|---|
| high | >= 0.80 | "High" | success | check-circle |
| medium | 0.50 to 0.79 | "Medium" | warning | alert-triangle outline |
| low | < 0.50 | "Low" | danger | alert-triangle filled |

`bandFor(score)` is the only place thresholds are applied (unit tested at 0.4999, 0.5, 0.7999, 0.8).

### 3.3 Low confidence (FR-11)

- Warning icon shown next to the badge with a non-dismissible tooltip (focusable, `role="tooltip"`, opens on hover and focus): "Low confidence. We recommend verifying this in the document directly."
- The value is never hidden or collapsed.
- Rendering a low-confidence term on the page for the first time (or when the user selects it) auto-calls `goTo` with its page and sentence so the viewer highlights the nearest match. Auto navigation happens only on explicit selection or when the user expands "Why?"; it does not run on page load for every term (avoids scroll jumping).
- "Not found" terms use the same warning with the tooltip text "We could not find this term in the document." and no page chip.

### 3.4 Banners

- `type_mismatch` soft warning (Spec 04 Section 1).
- "Most terms are low confidence" banner when more than 50% of terms are below 0.5.
- Calibration warning (when `NEXT_PUBLIC_CALIBRATION_WARNING === 'true'`): "Confidence scores may be less reliable than usual right now. Verify important terms in the document."

## 4. Inline Edit (US-009)

- Click value or press Enter: value becomes a textarea (autosize, max 2,000 chars, counter shown above 1,800). Enter saves, Shift+Enter newline, Escape cancels, blur saves if changed.
- Optimistic update via React Query `useMutation` calling `PATCH /api/key-terms/[id]` with `{ value }`; on error revert and show toast "Could not save your edit. Try again."
- On success the row shows an "Edited" badge; a "Show AI value" toggle reveals `original_value`; "Revert to AI value" calls PATCH with `{ value: original_value }` which sets `edited_value` to the original and `is_edited` to false (server rule: when the new value equals `original_value`, set `edited_value = null`, `is_edited = false`, `edited_at = null`).
- Empty values are rejected client side ("Value cannot be empty").
- Save latency target: 2 seconds or less.

### `PATCH /api/key-terms/[id]`
Request `{ "value": string }` (trimmed, 1 to 2000 chars). Auth and rate limit `check_rate_limit('edit', 120, 60)`. Select the term with `.eq('id', id).eq('user_id', user.id)`; NOT_FOUND otherwise. Update only `edited_value`, `is_edited`, `edited_at` (column grants enforce this at the database). Response 200: the updated `KeyTerm`.

## 5. Accessibility

- Key terms list is a `ul` with each row a `li`; all controls reachable by keyboard in DOM order; visible focus ring (`--focus-ring`, 2px).
- Confidence is conveyed by icon, text label, and percentage, never colour alone.
- Viewer pages have landmarks and labels; zoom buttons have `aria-label`s; streaming and progress regions use `aria-live="polite"`.
- Contrast at least 4.5:1 for text; tooltips dismissible with Escape (except the low-confidence content remains available via the always-visible warning text for screen readers through `aria-describedby`).

## 6. Loading, Empty, Error States

| State | UI |
|---|---|
| Loading results | Skeleton rows (8) and viewer placeholder |
| Viewer error | Text viewer fallback and note |
| Results fetch error | Inline error with retry; if 404, "This contract was not found" with link to dashboard |
| Zero terms (should not occur) | Error state with Try again (re-process) |

## 7. Acceptance Criteria

- Each term shows name, value, page, confidence percentage and band; clicking the page chip scrolls and highlights in both viewers.
- A term at 0.49 shows the warning and tooltip; at 0.50 shows medium without warning icon.
- With Storage blocked (`signed-url` returns 404) the text viewer renders and click-to-navigate still works.
- Editing a value persists, shows "Edited", survives reload, and `original_value` in the database is unchanged.
- axe has zero serious or critical violations on this page.
- Tests: unit (`bandFor`, edit reducer), component (KeyTermRow states, TextViewer navigation, shared viewer parity suite), integration (PATCH happy path, foreign row 404, original preserved, revert), E2E (click page, why, edit, reload).
