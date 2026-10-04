import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the field, right-aligned (for example a show/hide password button). */
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, trailing, className = '', ...rest },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="type-body-lg">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-10 w-full rounded-md border bg-bg-primary px-3 text-body-lg text-text-primary placeholder:text-text-disabled transition-colors duration-fast ease-out hover:border-border-strong focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-border-focus disabled:cursor-not-allowed disabled:bg-bg-surface disabled:text-text-disabled ${
            error ? 'border-danger-solid' : 'border-border'
          } ${trailing ? 'pr-12' : ''} ${className}`.trim()}
          {...rest}
        />
        {trailing ? <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div> : null}
      </div>
      {hint && !error ? (
        <p id={hintId} className="type-body-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="type-body-sm text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
});
