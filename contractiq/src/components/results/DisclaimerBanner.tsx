import { Scale } from 'lucide-react';
import { DISCLAIMER } from '@/lib/constants';

/** Always visible on the results page. Not dismissible. */
export function DisclaimerBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-4 py-3 type-body-sm text-warning-text"
    >
      <Scale className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{DISCLAIMER}</p>
    </div>
  );
}
