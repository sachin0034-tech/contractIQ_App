import { FileText } from 'lucide-react';
import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-bg-primary px-6 py-16 text-center">
      <FileText className="h-8 w-8 text-text-secondary" aria-hidden="true" />
      <p className="type-body-lg">No contracts reviewed yet. Upload your first contract to begin</p>
      <Link href="/contracts/new" className="btn btn-primary">
        Review a Contract
      </Link>
    </div>
  );
}
