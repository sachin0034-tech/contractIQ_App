'use client';

import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { LOW_CONFIDENCE_THRESHOLD, MAX_TERM_VALUE_CHARS, NOT_FOUND_VALUE } from '@/lib/constants';
import { TERM_HELP } from '@/lib/prompts/terms';
import type { KeyTerm } from '@/types/domain';
import { ConfidenceBadge } from './ConfidenceBadge';
import { LowConfidenceWarning } from './LowConfidenceWarning';
import { WhyDisclosure } from './WhyDisclosure';

export interface KeyTermRowProps {
  term: KeyTerm;
  selected: boolean;
  /** Called when the row, its name, its page chip, or "Why?" is used: the viewer should show the source. */
  onSelect: (term: KeyTerm) => void;
  /** Persists an edit. Rejects when saving fails (the row then keeps the user's draft open). */
  onSave: (termId: string, value: string) => Promise<void>;
}

const INTERACTIVE = 'button, textarea, a, input';

export function KeyTermRow({ term, selected, onSelect, onSave }: KeyTermRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(term.value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);

  const notFound = term.value === NOT_FOUND_VALUE && term.confidence_score === 0;
  const lowConfidence = term.confidence_score < LOW_CONFIDENCE_THRESHOLD;
  const help = TERM_HELP[term.term_name];

  useEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  useEffect(() => {
    const el = textareaRef.current;
    if (editing && el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [draft, editing]);

  function startEdit() {
    cancelledRef.current = false;
    setDraft(term.value);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    cancelledRef.current = true;
    setEditing(false);
    setError(null);
  }

  async function commit() {
    if (cancelledRef.current || saving) return;
    const next = draft.trim();
    if (next.length === 0) {
      setError('Value cannot be empty');
      return;
    }
    if (next === term.value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(term.id, next);
      setEditing(false);
    } catch {
      setError('Could not save your edit. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void commit();
    }
  }

  function onRowClick(event: MouseEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;
    // Ignore events bubbling out of portals (tooltips) and clicks on controls inside the row.
    if (!event.currentTarget.contains(target) || target.closest(INTERACTIVE)) return;
    onSelect(term);
  }

  async function revert() {
    setSaving(true);
    try {
      await onSave(term.id, term.original_value);
      setShowOriginal(false);
    } catch {
      setError('Could not revert. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <li
      onClick={onRowClick}
      aria-current={selected ? 'true' : undefined}
      className={`flex flex-col gap-2 rounded-lg border p-4 transition-colors duration-fast ease-out ${
        selected ? 'border-brand bg-brand-subtle' : 'border-border bg-bg-primary hover:bg-bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(term)}
          className="rounded-sm text-left type-body-lg hover:underline"
        >
          {term.term_name}
        </button>
        {help ? <InfoTooltip content={help} label={`What is ${term.term_name}?`} /> : null}
        {term.is_custom ? <span className="badge badge-success">Custom</span> : null}
        {term.is_edited ? <span className="badge badge-warning">Edited</span> : null}
        <span className="ml-auto flex items-center gap-2">
          {lowConfidence ? <LowConfidenceWarning notFound={notFound} /> : null}
          <ConfidenceBadge score={term.confidence_score} />
        </span>
      </div>

      {editing ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`edit-${term.id}`} className="sr-only">
            Edit value for {term.term_name}
          </label>
          <textarea
            id={`edit-${term.id}`}
            ref={textareaRef}
            value={draft}
            maxLength={MAX_TERM_VALUE_CHARS}
            rows={2}
            disabled={saving}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `edit-error-${term.id}` : undefined}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => void commit()}
            className="w-full resize-none rounded-md border border-border-focus bg-bg-primary px-3 py-2 type-body-lg focus:outline-none focus:ring-2 focus:ring-border-focus disabled:bg-bg-surface"
          />
          <div className="flex items-center justify-between gap-2 type-body-sm text-text-secondary">
            <span>Enter to save, Shift+Enter for a new line, Escape to cancel</span>
            {draft.length > 1800 ? <span>{draft.length}/{MAX_TERM_VALUE_CHARS}</span> : null}
          </div>
          {error ? (
            <p id={`edit-error-${term.id}`} role="alert" className="type-body-sm text-danger-text">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Edit value for ${term.term_name}`}
          className="group flex items-start gap-2 rounded-md text-left type-body-lg hover:bg-bg-subtle"
        >
          <span className={`flex-1 whitespace-pre-wrap ${notFound ? 'text-text-secondary' : ''}`}>{term.value}</span>
          <Pencil className="mt-1 h-3 w-3 shrink-0 text-text-secondary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
        </button>
      )}
      {!editing && error ? (
        <p role="alert" className="type-body-sm text-danger-text">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {term.page_number !== null ? (
          <button
            type="button"
            onClick={() => onSelect(term)}
            className="rounded-md border border-border-strong px-2 py-0.5 type-body-sm hover:bg-bg-subtle"
          >
            Page {term.page_number}
          </button>
        ) : (
          <span className="type-body-sm text-text-secondary">No page</span>
        )}
        {!notFound ? (
          <WhyDisclosure
            open={whyOpen}
            onToggle={() => {
              setWhyOpen((open) => !open);
              if (!whyOpen) onSelect(term);
            }}
            sourceSentence={term.source_sentence}
          />
        ) : null}
        {term.is_edited ? (
          <>
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              aria-expanded={showOriginal}
              className="rounded-sm type-body-sm text-brand hover:underline"
            >
              {showOriginal ? 'Hide AI value' : 'Show AI value'}
            </button>
            <button
              type="button"
              onClick={() => void revert()}
              disabled={saving}
              className="rounded-sm type-body-sm text-brand hover:underline disabled:text-text-disabled"
            >
              Revert to AI value
            </button>
          </>
        ) : null}
      </div>

      {term.is_edited && showOriginal ? (
        <p className="rounded-md bg-bg-surface px-3 py-2 type-body-sm text-text-secondary">
          AI value: {term.original_value}
        </p>
      ) : null}
    </li>
  );
}
