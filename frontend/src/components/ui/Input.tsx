'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-lg border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-secondary/50',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/30'
              : 'border-white/10 focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-danger mt-0.5"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
