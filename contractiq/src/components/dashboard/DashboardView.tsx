'use client';

import Link from 'next/link';
import { useDashboardSummary } from '@/hooks/useDashboard';
import type { ContractPageResult, DashboardSummary } from '@/types/api';
import { ContractsTable } from './ContractsTable';
import { SummaryCards } from './SummaryCards';

export interface DashboardViewProps {
  initialSummary: DashboardSummary;
  initialPage: ContractPageResult;
}

export function DashboardView({ initialSummary, initialPage }: DashboardViewProps) {
  const { data: summary } = useDashboardSummary(initialSummary);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="type-h5">Dashboard</h1>
        <Link href="/contracts/new" className="btn btn-primary">
          Review a Contract
        </Link>
      </div>
      <SummaryCards summary={summary} />
      <section aria-labelledby="contracts-title" className="flex flex-col gap-3">
        <h2 id="contracts-title" className="type-h5">
          Your contracts
        </h2>
        <ContractsTable initialPage={initialPage} />
      </section>
    </div>
  );
}
