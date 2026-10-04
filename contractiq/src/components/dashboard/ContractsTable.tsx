'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowDown, ArrowUp, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { useContractList, useDeleteContract, type SortField, type SortOrder } from '@/hooks/useDashboard';
import type { ContractPageResult } from '@/types/api';
import type { ContractSummary } from '@/types/domain';
import { DeleteContractDialog } from './DeleteContractDialog';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';

function hrefFor(contract: ContractSummary): string {
  return contract.status === 'uploaded' ? `/contracts/new?resume=${contract.id}` : `/contracts/${contract.id}`;
}

const COLUMNS: Array<{ field: SortField; label: string }> = [
  { field: 'name', label: 'Name' },
  { field: 'contract_type', label: 'Type' },
  { field: 'created_at', label: 'Date uploaded' },
];

export function ContractsTable({ initialPage }: { initialPage: ContractPageResult }) {
  const router = useRouter();
  const { toast } = useToast();
  const [sort, setSort] = useState<SortField>('created_at');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [pendingDelete, setPendingDelete] = useState<ContractSummary | null>(null);

  const list = useContractList(sort, order, initialPage);
  const remove = useDeleteContract();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  function toggleSort(field: SortField) {
    if (field === sort) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder(field === 'created_at' ? 'desc' : 'asc');
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    remove.mutate(target.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast('Contract deleted.', 'success');
      },
      onError: () => {
        setPendingDelete(null);
        toast('Could not delete the contract. Try again.', 'error');
      },
    });
  }

  if (list.isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading contracts">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-bg-subtle" />
        ))}
      </div>
    );
  }

  if (list.isError) {
    return (
      <Alert tone="error">
        We could not load your contracts.{' '}
        <button type="button" onClick={() => void list.refetch()} className="underline">
          Try again
        </button>
      </Alert>
    );
  }

  if (items.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-bg-primary">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-bg-surface">
              {COLUMNS.map(({ field, label }) => {
                const active = sort === field;
                return (
                  <th
                    key={field}
                    scope="col"
                    aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 py-3 type-body-sm text-text-secondary"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(field)}
                      className="inline-flex items-center gap-1 rounded-sm hover:text-text-primary"
                    >
                      {label}
                      {active ? (
                        order === 'asc' ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="px-4 py-3 type-body-sm text-text-secondary">
                Status
              </th>
              <th scope="col" className="w-12 px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((contract) => (
              <tr
                key={contract.id}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  // React events bubble out of portals (menus, dialogs); only react to clicks inside this row.
                  if (!event.currentTarget.contains(target) || target.closest('a, button')) return;
                  router.push(hrefFor(contract));
                }}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-bg-surface"
              >
                <td className="max-w-[320px] px-4 py-3 type-body-lg">
                  <Link href={hrefFor(contract)} className="break-all hover:underline">
                    {contract.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="badge border-border-strong bg-bg-surface text-text-primary">{contract.contract_type}</span>
                </td>
                <td className="px-4 py-3 type-body-lg text-text-secondary">
                  {new Date(contract.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={contract.status} />
                    {contract.status === 'error' ? (
                      <Link href={hrefFor(contract)} className="type-body-sm text-brand underline">
                        Try again
                      </Link>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`Actions for ${contract.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-bg-subtle"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={4}
                        className="z-50 min-w-[160px] rounded-lg border border-border bg-bg-primary p-1"
                      >
                        <DropdownMenu.Item
                          onSelect={() => router.push(hrefFor(contract))}
                          className="cursor-pointer rounded-md px-3 py-2 type-body-lg outline-none data-[highlighted]:bg-bg-subtle"
                        >
                          Open
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          onSelect={() => setPendingDelete(contract)}
                          className="cursor-pointer rounded-md px-3 py-2 type-body-lg text-danger-text outline-none data-[highlighted]:bg-danger-bg"
                        >
                          Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {list.hasNextPage ? (
        <div>
          <Button variant="secondary" onClick={() => void list.fetchNextPage()} loading={list.isFetchingNextPage}>
            Load more
          </Button>
        </div>
      ) : null}

      <DeleteContractDialog
        contractName={pendingDelete?.name ?? null}
        deleting={remove.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
