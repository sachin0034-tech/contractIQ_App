'use client';

import { Fragment } from 'react';
import { useViewerStore } from '@/stores/viewer.store';

const CITATION = /\[Page (\d+)\]/g;

/**
 * Renders chat text as plain text with each [Page X] citation turned into a button that opens that page
 * in the document viewer. Model output is never interpreted as HTML.
 */
export function CitationText({ text, pageCount }: { text: string; pageCount: number }) {
  const goTo = useViewerStore((state) => state.goTo);
  const parts: Array<{ kind: 'text'; value: string } | { kind: 'cite'; page: number }> = [];

  let cursor = 0;
  for (const match of text.matchAll(CITATION)) {
    const page = Number.parseInt(match[1], 10);
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ kind: 'text', value: text.slice(cursor, index) });
    if (page >= 1 && page <= pageCount) parts.push({ kind: 'cite', page });
    else parts.push({ kind: 'text', value: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ kind: 'text', value: text.slice(cursor) });

  return (
    <>
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <Fragment key={index}>{part.value}</Fragment>
        ) : (
          <button
            key={index}
            type="button"
            onClick={() => goTo(part.page)}
            aria-label={`Go to page ${part.page} in the document`}
            className="mx-0.5 rounded-md border border-border-strong bg-bg-primary px-1.5 py-0.5 align-baseline type-body-sm text-brand hover:bg-bg-subtle"
          >
            Page {part.page}
          </button>
        ),
      )}
    </>
  );
}
