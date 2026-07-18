'use client';

import clsx from 'clsx';

const COLORS = [
  '#1a1a1a', // black
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f1c40f', // yellow
  '#e67e22', // orange
  '#9b59b6', // purple
  '#e91e63', // pink
];

const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 6 },
  { label: 'L', size: 10 },
  { label: 'XL', size: 16 },
];

interface CanvasToolbarProps {
  color: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  disabled: boolean;
}

export function CanvasToolbar({
  color,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onClear,
  disabled,
}: CanvasToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-bg-surface p-3">
      {/* Colors */}
      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}${color === c ? ' (selected)' : ''}`}
            disabled={disabled}
            onClick={() => onColorChange(c)}
            className={clsx(
              'h-7 w-7 rounded-full transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-1 focus:ring-offset-bg-surface',
              color === c
                ? 'scale-110 ring-2 ring-white shadow-lg'
                : 'hover:scale-105',
              disabled && 'pointer-events-none opacity-40',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-white/10" aria-hidden="true" />

      {/* Brush Sizes */}
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Brush size">
        {BRUSH_SIZES.map(({ label, size: s }) => (
          <button
            key={s}
            type="button"
            aria-label={`Brush size ${label}${brushSize === s ? ' (selected)' : ''}`}
            disabled={disabled}
            onClick={() => onBrushSizeChange(s)}
            className={clsx(
              'flex items-center justify-center rounded-lg px-2 py-1.5 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent/50',
              brushSize === s
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
              disabled && 'pointer-events-none opacity-40',
            )}
          >
            <span
              className="rounded-full bg-current"
              style={{
                width: `${Math.max(4, s)}px`,
                height: `${Math.max(4, s)}px`,
              }}
              aria-hidden="true"
            />
            <span className="ml-1.5 text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-white/10" aria-hidden="true" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Undo last stroke"
          disabled={disabled}
          onClick={onUndo}
          className={clsx(
            'rounded-lg p-2 text-text-secondary transition-colors',
            'hover:bg-white/10 hover:text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            disabled && 'pointer-events-none opacity-40',
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <title>Undo</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a4 4 0 010 8H7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6l-4 4 4 4" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Clear canvas"
          disabled={disabled}
          onClick={onClear}
          className={clsx(
            'rounded-lg p-2 text-text-secondary transition-colors',
            'hover:bg-white/10 hover:text-danger',
            'focus:outline-none focus:ring-2 focus:ring-accent/50',
            disabled && 'pointer-events-none opacity-40',
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <title>Clear canvas</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
