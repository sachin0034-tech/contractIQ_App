'use client';

import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ProcessingProgress } from '@/components/upload/ProcessingProgress';
import { useProcessContract } from '@/hooks/useContractDetail';
import { ApiError } from '@/lib/api-client';
import { ERROR_DEFINITIONS, type ErrorCode } from '@/lib/errors';
import type { ContractStatus } from '@/types/domain';

export interface ContractStatusPanelProps {
  contractId: string;
  status: Exclude<ContractStatus, 'completed'>;
  errorCode: string | null;
}

function messageFor(code: string | null): string {
  if (code && code in ERROR_DEFINITIONS) return ERROR_DEFINITIONS[code as ErrorCode].message;
  return 'Something went wrong while analysing this contract. Please try again.';
}

/** Shown instead of results while a contract is waiting, running, or failed. Failed runs retry without re-upload. */
export function ContractStatusPanel({ contractId, status, errorCode }: ContractStatusPanelProps) {
  const process = useProcessContract(contractId);

  if (process.isPending || status === 'processing') {
    return <ProcessingProgress stage="analysing" />;
  }

  if (status === 'uploaded') {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-bg-primary p-6">
        <h2 className="type-h5">Ready to process</h2>
        <p className="type-body-lg text-text-secondary">
          This contract has been uploaded but not analysed yet. Review the terms and start processing.
        </p>
        <Link href={`/contracts/new?resume=${contractId}`} className="btn btn-primary">
          Continue
        </Link>
      </div>
    );
  }

  const failure = process.error instanceof ApiError ? process.error.message : messageFor(errorCode);
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-bg-primary p-6">
      <h2 className="type-h5">We could not analyse this contract</h2>
      <Alert tone="error">
        {failure}
        {process.error instanceof ApiError && process.error.detail ? (
          <span className="mt-1 block break-words font-normal">Details: {process.error.detail}</span>
        ) : null}
      </Alert>
      <p className="type-body-sm text-text-secondary">Your file is saved. You do not need to upload it again.</p>
      <Button onClick={() => process.mutate()}>Try again</Button>
    </div>
  );
}
