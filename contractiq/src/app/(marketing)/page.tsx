// Server Component — hover styles live in globals.css (no JS handlers needed)
import Link from 'next/link';
import { FileText, MessageSquare, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: FileText,
    step: '01',
    title: 'Upload your contract',
    body: 'Drop in any NDA or MSA PDF up to 20 pages. Text-layer PDFs work best.',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'Review key terms',
    body: 'Every term shows the exact source sentence, page number, and a confidence score.',
  },
  {
    icon: MessageSquare,
    step: '03',
    title: 'Ask questions',
    body: 'Chat in plain English. Every answer cites the exact page it came from.',
  },
];

const TRUST = [
  'Source sentence shown for every term',
  'Confidence score on every extraction',
  'Answers grounded only in your document',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border bg-bg-primary px-8 py-0 md:px-28" style={{ height: 56 }}>
        <span className="text-body-lg font-semibold tracking-tight text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>
          ContractIQ
        </span>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link href="/sign-in" className="btn btn-secondary" style={{ height: 36, fontSize: 14 }}>Sign In</Link>
          <Link href="/sign-up" className="btn btn-primary" style={{ height: 36, fontSize: 14 }}>Get Started Free</Link>
        </nav>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          className="border-b border-border px-8 py-16 md:px-28 md:py-24"
          aria-labelledby="hero-title"
        >
          <div className="flex max-w-[680px] flex-col gap-5">
            <p className="type-overline">AI Contract Review</p>
            <h1
              id="hero-title"
              style={{ fontSize: 36, lineHeight: '44px', fontWeight: 600, letterSpacing: '-0.02em' }}
              className="text-text-primary"
            >
              Understand any NDA or MSA<br className="hidden md:block" /> in 15 minutes, not 90.
            </h1>
            <p style={{ fontSize: 16, lineHeight: '24px', fontWeight: 400 }} className="text-text-secondary">
              Upload a contract. Get every key term with its source sentence and confidence score.
              Ask questions in plain English — answers come only from your document.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href="/sign-up" className="btn btn-primary" style={{ height: 36, fontSize: 14 }}>Get Started Free</Link>
              <Link href="/sign-in" className="btn btn-secondary" style={{ height: 36, fontSize: 14 }}>Sign In</Link>
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────── */}
        <section className="border-b border-border px-8 py-12 md:px-28 md:py-16" aria-labelledby="how-title">
          <div className="mb-8 flex flex-col gap-1">
            <h2
              id="how-title"
              style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}
              className="text-text-primary"
            >
              How it works
            </h2>
            <p style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400 }} className="text-text-secondary">
              Three steps. No configuration needed.
            </p>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, step, title, body }) => (
              <li
                key={step}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center justify-center rounded-lg border border-border bg-bg-primary"
                    style={{ width: 36, height: 36 }}
                  >
                    <Icon size={16} className="text-text-secondary" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }} className="text-text-secondary">
                    {step}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }} className="text-text-primary">
                    {title}
                  </span>
                  <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400 }} className="text-text-secondary">
                    {body}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Trust section ───────────────────────────────────── */}
        <section className="px-8 py-12 md:px-28 md:py-16" aria-labelledby="trust-title">
          <div className="mb-8 flex flex-col gap-1">
            <h2
              id="trust-title"
              style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600 }}
              className="text-text-primary"
            >
              Built to be checked, not trusted blindly
            </h2>
            <p style={{ fontSize: 14, lineHeight: '20px', fontWeight: 400 }} className="text-text-secondary">
              Every claim is traceable back to the document.
            </p>
          </div>
          <ul className="grid gap-2 md:grid-cols-3">
            {TRUST.map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg-surface px-5 py-4"
              >
                <span
                  className="flex-shrink-0 rounded-full bg-brand-subtle"
                  style={{ width: 8, height: 8 }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: 14, lineHeight: '20px', fontWeight: 500 }} className="text-text-primary">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="flex flex-col gap-1 border-t border-border px-8 py-6 md:px-28">
        <p style={{ fontSize: 12, lineHeight: '16px', fontWeight: 400 }} className="text-text-secondary">
          AI-assisted review tool — not legal advice. Always verify critical terms with a qualified lawyer.
        </p>
        <p style={{ fontSize: 12, lineHeight: '16px', fontWeight: 400 }} className="text-text-secondary">
          <Link href="/legal/terms" className="underline hover:text-text-primary">Terms</Link>
          {' · '}
          <Link href="/legal/privacy" className="underline hover:text-text-primary">Privacy</Link>
          {' · '}Powered by Microsoft Azure AI Foundry
        </p>
      </footer>

    </div>
  );
}
