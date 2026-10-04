import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { STANDARD_TERMS, TERM_HELP } from '@/lib/prompts/terms';
import type { ContractType } from '@/types/domain';

export interface TermPreviewCardProps {
  contractType: ContractType;
  customTerms: string[];
  onRemoveCustom?: (term: string) => void;
}

/** Lists the terms ContractIQ will look for: standard terms for the type, then custom terms. */
export function TermPreviewCard({ contractType, customTerms, onRemoveCustom }: TermPreviewCardProps) {
  const standard = STANDARD_TERMS[contractType];
  return (
    <section aria-labelledby="term-preview-title" className="flex flex-col gap-3 rounded-lg border border-border bg-bg-primary p-6">
      <div className="flex flex-col gap-1">
        <h2 id="term-preview-title" className="type-h5">
          Terms we will look for
        </h2>
        <p className="type-body-sm text-text-secondary">
          {standard.length} standard {contractType} terms
          {customTerms.length > 0 ? ` and ${customTerms.length} custom` : ''}.
        </p>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {standard.map((term) => (
          <li key={term} className="flex items-center gap-2 type-body-lg">
            <span>{term}</span>
            {TERM_HELP[term] ? <InfoTooltip content={TERM_HELP[term]} label={`What is ${term}?`} /> : null}
          </li>
        ))}
        {customTerms.map((term) => (
          <li key={`custom-${term}`} className="flex items-center gap-2 type-body-lg">
            <span>{term}</span>
            <span className="badge badge-success">Custom</span>
            {onRemoveCustom ? (
              <button
                type="button"
                onClick={() => onRemoveCustom(term)}
                aria-label={`Remove custom term ${term}`}
                className="rounded-sm px-1 type-body-sm text-text-secondary underline hover:text-text-primary"
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
