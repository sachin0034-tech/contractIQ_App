'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useId, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { contractKey } from '@/hooks/useContractDetail';
import { apiFetch, ApiError, jsonRequest } from '@/lib/api-client';
import type { ContractDetail } from '@/types/api';
import type { FeedbackRating, FeedbackRecord } from '@/types/domain';

export interface FeedbackWidgetProps {
  contractId: string;
  initial: FeedbackRecord | null;
}

const COMMENT_LIMIT = 2000;

/** One thumbs rating with an optional comment per contract. Submitting again updates the same record. */
export function FeedbackWidget({ contractId, initial }: FeedbackWidgetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const commentId = useId();
  const [rating, setRating] = useState<FeedbackRating | null>(initial?.rating ?? null);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [saved, setSaved] = useState<FeedbackRecord | null>(initial);

  const submit = useMutation({
    mutationFn: (payload: { rating: FeedbackRating; comment: string }) =>
      apiFetch<FeedbackRecord>(`/api/contracts/${contractId}/feedback`, jsonRequest('POST', payload)),
    onSuccess: (record) => {
      setSaved(record);
      queryClient.setQueryData<ContractDetail>(contractKey(contractId), (current) =>
        current ? { ...current, feedback: record } : current,
      );
      toast('Thanks for your feedback.', 'success');
    },
  });

  const dirty = rating !== null && (saved?.rating !== rating || (saved?.comment ?? '') !== comment.trim());
  const isUpdate = saved !== null;

  return (
    <section aria-labelledby="feedback-title" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-primary p-4">
      <h2 id="feedback-title" className="type-body-lg">
        Were the extracted terms accurate?
      </h2>
      <div role="group" aria-label="Rate the extracted terms" className="flex gap-2">
        <Button
          variant={rating === 'up' ? 'primary' : 'secondary'}
          aria-pressed={rating === 'up'}
          onClick={() => setRating('up')}
        >
          <ThumbsUp className="h-4 w-4" aria-hidden="true" />
          Yes
        </Button>
        <Button
          variant={rating === 'down' ? 'primary' : 'secondary'}
          aria-pressed={rating === 'down'}
          onClick={() => setRating('down')}
        >
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
          Not quite
        </Button>
      </div>

      {rating !== null ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={commentId} className="type-body-sm text-text-secondary">
            {rating === 'down' ? 'What was wrong? (optional)' : 'Anything to add? (optional)'}
          </label>
          <textarea
            id={commentId}
            value={comment}
            rows={3}
            maxLength={COMMENT_LIMIT}
            onChange={(event) => setComment(event.target.value)}
            className="w-full resize-none rounded-md border border-border bg-bg-primary px-3 py-2 type-body-lg hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
          {submit.isError ? (
            <Alert tone="error">
              {submit.error instanceof ApiError ? submit.error.message : 'Could not send your feedback. Try again.'}
            </Alert>
          ) : null}
          <div>
            <Button
              onClick={() => submit.mutate({ rating, comment: comment.trim() })}
              loading={submit.isPending}
              disabled={!dirty}
            >
              {isUpdate ? 'Update feedback' : 'Send feedback'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
