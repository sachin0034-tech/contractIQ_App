'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Alert } from '@/components/ui/Alert';
import { useContractDetail } from '@/hooks/useContractDetail';
import { LOW_CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { useViewerStore } from '@/stores/viewer.store';
import type { ContractDetail } from '@/types/api';
import { ContractStatusPanel } from './ContractStatusPanel';
import { DisclaimerBanner } from './DisclaimerBanner';
import { FeedbackWidget } from './FeedbackWidget';
import { KeyTermsPanel } from './KeyTermsPanel';
import { ViewerPane } from './ViewerPane';

type RightTab = 'terms' | 'chat';
type View = RightTab | 'document';

const TAB_LABEL: Record<View, string> = { terms: 'Key terms', chat: 'Chat', document: 'Document' };

export function ResultsLayout({ initialDetail }: { initialDetail: ContractDetail }) {
  const { data } = useContractDetail(initialDetail.contract.id, initialDetail);
  // `view` is what a small screen shows; `rightTab` is what the right-hand pane shows on large screens,
  // where the document is always visible beside it.
  const [view, setView] = useState<View>('terms');
  const [rightTab, setRightTab] = useState<RightTab>('terms');
  const navKey = useViewerStore((state) => state.navKey);
  const clear = useViewerStore((state) => state.clear);
  const { contract, terms, pages } = data;

  // Selecting a term or citation on a small screen jumps to the document.
  useEffect(() => {
    if (navKey > 0 && !window.matchMedia('(min-width: 1024px)').matches) setView('document');
  }, [navKey]);

  function selectView(next: View) {
    setView(next);
    if (next !== 'document') setRightTab(next);
  }

  // Navigation state belongs to one contract; reset it when leaving.
  useEffect(() => () => clear(), [clear]);

  const header = (
    <div className="flex flex-col gap-2">
      <Link href="/dashboard" className="inline-flex items-center gap-1 self-start type-body-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="type-h5 break-all">{contract.name}</h1>
        <span className="badge badge-success">{contract.contract_type}</span>
      </div>
    </div>
  );

  if (contract.status !== 'completed') {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ContractStatusPanel
          contractId={contract.id}
          status={contract.status}
          errorCode={contract.error_code}
        />
      </div>
    );
  }

  const lowCount = terms.filter((term) => term.confidence_score < LOW_CONFIDENCE_THRESHOLD).length;
  const mostlyLow = terms.length > 0 && lowCount / terms.length > 0.5;
  const typeMismatch = contract.detected_type !== null && contract.detected_type !== contract.contract_type;
  const calibrationWarning = process.env.NEXT_PUBLIC_CALIBRATION_WARNING === 'true';

  return (
    <div className="flex flex-col gap-4">
      {header}
      <DisclaimerBanner />

      {typeMismatch ? (
        <Alert tone="warning">
          This looks like a different type of contract than you selected. We extracted what we could, but some terms may
          be missing.
        </Alert>
      ) : null}
      {mostlyLow ? (
        <Alert tone="warning">We were not confident about most terms. Please verify them in the document.</Alert>
      ) : null}
      {calibrationWarning ? (
        <Alert tone="warning">
          Confidence scores may be less reliable than usual right now. Verify important terms in the document.
        </Alert>
      ) : null}

      <div role="tablist" aria-label="Results view" className="flex gap-2 lg:ml-[calc(55%+12px)] lg:w-[calc(45%-12px)]">
        {(['terms', 'chat', 'document'] as const).map((tab) => {
          const selected = tab === 'document' ? view === 'document' : rightTab === tab && view !== 'document';
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${tab}`}
              onClick={() => selectView(tab)}
              className={`btn flex-1 ${selected ? 'btn-primary' : 'btn-secondary'} ${tab === 'document' ? 'lg:hidden' : ''}`}
            >
              {TAB_LABEL[tab]}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">
        <div
          className={`${view === 'document' ? 'block' : 'hidden'} h-[70vh] lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-160px)]`}
        >
          <ViewerPane contractId={contract.id} hasPdf={contract.has_pdf} pages={pages} />
        </div>

        <div className={`${view === 'document' ? 'hidden' : 'block'} lg:block`}>
          <div
            id={`panel-${rightTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${rightTab}`}
            className={rightTab === 'chat' ? 'h-[70vh] lg:h-[calc(100vh-232px)]' : ''}
          >
            {rightTab === 'terms' ? (
              <KeyTermsPanel contractId={contract.id} terms={terms} />
            ) : (
              <ChatPanel contractId={contract.id} pageCount={contract.page_count} />
            )}
          </div>
        </div>
      </div>

      <FeedbackWidget contractId={contract.id} initial={data.feedback} />
    </div>
  );
}
