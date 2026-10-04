'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

export interface InfoTooltipProps {
  /** Short plain-English text shown in the tooltip. */
  content: string;
  /** Accessible name for the trigger, e.g. "What is Indemnification?". */
  label: string;
}

/** Keyboard-focusable info icon with a tooltip (opens on hover and focus, closes with Escape). */
export function InfoTooltip({ content, label }: InfoTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-text-secondary hover:text-text-primary"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            className="z-50 max-w-[260px] rounded-md border border-border-strong bg-bg-primary px-3 py-2 type-body-sm text-text-primary"
          >
            {content}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
