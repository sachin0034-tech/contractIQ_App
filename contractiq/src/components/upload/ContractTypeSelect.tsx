'use client';

import { useId } from 'react';
import type { ContractType } from '@/types/domain';

export interface ContractTypeSelectProps {
  value: ContractType | '';
  onChange: (value: ContractType | '') => void;
  disabled?: boolean;
}

export function ContractTypeSelect({ value, onChange, disabled }: ContractTypeSelectProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="type-body-lg">
        Contract type
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ContractType | '')}
        className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-body-lg text-text-primary hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus disabled:cursor-not-allowed disabled:bg-bg-surface disabled:text-text-disabled md:max-w-[320px]"
      >
        <option value="">Select a contract type</option>
        <option value="NDA">Non-Disclosure Agreement (NDA)</option>
        <option value="MSA">Master Service Agreement (MSA)</option>
      </select>
    </div>
  );
}
