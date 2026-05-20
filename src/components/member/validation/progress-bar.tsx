import React from 'react';

export type ProgressBarProps = {
  validatedCount: number;
  total: number;
};

export function ProgressBar({ validatedCount, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((validatedCount / total) * 100);

  return (
    <div className="rounded-[22px] bg-white/80 p-4 text-center">
      <p className="text-[12px] text-[var(--color-text-secondary)]">
        <span className="font-bold text-ink">{validatedCount}</span> sur <span className="font-bold text-ink">{total}</span> validés
      </p>
      <div className="mt-2 h-2 rounded-full bg-white">
        <div
          className="h-full rounded-full bg-ink transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
