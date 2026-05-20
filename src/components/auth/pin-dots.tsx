'use client';

import { motion } from 'framer-motion';

const rowVariants = {
  idle: { x: 0 },
  shake: {
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

export type PinDotsProps = {
  valueLength: number;
  error: boolean;
};

export function PinDots({ valueLength, error }: PinDotsProps) {
  return (
    <motion.div className="flex items-center justify-center gap-[14px]" variants={rowVariants} animate={error ? 'shake' : 'idle'}>
      {[0, 1, 2, 3].map(index => {
        const isFilled = index < valueLength;
        return (
          <div
            key={index}
            className={`h-4 w-4 rounded-full border-2 ${
              isFilled ? 'border-[var(--color-ink)] bg-[var(--color-ink)]' : 'border-[var(--color-border)] bg-transparent'
            }`}
          />
        );
      })}
    </motion.div>
  );
}
