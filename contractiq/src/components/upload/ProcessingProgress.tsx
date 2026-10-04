'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export type ProcessingStage = 'analysing' | 'compiling';

const STEPS = [
  { key: 'extracting', label: 'Extracting text' },
  { key: 'analysing', label: 'Analysing with AI' },
  { key: 'compiling', label: 'Compiling results' },
] as const;

const STAGE_MESSAGES = [
  { after: 0,  text: 'Starting AI analysis…' },
  { after: 15, text: 'Reading contract clauses…' },
  { after: 30, text: 'Identifying key terms…' },
  { after: 50, text: 'Cross-referencing definitions…' },
  { after: 75, text: 'Scoring confidence levels…' },
  { after: 100, text: 'Almost there — compiling results…' },
];

/** 2-minute window; bar caps at 95% until the server actually responds. */
const EXPECTED_SECONDS = 120;

function statusFor(
  stepKey: (typeof STEPS)[number]['key'],
  stage: ProcessingStage,
): 'done' | 'active' | 'pending' {
  if (stepKey === 'extracting') return 'done';
  if (stepKey === 'analysing') return stage === 'analysing' ? 'active' : 'done';
  return stage === 'compiling' ? 'active' : 'pending';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function currentMessage(elapsed: number): string {
  const matched = [...STAGE_MESSAGES].reverse().find((m) => elapsed >= m.after);
  return matched?.text ?? STAGE_MESSAGES[0].text;
}

export function ProcessingProgress({ stage }: { stage: ProcessingStage }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const progressPct = Math.min((elapsed / EXPECTED_SECONDS) * 100, 95);

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border border-border bg-bg-primary p-6"
      role="region"
      aria-label="Processing progress"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }} className="text-text-primary">
            Processing your contract
          </h2>
          <p style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400 }} className="text-text-secondary">
            The AI agent is reading and analysing your document. This can take up to 2 minutes.
          </p>
        </div>
        <span
          style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
          className="text-text-secondary"
          aria-live="polite"
          aria-label={`Elapsed time: ${formatTime(elapsed)}`}
        >
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-bg-surface"
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <ol className="flex flex-col gap-3">
        {STEPS.map((step) => {
          const status = statusFor(step.key, stage);
          return (
            <li
              key={step.key}
              aria-current={status === 'active' ? 'step' : undefined}
              className="flex items-center gap-3"
              style={{
                fontSize: 14,
                lineHeight: '20px',
                fontWeight: status === 'pending' ? 400 : 500,
                color: status === 'pending' ? 'var(--text-secondary)' : 'var(--text-primary)',
              }}
            >
              {status === 'done' ? (
                <CheckCircle2 size={18} className="text-success-solid flex-shrink-0" aria-hidden="true" />
              ) : status === 'active' ? (
                <Loader2 size={18} className="animate-spin text-brand flex-shrink-0" aria-hidden="true" />
              ) : (
                <Circle size={18} className="text-text-disabled flex-shrink-0" aria-hidden="true" />
              )}
              <span>{step.label}</span>
              <span className="sr-only">
                {status === 'done' ? '(done)' : status === 'active' ? '(in progress)' : '(waiting)'}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Live status message */}
      <p
        role="status"
        aria-live="polite"
        style={{ fontSize: 12, lineHeight: '16px', fontWeight: 400 }}
        className="text-text-secondary"
      >
        {currentMessage(elapsed)}
      </p>
    </div>
  );
}