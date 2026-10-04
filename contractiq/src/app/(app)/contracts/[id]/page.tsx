import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ResultsLayout } from '@/components/results/ResultsLayout';
import { AppError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { getContractDetail } from '@/services/contract.service';

export const metadata: Metadata = { title: 'Contract review | ContractIQ' };
export const dynamic = 'force-dynamic';

export default async function ContractPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/contracts/${params.id}`)}`);

  let detail;
  try {
    detail = await getContractDetail(supabase, params.id, user.id);
  } catch (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">
      <ResultsLayout initialDetail={detail} />
    </main>
  );
}
