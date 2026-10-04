'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, ApiError, jsonRequest } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/types/domain';

interface ChatHistory {
  session_id: string | null;
  messages: ChatMessage[];
}

interface ChatAnswer {
  session_id: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export type ChatStatus = 'idle' | 'loading' | 'error';

export interface ChatFailure {
  message: string;
  retryable: boolean;
  /** Raw upstream error text; only present when the server exposes it (never in normal production). */
  detail?: string;
}

const chatKey = (contractId: string) => ['chat', contractId] as const;

/** How close in time two identical messages must be for a Realtime insert to count as our own echo. */
const ECHO_WINDOW_MS = 2 * 60 * 1000;

/**
 * Chat state for one contract. Answers arrive as one JSON response (no streaming): the user's message is added
 * optimistically, a loading state shows while the agent works, then the stored messages replace the optimistic one.
 */
export function useChat(contractId: string) {
  const queryClient = useQueryClient();
  const history = useQuery({
    queryKey: chatKey(contractId),
    queryFn: () => apiFetch<ChatHistory>(`/api/contracts/${contractId}/chat`),
  });

  const [status, setStatus] = useState<ChatStatus>('idle');
  const [failure, setFailure] = useState<ChatFailure | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // The question being answered or that failed. Shown even if the server has not stored it yet.
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const lastQuestion = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = history.data?.session_id ?? null;

  const updateHistory = useCallback(
    (updater: (current: ChatHistory) => ChatHistory) => {
      queryClient.setQueryData<ChatHistory>(chatKey(contractId), (current) =>
        updater(current ?? { session_id: null, messages: [] }),
      );
    },
    [queryClient, contractId],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  // Live updates from another tab: merge inserted rows by id, ignoring echoes of what this tab just sent.
  useEffect(() => {
    if (!sessionId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          updateHistory((current) => {
            if (current.messages.some((m) => m.id === row.id)) return current;
            const echo = current.messages.some(
              (m) =>
                m.role === row.role &&
                m.content === row.content &&
                Math.abs(new Date(m.created_at).getTime() - new Date(row.created_at).getTime()) < ECHO_WINDOW_MS,
            );
            return echo ? current : { ...current, messages: [...current.messages, row] };
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId, updateHistory]);

  const send = useCallback(
    async (text: string, options: { retry?: boolean } = {}) => {
      const question = text.trim();
      if (!question || status === 'loading') return;

      lastQuestion.current = question;
      setPendingQuestion(question);
      setFailure(null);
      setStatus('loading');

      if (!options.retry) {
        updateHistory((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: `pending-${Date.now()}`,
              role: 'user',
              content: question,
              cited_pages: [],
              created_at: new Date().toISOString(),
            },
          ],
        }));
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const answer = await apiFetch<ChatAnswer>(`/api/contracts/${contractId}/chat`, {
          ...jsonRequest('POST', { message: question }),
          signal: controller.signal,
        });
        updateHistory((current) => ({
          session_id: answer.session_id,
          messages: [
            // Swap the optimistic message for the stored one, then add the answer.
            ...current.messages.filter((m) => !m.id.startsWith('pending-') && m.id !== answer.user_message.id),
            answer.user_message,
            answer.assistant_message,
          ],
        }));
        setPendingQuestion(null);
        setStatus('idle');
        setAnnouncement(answer.assistant_message.content);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setFailure({
          message: error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
          retryable: error instanceof ApiError ? error.retryable : true,
          detail: error instanceof ApiError ? error.detail : undefined,
        });
        setStatus('error');
        // Reconcile with the server: the question may already be stored even though the answer failed.
        void queryClient.invalidateQueries({ queryKey: chatKey(contractId) });
      }
    },
    [contractId, queryClient, status, updateHistory],
  );

  const retry = useCallback(() => {
    if (lastQuestion.current) void send(lastQuestion.current, { retry: true });
  }, [send]);

  return {
    messages: history.data?.messages ?? [],
    isLoading: history.isLoading,
    loadError: history.error instanceof ApiError ? history.error : history.error ? new Error('load failed') : null,
    reload: () => void history.refetch(),
    status,
    failure,
    pendingQuestion,
    announcement,
    send,
    retry,
  };
}
