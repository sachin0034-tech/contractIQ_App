import Link from 'next/link';
import { UserMenu } from './UserMenu';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-bg-primary px-4 py-3 md:px-12">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-h5">
          ContractIQ
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <Link href="/dashboard" className="type-body-lg text-text-secondary hover:text-text-primary">
            Dashboard
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/contracts/new" className="btn btn-primary">
          Review a Contract
        </Link>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
