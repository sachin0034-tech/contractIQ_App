import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { createClient } from '@/lib/supabase/server';
import { getDashboardSummary } from '@/services/dashboard.service';
import { listUserContracts } from '@/services/contract.service';

export const metadata: Metadata = { title: 'Dashboard | ContractIQ' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=%2Fdashboard');

  const [summary, page] = await Promise.all([
    getDashboardSummary(supabase, user.id),
    listUserContracts(supabase, user.id, { sort: 'created_at', ascending: false, limit: PAGE_SIZE, offset: 0 }),
  ]);

  const initialPage = {
    items: page.items,
    next_cursor: page.nextOffset === null ? null : Buffer.from(String(page.nextOffset), 'utf8').toString('base64url'),
  };

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-12">
      <DashboardView initialSummary={summary} initialPage={initialPage} />
    </main>
  );
}
