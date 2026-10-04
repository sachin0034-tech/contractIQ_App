import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type ProcessingStage = 'analysing' | 'compiling';

const STEPS = [
  { key: 'extracting', label: 'Extracting text' },
  { key: 'analysing', label: 'Analysing with AI' },
  { key: 'compiling', label: 'Compiling results' },
] as const;

function statusFor(stepKey: (typeof STEPS)[number]['key'], stage: ProcessingStage): 'done' | 'active' | 'pending' {
  if (stepKey === 'extracting') return 'done'; // text is extracted once, at upload
  if (stepKey === 'analysing') return stage === 'analysing' ? 'active' : 'done';
  return stage === 'compiling' ? 'active' : 'pending';
}

/** Three-step progress for processing. Announced politely to assistive technology. */
export function ProcessingProgress({ stage }: { stage: ProcessingStage }) {
  const current = STEPS.find((s) => statusFor(s.key, stage) === 'active')?.label ?? 'Finishing up';
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-bg-primary p-6">
      <h2 className="type-h5">Processing your contract</h2>
      <ol className="flex flex-col gap-3">
        {STEPS.map((step) => {
          const status = statusFor(step.key, stage);
          return (
            <li
              key={step.key}
              aria-current={status === 'active' ? 'step' : undefined}
              className={`flex items-center gap-3 type-body-lg ${status === 'pending' ? 'text-text-secondary' : ''}`}
            >
              {status === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-success-solid" aria-hidden="true" />
              ) : status === 'active' ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 text-text-disabled" aria-hidden="true" />
              )}
              <span>{step.label}</span>
              <span className="sr-only">{status === 'done' ? '(done)' : status === 'active' ? '(in progress)' : '(waiting)'}</span>
            </li>
          );
        })}
      </ol>
      <p role="status" aria-live="polite" className="type-body-sm text-text-secondary">
        {current}. This usually takes under 30 seconds.
      </p>
    </div>
  );
}
