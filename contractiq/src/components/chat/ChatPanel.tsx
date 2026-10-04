'use client';

import { MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useChat } from '@/hooks/useChat';
import { ChatInput } from './ChatInput';
import { MessageBubble, ThinkingBubble } from './MessageBubble';

const SUGGESTIONS = [
  'Is there an auto-renewal clause?',
  'What happens if I breach this agreement?',
  'Who owns the intellectual property?',
];

export interface ChatPanelProps {
  contractId: string;
  pageCount: number;
}

export function ChatPanel({ contractId, pageCount }: ChatPanelProps) {
  const chat = useChat(contractId);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const loading = chat.status === 'loading';

  // Follow new content unless the user has scrolled up to read.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages.length, chat.failure, loading]);

  const lastMessage = chat.messages[chat.messages.length - 1];
  const showPending =
    chat.pendingQuestion !== null && !(lastMessage?.role === 'user' && lastMessage.content === chat.pendingQuestion);
  const empty = !chat.isLoading && chat.messages.length === 0 && !loading && !showPending && !chat.failure;

  return (
    <section aria-labelledby="chat-title" className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-lg border border-border bg-bg-primary">
      <h2 id="chat-title" className="border-b border-border px-4 py-3 type-h5">
        Chat with contract
      </h2>

      <div
        ref={listRef}
        role="log"
        aria-label="Conversation"
        onScroll={(event) => {
          const el = event.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {chat.isLoading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading conversation">
            <div className="h-10 w-2/3 animate-pulse self-end rounded-lg bg-bg-subtle" />
            <div className="h-16 w-3/4 animate-pulse rounded-lg bg-bg-subtle" />
          </div>
        ) : null}

        {chat.loadError ? (
          <Alert tone="error">
            We could not load your conversation.{' '}
            <button type="button" onClick={chat.reload} className="underline">
              Try again
            </button>
          </Alert>
        ) : null}

        {empty ? (
          <div className="flex flex-col items-start gap-3">
            <p className="flex items-center gap-2 type-body-lg text-text-secondary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Ask anything about this contract. Try one of these:
            </p>
            <ul className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void chat.send(suggestion)}
                    className="rounded-md border border-border-strong px-3 py-2 text-left type-body-lg hover:bg-bg-subtle"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {chat.messages.map((message) => (
          <MessageBubble key={message.id} message={message} pageCount={pageCount} />
        ))}

        {showPending ? (
          <MessageBubble
            message={{ role: 'user', content: chat.pendingQuestion ?? '', created_at: new Date().toISOString() }}
            pageCount={pageCount}
          />
        ) : null}

        {loading ? <ThinkingBubble /> : null}

        {chat.failure ? (
          <div className="flex flex-col items-start gap-2">
            <Alert tone="error">
              {chat.failure.message}
              {chat.failure.detail ? (
                <span className="mt-1 block break-words font-normal">Details: {chat.failure.detail}</span>
              ) : null}
            </Alert>
            {chat.failure.retryable ? (
              <Button variant="secondary" onClick={chat.retry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Announces each finished answer once. */}
      <div aria-live="polite" className="sr-only">
        {chat.announcement}
      </div>

      <ChatInput onSend={(text) => void chat.send(text)} disabled={loading} />
    </section>
  );
}
