import type { ChatMessage } from '@/types/domain';
import { CitationText } from './CitationText';

export interface MessageBubbleProps {
  message: Pick<ChatMessage, 'role' | 'content' | 'created_at'>;
  pageCount: number;
}

/** User messages are right aligned, assistant messages left aligned. */
export function MessageBubble({ message, pageCount }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.created_at);
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        title={Number.isNaN(time.getTime()) ? undefined : time.toLocaleString()}
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 type-body-lg ${
          isUser ? 'bg-brand text-text-inverse' : 'border border-border bg-bg-surface text-text-primary'
        }`}
      >
        <span className="sr-only">{isUser ? 'You: ' : 'ContractIQ: '}</span>
        {isUser ? message.content : <CitationText text={message.content} pageCount={pageCount} />}
      </div>
    </div>
  );
}

/** Shown while the agent is working on an answer. */
export function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-3 type-body-lg text-text-secondary"
      >
        <span className="chat-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Reading the contract...
      </div>
    </div>
  );
}
