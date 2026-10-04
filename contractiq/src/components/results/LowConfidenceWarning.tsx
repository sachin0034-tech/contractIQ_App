'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertTriangle } from 'lucide-react';
import { useId } from 'react';

export const LOW_CONFIDENCE_MESSAGE = 'Low confidence. We recommend verifying this in the document directly.';
export const NOT_FOUND_MESSAGE = 'We could not find this term in the document.';

/**
 * Warning shown for terms below the confidence threshold. The term itself is never hidden.
 * The message is always available to screen readers and cannot be switched off.
 */
export function LowConfidenceWarning({ notFound = false }: { notFound?: boolean }) {
  const id = useId();
  const message = notFound ? NOT_FOUND_MESSAGE : LOW_CONFIDENCE_MESSAGE;
  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-describedby={id}
            aria-label="Why is this flagged?"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-danger-solid hover:bg-danger-bg"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <span id={id} className="sr-only">
          {message}
        </span>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            className="z-50 max-w-[260px] rounded-md border border-danger-border bg-danger-bg px-3 py-2 type-body-sm text-danger-text"
          >
            {message}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
