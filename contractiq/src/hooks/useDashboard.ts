'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { ContractPageResult, DashboardSummary } from '@/types/api';

export type SortField = 'created_at' | 'name' | 'contract_type';
export type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 25;
export const summaryKey = ['dashboard-summary'] as const;
export const contractsKey = (sort: SortField, order: SortOrder) => ['contracts', sort, order] as const;

export function useDashboardSummary(initialData: DashboardSummary) {
  return useQuery({
    queryKey: summaryKey,
    queryFn: () => apiFetch<DashboardSummary>('/api/dashboard/summary'),
    initialData,
  });
}

/** Paged contract list. The server-rendered first page seeds the default sort (newest first). */
export function useContractList(sort: SortField, order: SortOrder, initialPage: ContractPageResult) {
  const isDefault = sort === 'created_at' && order === 'desc';
  return useInfiniteQuery({
    queryKey: contractsKey(sort, order),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ sort, order, limit: String(PAGE_SIZE) });
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch<ContractPageResult>(`/api/contracts?${params.toString()}`);
    },
    initialPageParam: '' as string,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    ...(isDefault ? { initialData: { pages: [initialPage], pageParams: [''] } } : {}),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/contracts/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['contracts'] });
      const snapshots = queryClient.getQueriesData<{ pages: ContractPageResult[]; pageParams: string[] }>({
        queryKey: ['contracts'],
      });
      // Remove the row everywhere it is cached so every sort order updates immediately.
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          pages: data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== id) })),
        });
      });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: summaryKey });
      void queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
