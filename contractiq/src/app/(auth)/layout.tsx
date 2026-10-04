import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-surface">
      <header className="px-6 py-4 md:px-28">
        <Link href="/" className="text-h5">
          ContractIQ
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-12 md:py-16">
        <div className="flex w-full max-w-[420px] flex-col gap-6 rounded-xl border border-border bg-bg-primary p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
