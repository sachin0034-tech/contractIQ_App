'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, jsonRequest } from '@/lib/api-client';
import type { ContractDetail } from '@/types/api';
import type { KeyTerm } from '@/types/domain';

export const contractKey = (id: string) => ['contract', id] as const;

/** Contract detail with server-rendered initial data; polls while the contract is being processed. */
export function useContractDetail(id: string, initialData: ContractDetail) {
  return useQuery({
    queryKey: contractKey(id),
    queryFn: () => apiFetch<ContractDetail>(`/api/contracts/${id}`),
    initialData,
    refetchInterval: (query) => (query.state.data?.contract.status === 'processing' ? 3000 : false),
  });
}

/** Runs (or retries) processing for a contract, then refreshes the detail. */
export function useProcessContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/api/contracts/${id}/process`, { method: 'POST' }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: contractKey(id) }),
  });
}

/** Saves an inline edit with an optimistic update; rolls back if the save fails. */
export function useUpdateKeyTerm(contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ termId, value }: { termId: string; value: string }) =>
      apiFetch<KeyTerm>(`/api/key-terms/${termId}`, jsonRequest('PATCH', { value })),
    onMutate: async ({ termId, value }) => {
      await queryClient.cancelQueries({ queryKey: contractKey(contractId) });
      const previous = queryClient.getQueryData<ContractDetail>(contractKey(contractId));
      if (previous) {
        queryClient.setQueryData<ContractDetail>(contractKey(contractId), {
          ...previous,
          terms: previous.terms.map((term) =>
            term.id === termId
              ? { ...term, value, is_edited: value !== term.original_value }
              : term,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(contractKey(contractId), context.previous);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<ContractDetail>(contractKey(contractId), (current) =>
        current ? { ...current, terms: current.terms.map((term) => (term.id === saved.id ? saved : term)) } : current,
      );
    },
  });
}
