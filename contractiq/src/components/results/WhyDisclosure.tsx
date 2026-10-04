'use client';

import { ChevronDown } from 'lucide-react';
import { useId } from 'react';

export interface WhyDisclosureProps {
  open: boolean;
  onToggle: () => void;
  sourceSentence: string | null;
}

/** "Why?" disclosure revealing the verbatim sentence the value was drawn from. */
export function WhyDisclosure({ open, onToggle, sourceSentence }: WhyDisclosureProps) {
  const panelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 self-start rounded-sm type-body-sm text-brand hover:underline"
      >
        Why?
        <ChevronDown className={`h-3 w-3 transition-transform duration-fast ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div id={panelId} hidden={!open}>
        {sourceSentence ? (
          <blockquote className="rounded-md border-l-2 border-border-strong bg-bg-surface px-3 py-2 type-body-sm text-text-secondary">
            {sourceSentence}
          </blockquote>
        ) : (
          <p className="type-body-sm text-text-secondary">No supporting sentence was found.</p>
        )}
      </div>
    </div>
  );
}
