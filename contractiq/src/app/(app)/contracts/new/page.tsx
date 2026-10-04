import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { NewContractWizard, type ResumeContract } from '@/components/upload/NewContractWizard';
import { AppError } from '@/lib/errors';
import { getOwnedContract } from '@/lib/http';
import { createClient } from '@/lib/supabase/server';
import { listCustomTerms, type ContractRow } from '@/repositories/contracts.repo';

export const metadata: Metadata = { title: 'Review a contract | ContractIQ' };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadResume(resumeId: string): Promise<ResumeContract> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  let row: Pick<ContractRow, 'id' | 'name' | 'contract_type' | 'page_count' | 'status'>;
  try {
    row = await getOwnedContract(supabase, resumeId, user.id, 'id, name, contract_type, page_count, status');
  } catch (error) {
    if (error instanceof AppError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  // Already processed or being processed: go to the results page instead of the wizard.
  if (row.status === 'completed' || row.status === 'processing') redirect(`/contracts/${row.id}`);

  const customTerms = await listCustomTerms(supabase, row.id);
  return {
    id: row.id,
    name: row.name,
    contract_type: row.contract_type,
    page_count: row.page_count,
    customTerms: customTerms.map((t) => t.term_name),
  };
}

export default async function NewContractPage({ searchParams }: { searchParams: { resume?: string } }) {
  const resumeId = searchParams.resume;
  const resume = resumeId && UUID.test(resumeId) ? await loadResume(resumeId) : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 py-10 md:px-12">
      <div className="flex flex-col gap-1">
        <h1 className="type-h5">Review a contract</h1>
        <p className="type-body-sm text-text-secondary">
          Choose the contract type, upload the PDF, and we will pull out the key terms.
        </p>
      </div>
      <NewContractWizard resume={resume} />
    </main>
  );
}
