'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';

export interface DeleteContractDialogProps {
  contractName: string | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteContractDialog({ contractName, deleting, onCancel, onConfirm }: DeleteContractDialogProps) {
  return (
    <Dialog.Root open={contractName !== null} onOpenChange={(open) => !open && !deleting && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-bg-primary p-6">
          <Dialog.Title className="type-h5">Delete this contract?</Dialog.Title>
          <Dialog.Description className="type-body-lg text-text-secondary">
            <span className="break-all text-text-primary">{contractName}</span> will be permanently deleted, with its key
            terms and chat history. This cannot be undone.
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} loading={deleting}>
              Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
