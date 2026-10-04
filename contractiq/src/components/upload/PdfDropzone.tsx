'use client';

import { FileText, Loader2, UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { ApiError, uploadContract, type UploadedContract } from '@/lib/api-client';
import { MAX_PDF_BYTES } from '@/lib/constants';
import type { ContractType } from '@/types/domain';

export interface PdfDropzoneProps {
  contractType: ContractType | '';
  onUploaded: (contract: UploadedContract) => void;
}

type State =
  | { kind: 'idle' }
  | { kind: 'uploading'; fileName: string; progress: number }
  | { kind: 'error'; message: string };

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfDropzone({ contractType, onUploaded }: PdfDropzoneProps) {
  const inputId = useId();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const upload = useCallback(
    async (file: File) => {
      if (!contractType) {
        setState({ kind: 'error', message: 'Choose a contract type first.' });
        return;
      }
      if (file.type && file.type !== 'application/pdf') {
        setState({ kind: 'error', message: 'Please upload a PDF file.' });
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setState({ kind: 'error', message: 'PDF must be 10 MB or smaller.' });
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ kind: 'uploading', fileName: `${file.name} (${formatBytes(file.size)})`, progress: 0 });

      try {
        const result = await uploadContract(
          file,
          contractType,
          (progress) => setState({ kind: 'uploading', fileName: `${file.name} (${formatBytes(file.size)})`, progress }),
          controller.signal,
        );
        setState({ kind: 'idle' });
        onUploaded(result);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({
          kind: 'error',
          message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        });
      }
    },
    [contractType, onUploaded],
  );

  const busy = state.kind === 'uploading';
  const disabled = busy || !contractType;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files?.[0];
          if (file && !disabled) void upload(file);
        }}
        className={`flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors duration-fast ease-out ${
          dragOver ? 'border-brand bg-brand-subtle' : 'border-border-strong bg-bg-surface'
        } ${disabled ? 'opacity-70' : ''}`}
      >
        {busy ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-text-secondary" aria-hidden="true" />
            <p className="type-body-lg flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {state.fileName}
            </p>
            <div
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress * 100)}
              className="h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-bg-subtle"
            >
              <div className="h-full bg-brand transition-all duration-base ease-out" style={{ width: `${Math.round(state.progress * 100)}%` }} />
            </div>
            <p className="type-body-sm text-text-secondary" aria-live="polite">
              {state.progress >= 1 ? 'Reading your contract...' : 'Uploading...'}
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-text-secondary" aria-hidden="true" />
            <p className="type-body-lg">Drag and drop your PDF here</p>
            <p className="type-body-sm text-text-secondary">Text-layer PDF, up to 20 pages and 10 MB</p>
            <input
              id={inputId}
              type="file"
              accept="application/pdf"
              disabled={disabled}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void upload(file);
              }}
            />
            <label
              htmlFor={inputId}
              className={`btn btn-secondary ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              aria-disabled={disabled || undefined}
            >
              Choose PDF
            </label>
            {!contractType ? (
              <p className="type-body-sm text-text-secondary">Select a contract type to enable upload.</p>
            ) : null}
          </>
        )}
      </div>
      {state.kind === 'error' ? <Alert tone="error">{state.message}</Alert> : null}
    </div>
  );
}
