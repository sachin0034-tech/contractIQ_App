'use client';

import { Send } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MAX_CHAT_MESSAGE_CHARS } from '@/lib/constants';

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const id = useId();
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  function submit() {
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-bg-primary p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor={id} className="sr-only">
            Ask a question about this contract
          </label>
          <textarea
            id={id}
            value={value}
            rows={2}
            maxLength={MAX_CHAT_MESSAGE_CHARS}
            disabled={disabled}
            placeholder="Ask about this contract..."
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            className="w-full resize-none rounded-md border border-border bg-bg-primary px-3 py-2 type-body-lg placeholder:text-text-disabled hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus disabled:bg-bg-surface disabled:text-text-disabled"
          />
        </div>
        <Button onClick={submit} disabled={!trimmed} loading={disabled} aria-label="Send message">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2 type-body-sm text-text-secondary">
        <span>Answers come only from your document. Not legal advice.</span>
        {value.length >= 1800 ? (
          <span aria-live="polite">
            {value.length}/{MAX_CHAT_MESSAGE_CHARS}
          </span>
        ) : null}
      </div>
    </div>
  );
}
