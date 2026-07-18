'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25 hover:shadow-accent/40',
  secondary:
    'bg-bg-surface border border-white/10 text-text-primary hover:border-white/20 hover:bg-white/5',
  ghost:
    'bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary',
  danger:
    'bg-danger text-white hover:bg-red-500 shadow-lg shadow-danger/25',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
};

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={clsx(
          'inline-flex items-center justify-center rounded-lg font-medium',
          'transition-all duration-150 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
