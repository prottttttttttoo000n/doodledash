'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover = false, glow = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-white/5 bg-bg-surface p-6',
        hover &&
          'transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/10',
        glow && 'shadow-lg shadow-accent/10',
        className,
      )}
    >
      {children}
    </div>
  );
}
