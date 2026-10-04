'use client';

import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { MAX_CUSTOM_TERMS } from '@/lib/constants';
import { checkTermName, TERM_NAME_MESSAGES } from '@/lib/validation/custom-terms';
import type { ContractType } from '@/types/domain';

export interface CustomTermInputProps {
  contractType: ContractType;
  terms: string[];
  onAdd: (term: string) => void;
  disabled?: boolean;
}

export function CustomTermInput({ contractType, terms, onAdd, disabled }: CustomTermInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const atLimit = terms.length >= MAX_CUSTOM_TERMS;

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    const problem = checkTermName(trimmed, contractType);
    if (problem) {
      setError(TERM_NAME_MESSAGES[problem]);
      return;
    }
    if (terms.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setError('You already added that term.');
      return;
    }
    onAdd(trimmed);
    setValue('');
    setError(undefined);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant="secondary" onClick={() => setOpen(true)} disabled={disabled || atLimit} className="self-start">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Key Term
        </Button>
        <p className="type-body-sm text-text-secondary">
          {terms.length} of {MAX_CUSTOM_TERMS} custom terms added
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-lg border border-border bg-bg-primary p-4">
      <TextField
        label="Custom term"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        error={error}
        hint="For example: Non-compete radius"
        maxLength={80}
        autoFocus
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={disabled || atLimit || value.trim().length === 0}>
          Add term
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false);
            setValue('');
            setError(undefined);
          }}
        >
          Done
        </Button>
        <p className="type-body-sm text-text-secondary">
          {terms.length} of {MAX_CUSTOM_TERMS} added
        </p>
      </div>
    </form>
  );
}
