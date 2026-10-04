import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalPageProps {
  title: string;
  updated: string;
  sections: LegalSection[];
}

/** Shared layout for the public legal pages. */
export function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border px-6 py-4 md:px-28">
        <Link href="/" className="text-h5">
          ContractIQ
        </Link>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="type-h5">{title}</h1>
          <p className="type-body-sm text-text-secondary">Last updated {updated}</p>
        </div>
        <Alert tone="warning">
          This is a working draft written for the product team. It must be reviewed and approved by legal counsel
          before ContractIQ opens to the public.
        </Alert>
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="type-body-lg">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="type-body-lg font-normal text-text-secondary">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
