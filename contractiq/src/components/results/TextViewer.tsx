'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { locateSentence } from '@/lib/pdf/highlight';
import { scrollToElement, type ViewerProps } from './viewer-types';

/** Paginated text rendering of the stored contract text. Fallback when the PDF is unavailable. */
export function TextViewer({ pages, targetPage, highlightText, navKey, onClearHighlight }: ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flashPage, setFlashPage] = useState<number | null>(null);

  // Where to mark the sentence on the target page, if it can be found there.
  const highlight = useMemo(() => {
    if (targetPage === null || !highlightText) return null;
    const page = pages.find((p) => p.n === targetPage);
    if (!page) return null;
    const range = locateSentence(page.text, highlightText);
    return range ? { page: targetPage, ...range } : null;
  }, [pages, targetPage, highlightText]);

  useEffect(() => {
    if (navKey === 0 || targetPage === null) return;
    const container = containerRef.current;
    if (!container) return;

    const mark = container.querySelector<HTMLElement>('mark.viewer-highlight');
    const section = container.querySelector<HTMLElement>(`#page-${targetPage}`);
    if (mark && highlight) {
      scrollToElement(container, mark, 80);
    } else if (section) {
      scrollToElement(container, section);
      if (highlightText) {
        setFlashPage(targetPage);
        const timer = setTimeout(() => setFlashPage(null), 1500);
        return () => clearTimeout(timer);
      }
    }
    // navKey is the trigger; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Contract text"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClearHighlight();
      }}
      className="h-full overflow-y-auto rounded-lg border border-border bg-bg-surface p-4"
    >
      <div className="relative mx-auto flex max-w-[80ch] flex-col gap-6">
        {pages.map((page) => (
          <section
            key={page.n}
            id={`page-${page.n}`}
            aria-labelledby={`page-label-${page.n}`}
            className={`rounded-lg border border-border bg-bg-primary p-4 ${flashPage === page.n ? 'viewer-page-flash' : ''}`}
          >
            <h3 id={`page-label-${page.n}`} className="mb-2 type-body-sm text-text-secondary">
              Page {page.n}
            </h3>
            <p className="whitespace-pre-wrap type-body-lg font-normal">
              {highlight && highlight.page === page.n ? (
                <>
                  {page.text.slice(0, highlight.start)}
                  <mark className="viewer-highlight">{page.text.slice(highlight.start, highlight.end)}</mark>
                  {page.text.slice(highlight.end)}
                </>
              ) : page.text.length > 0 ? (
                page.text
              ) : (
                <span className="text-text-secondary">This page has no text.</span>
              )}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
