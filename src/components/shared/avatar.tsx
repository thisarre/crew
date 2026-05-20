'use client';

import React, { forwardRef } from 'react';

import { cn } from '@/lib/utils';

export type AvatarProps = {
  initials: string;
  label?: string;
  color?: string | null;
  size?: 'md' | 'lg';
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>;

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ initials, label, color, size = 'md', className, style, ...props }, ref) => (
    <div
      ref={ref}
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold uppercase text-white shadow-[0_20px_40px_rgba(22,22,27,0.18)]',
        size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-16 w-16 text-xl',
        className,
      )}
      style={{ backgroundColor: color ?? 'var(--color-mint)', ...style }}
      {...props}
    >
      {initials}
    </div>
  ),
);

Avatar.displayName = 'Avatar';
