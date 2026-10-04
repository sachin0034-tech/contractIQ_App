'use client';

import { Minus, Plus } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { findSpansForSentence } from '@/lib/pdf/highlight';
import { scrollToElement, type ViewerProps } from './viewer-types';

// Served from public/ (copied from node_modules by scripts/copy-pdf-worker.mjs).
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const GUTTER = 32;

export interface PdfViewerProps extends ViewerProps {
  url: string;
  /** Called when the document cannot be loaded or rendered so the parent can fall back to the text viewer. */
  onError: () => void;
}

interface PageProps {
  doc: PDFDocumentProxy;
  n: number;
  scale: number;
  placeholderHeight: number;
  isTarget: boolean;
  highlightText: string | null;
  navKey: number;
  onError: () => void;
}

/** One lazily rendered PDF page: canvas plus selectable text layer, released when far off screen. */
function PdfPage({ doc, n, scale, placeholderHeight, isTarget, highlightText, navKey, onError }: PageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [textReady, setTextReady] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '100% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const textDiv = textRef.current;
    if (!near || !canvas || !textDiv) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    let textLayer: { cancel: () => void } | null = null;
    setTextReady(false);

    (async () => {
      try {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        setSize({ width: viewport.width, height: viewport.height });

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is not available');
        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        await renderTask.promise;
        if (cancelled) return;

        textDiv.replaceChildren();
        const layer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textDiv,
          viewport,
        });
        textLayer = layer;
        await layer.render();
        if (!cancelled) setTextReady(true);
      } catch (error) {
        const name = (error as { name?: string })?.name;
        if (cancelled || name === 'RenderingCancelledException' || name === 'AbortException') return;
        onError();
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayer?.cancel();
      textDiv.replaceChildren();
      canvas.width = 0;
      canvas.height = 0;
      setTextReady(false);
    };
  }, [near, doc, n, scale, onError]);

  // Highlight the source sentence in the text layer of the target page; fall back to flashing the page.
  useEffect(() => {
    const textDiv = textRef.current;
    if (!textDiv) return;
    textDiv.querySelectorAll('.viewer-highlight').forEach((node) => node.classList.remove('viewer-highlight'));
    if (!isTarget || !highlightText || !textReady) return;

    const spans = Array.from(textDiv.querySelectorAll<HTMLElement>(':scope > span'));
    const hits = findSpansForSentence(
      spans.map((span) => span.textContent ?? ''),
      highlightText,
    );
    if (hits.length > 0) {
      hits.forEach((index) => spans[index].classList.add('viewer-highlight'));
      return;
    }
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1500);
    return () => clearTimeout(timer);
  }, [isTarget, highlightText, textReady, navKey]);

  return (
    <div
      ref={wrapperRef}
      id={`page-${n}`}
      data-page={n}
      aria-label={`Page ${n}`}
      className={`relative mx-auto bg-bg-primary ${flash ? 'viewer-page-flash' : ''}`}
      style={
        {
          width: size?.width,
          minHeight: size?.height ?? placeholderHeight,
          '--scale-factor': scale,
        } as React.CSSProperties
      }
    >
      <canvas ref={canvasRef} className="block" aria-hidden="true" />
      <div ref={textRef} className="textLayer absolute inset-0" />
    </div>
  );
}

/** Interactive PDF viewer: lazy pages, zoom, selectable text, and sentence highlighting. */
export function PdfViewer({ url, pages, targetPage, highlightText, navKey, onClearHighlight, onError }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const numPages = doc?.numPages ?? pages.length;

  useEffect(() => {
    const task = pdfjs.getDocument({ url, isEvalSupported: false });
    let active = true;
    task.promise
      .then(async (loaded) => {
        if (!active) return;
        const first = await loaded.getPage(1);
        const viewport = first.getViewport({ scale: 1 });
        if (!active) return;
        setBaseSize({ width: viewport.width, height: viewport.height });
        setDoc(loaded);
      })
      .catch(() => {
        if (active) onError();
      });
    return () => {
      active = false;
      void task.destroy();
    };
  }, [url, onError]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitScale = baseSize && containerWidth > 0 ? (containerWidth - GUTTER) / baseSize.width : 1;
  const scale = Math.max(0.1, fitScale * zoom);
  const placeholderHeight = baseSize ? baseSize.height * scale : 800;

  // Navigate when a term, citation or page chip is selected.
  useEffect(() => {
    if (navKey === 0 || targetPage === null) return;
    const container = containerRef.current;
    const element = container?.querySelector<HTMLElement>(`#page-${targetPage}`);
    if (container && element) scrollToElement(container, element);
    // navKey is the trigger; the other values are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey]);

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let current = 1;
    container.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
      if (el.getBoundingClientRect().top - top <= 48) current = Number(el.dataset.page);
    });
    setCurrentPage(current);
  }, []);

  const changeZoom = (delta: number) =>
    setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-bg-subtle">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-bg-primary px-3 py-2">
        <span className="type-body-sm text-text-secondary" aria-live="polite">
          Page {currentPage} of {numPages}
        </span>
        <div className="flex items-center gap-1" role="group" aria-label="Zoom">
          <button
            type="button"
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-bg-subtle disabled:text-text-disabled"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom to fit width"
            className="h-8 min-w-[56px] rounded-md px-2 type-body-sm hover:bg-bg-subtle"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-bg-subtle disabled:text-text-disabled"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Contract PDF"
        onScroll={onScroll}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClearHighlight();
          if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+')) {
            event.preventDefault();
            changeZoom(ZOOM_STEP);
          }
          if ((event.ctrlKey || event.metaKey) && event.key === '-') {
            event.preventDefault();
            changeZoom(-ZOOM_STEP);
          }
        }}
        className="relative flex-1 overflow-auto p-4"
      >
        {doc ? (
          <div className="relative flex flex-col gap-4" style={{ width: 'max-content', minWidth: '100%' }}>
            {Array.from({ length: doc.numPages }, (_, index) => index + 1).map((n) => (
              <PdfPage
                key={n}
                doc={doc}
                n={n}
                scale={scale}
                placeholderHeight={placeholderHeight}
                isTarget={targetPage === n}
                highlightText={highlightText}
                navKey={navKey}
                onError={onError}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading PDF">
            {[0, 1].map((i) => (
              <div key={i} className="mx-auto h-[600px] w-full max-w-[640px] animate-pulse rounded-md bg-bg-primary" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
