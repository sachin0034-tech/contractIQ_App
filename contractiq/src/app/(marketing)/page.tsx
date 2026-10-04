// Server Component: no JS event handlers. Hover/focus styles live in globals.css.
import Link from 'next/link';

const STEPS = [
  { title: 'Upload', body: 'Choose NDA or MSA and drop in a text-layer PDF up to 20 pages.' },
  { title: 'Review key terms', body: 'See each term with its page, confidence score, and the exact sentence it came from.' },
  { title: 'Ask questions', body: 'Chat in plain English. Answers come only from your document, with page citations.' },
];

const TRUST = [
  'Every term shows where it came from',
  'Confidence scores on every term',
  'Answers only from your document',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-28">
        <span className="text-h5">ContractIQ</span>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Link href="/sign-in" className="btn btn-secondary">Sign In</Link>
          <Link href="/sign-up" className="btn btn-primary">Get Started Free</Link>
        </nav>
      </header>

      <main className="flex flex-col gap-16 px-6 py-16 md:px-28 md:py-24">
        <section className="flex max-w-[720px] flex-col gap-6" aria-labelledby="hero-title">
          <h1 id="hero-title" className="text-h2 md:text-h1">
            Understand any NDA or MSA in 15 minutes, not 90.
          </h1>
          <p className="text-body-lg text-text-secondary">
            Upload a contract. Get the key terms with page references and confidence scores.
            Ask questions in plain English.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn btn-primary">Get Started Free</Link>
            <Link href="/sign-in" className="btn btn-secondary">Sign In</Link>
          </div>
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="how-title">
          <h2 id="how-title" className="type-h5">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2 rounded-lg border border-border bg-bg-primary p-6">
                <span className="type-body-sm text-text-secondary">Step {i + 1}</span>
                <span className="type-body-lg">{s.title}</span>
                <span className="type-body-sm text-text-secondary">{s.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6 rounded-lg bg-bg-surface p-6" aria-labelledby="trust-title">
          <h2 id="trust-title" className="type-h5">Built to be checked, not trusted blindly</h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {TRUST.map((t) => (
              <li key={t} className="type-body-lg">{t}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-border px-6 py-6 md:px-28">
        <p className="type-body-sm text-text-secondary">
          This is an AI-assisted review tool, not legal advice. Always verify critical terms with a qualified lawyer.
        </p>
        <p className="type-body-sm text-text-secondary">
          <Link href="/legal/terms" className="underline">Terms</Link>
          {' · '}
          <Link href="/legal/privacy" className="underline">Privacy</Link>
          {' · '}Powered by Microsoft Azure AI Foundry
        </p>
      </footer>
    </div>
  );
}
