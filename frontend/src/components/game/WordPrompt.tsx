'use client';

import clsx from 'clsx';

interface WordPromptProps {
  word: string;
  wordLength: number;
  category: string;
  isDoodler: boolean;
}

export function WordPrompt({
  word,
  wordLength,
  category,
  isDoodler,
}: WordPromptProps) {
  const letters = word.split('');
  const displayed = isDoodler
    ? letters.join(' ')
    : Array.from({ length: wordLength })
        .map(() => '_')
        .join(' ');

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-bg-secondary px-6 py-4">
      {/* Category badge */}
      <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-0.5 text-xs font-medium text-accent">
        Category: {category}
      </span>

      {/* Word / Underscores */}
      <div
        className={clsx(
          'text-center font-heading font-bold tracking-widest',
          isDoodler ? 'text-accent text-2xl' : 'text-text-primary text-3xl',
        )}
        role="status"
        aria-label={
          isDoodler
            ? `Your word is ${word}`
            : `The word has ${wordLength} letters`
        }
      >
        {displayed}
      </div>

      {!isDoodler && (
        <p className="text-xs text-text-secondary">{wordLength} letters</p>
      )}
    </div>
  );
}
