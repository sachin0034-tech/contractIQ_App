'use client';

import { useMutation } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { apiFetch, ApiError, jsonRequest, type UploadedContract } from '@/lib/api-client';
import type { ContractType } from '@/types/domain';
import { ContractTypeSelect } from './ContractTypeSelect';
import { CustomTermInput } from './CustomTermInput';
import { PdfDropzone } from './PdfDropzone';
import { ProcessingProgress, type ProcessingStage } from './ProcessingProgress';
import { TermPreviewCard } from './TermPreviewCard';

export interface ResumeContract {
  id: string;
  name: string;
  contract_type: ContractType;
  page_count: number;
  customTerms: string[];
}

export interface NewContractWizardProps {
  /** Present when resuming an uploaded contract that has not been processed yet. */
  resume?: ResumeContract;
}

interface Uploaded {
  id: string;
  name: string;
  contractType: ContractType;
  pageCount: number;
}

export function NewContractWizard({ resume }: NewContractWizardProps) {
  const router = useRouter();
  const [contractType, setContractType] = useState<ContractType | ''>(resume?.contract_type ?? '');
  const [uploaded, setUploaded] = useState<Uploaded | null>(
    resume
      ? { id: resume.id, name: resume.name, contractType: resume.contract_type, pageCount: resume.page_count }
      : null,
  );
  const [customTerms, setCustomTerms] = useState<string[]>(resume?.customTerms ?? []);
  const [stage, setStage] = useState<ProcessingStage>('analysing');

  const handleUploaded = useCallback((contract: UploadedContract) => {
    setUploaded({
      id: contract.id,
      name: contract.name,
      contractType: contract.contract_type,
      pageCount: contract.page_count,
    });
    setCustomTerms([]);
  }, []);

  const process = useMutation({
    mutationFn: async () => {
      if (!uploaded) throw new ApiError('INVALID_INPUT', 'Upload a contract first.', 400, false);
      setStage('analysing');
      await apiFetch(`/api/contracts/${uploaded.id}/custom-terms`, jsonRequest('PUT', { terms: customTerms }));
      await apiFetch(`/api/contracts/${uploaded.id}/process`, { method: 'POST' });
      return uploaded.id;
    },
    onSuccess: (id) => {
      setStage('compiling');
      router.push(`/contracts/${id}`);
    },
  });

  function startOver() {
    process.reset();
    setUploaded(null);
    setCustomTerms([]);
    if (!resume) setContractType('');
  }

  const step = uploaded ? (process.isPending || process.isSuccess ? 3 : 2) : 1;
  const stepLabels = ['Upload', 'Review terms', 'Process'];

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-4" aria-label="Progress">
        {stepLabels.map((label, index) => {
          const number = index + 1;
          return (
            <li
              key={label}
              aria-current={number === step ? 'step' : undefined}
              className={`flex items-center gap-2 type-body-lg ${number === step ? 'text-text-primary' : 'text-text-secondary'}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border type-body-sm ${
                  number <= step ? 'border-brand bg-brand text-text-inverse' : 'border-border-strong'
                }`}
              >
                {number}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-bg-primary p-6" aria-label="Upload a contract">
          <ContractTypeSelect value={contractType} onChange={setContractType} />
          <PdfDropzone contractType={contractType} onUploaded={handleUploaded} />
          <p className="type-body-sm text-text-secondary md:hidden">
            ContractIQ works best on desktop Chrome or Firefox.
          </p>
        </section>
      ) : null}

      {uploaded && step === 2 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-bg-primary p-4">
            <p className="type-body-lg flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {uploaded.name}
              <span className="type-body-sm text-text-secondary">
                {uploaded.contractType}, {uploaded.pageCount} {uploaded.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </p>
            <Button variant="secondary" onClick={startOver}>
              Choose a different file
            </Button>
          </div>

          <TermPreviewCard
            contractType={uploaded.contractType}
            customTerms={customTerms}
            onRemoveCustom={(term) => setCustomTerms((terms) => terms.filter((t) => t !== term))}
          />
          <CustomTermInput
            contractType={uploaded.contractType}
            terms={customTerms}
            onAdd={(term) => setCustomTerms((terms) => [...terms, term])}
          />

          {process.isError ? (
            <Alert tone="error">
              {process.error instanceof ApiError ? process.error.message : 'Something went wrong. Please try again.'}
              {process.error instanceof ApiError && process.error.detail ? (
                <span className="mt-1 block break-words font-normal">Details: {process.error.detail}</span>
              ) : null}
            </Alert>
          ) : null}

          <div>
            <Button onClick={() => process.mutate()}>{process.isError ? 'Try again' : 'Process Contract'}</Button>
          </div>
        </>
      ) : null}

      {uploaded && step === 3 ? <ProcessingProgress stage={stage} /> : null}
    </div>
  );
}
