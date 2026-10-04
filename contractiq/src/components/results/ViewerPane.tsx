'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useViewerStore } from '@/stores/viewer.store';
import type { ContractPage } from '@/types/domain';
import { TextViewer } from './TextViewer';

// pdf.js touches browser-only globals at import time, so it must never be rendered on the server.
const PdfViewer = dynamic(() => import('./PdfViewer').then((module) => module.PdfViewer), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-lg bg-bg-subtle" aria-busy="true" aria-label="Loading PDF" />,
});

export interface ViewerPaneProps {
  contractId: string;
  hasPdf: boolean;
  pages: ContractPage[];
}

interface SignedUrl {
  url: string;
  expires_in: number;
}

/** Shows the PDF when Storage can serve it, otherwise the stored text. Both react to the same navigation state. */
export function ViewerPane({ contractId, hasPdf, pages }: ViewerPaneProps) {
  const [pdfFailed, setPdfFailed] = useState(false);
  const targetPage = useViewerStore((state) => state.targetPage);
  const highlightText = useViewerStore((state) => state.highlightText);
  const navKey = useViewerStore((state) => state.navKey);
  const clear = useViewerStore((state) => state.clear);

  const signed = useQuery({
    queryKey: ['signed-url', contractId],
    queryFn: () => apiFetch<SignedUrl>(`/api/contracts/${contractId}/signed-url`),
    enabled: hasPdf && !pdfFailed,
    // Signed URLs last an hour; refresh well before that.
    staleTime: 50 * 60 * 1000,
    retry: false,
  });

  const onPdfError = useCallback(() => setPdfFailed(true), []);

  const viewerProps = { pages, targetPage, highlightText, navKey, onClearHighlight: clear };
  const showPdf = hasPdf && !pdfFailed && signed.data?.url;
  const waiting = hasPdf && !pdfFailed && signed.isLoading;

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-2">
      {waiting ? (
        <div className="h-full flex-1 animate-pulse rounded-lg bg-bg-subtle" aria-busy="true" aria-label="Loading document" />
      ) : showPdf ? (
        <div className="min-h-0 flex-1">
          <PdfViewer url={signed.data!.url} onError={onPdfError} {...viewerProps} />
        </div>
      ) : (
        <>
          <p className="type-body-sm text-text-secondary" role="status">
            Showing text view.{' '}
            {pdfFailed && signed.data?.url ? (
              <a href={signed.data.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">
                Download PDF
              </a>
            ) : null}
          </p>
          <div className="min-h-0 flex-1">
            <TextViewer {...viewerProps} />
          </div>
        </>
      )}
    </div>
  );
}
