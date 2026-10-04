'use client';

import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toaster';
import { LOW_CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { useUpdateKeyTerm } from '@/hooks/useContractDetail';
import { useViewerStore } from '@/stores/viewer.store';
import type { KeyTerm } from '@/types/domain';
import { KeyTermRow } from './KeyTermRow';

export interface KeyTermsPanelProps {
  contractId: string;
  terms: KeyTerm[];
}

export function KeyTermsPanel({ contractId, terms }: KeyTermsPanelProps) {
  const goTo = useViewerStore((state) => state.goTo);
  const highlightTermId = useViewerStore((state) => state.highlightTermId);
  const update = useUpdateKeyTerm(contractId);
  const { toast } = useToast();

  const needVerification = terms.filter((term) => term.confidence_score < LOW_CONFIDENCE_THRESHOLD).length;

  const onSelect = useCallback(
    (term: KeyTerm) => {
      if (term.page_number !== null) goTo(term.page_number, term.source_sentence, term.id);
    },
    [goTo],
  );

  const onSave = useCallback(
    async (termId: string, value: string) => {
      try {
        await update.mutateAsync({ termId, value });
      } catch (error) {
        toast('Could not save your edit. Try again.', 'error');
        throw error;
      }
    },
    [update, toast],
  );

  return (
    <section aria-labelledby="key-terms-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="key-terms-title" className="type-h5">
          Key terms
        </h2>
        <p className="type-body-sm text-text-secondary">
          {terms.length} {terms.length === 1 ? 'term' : 'terms'}
          {needVerification > 0 ? `, ${needVerification} to verify` : ', all with good confidence'}. Select a term to
          see where it appears in the document.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {terms.map((term) => (
          <KeyTermRow
            key={term.id}
            term={term}
            selected={highlightTermId === term.id}
            onSelect={onSelect}
            onSave={onSave}
          />
        ))}
      </ul>
    </section>
  );
}
