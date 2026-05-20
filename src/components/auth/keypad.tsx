'use client';

import { motion } from 'framer-motion';
import { IconBackspace } from '@tabler/icons-react';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'blank', '0', 'delete'];

export type KeypadProps = {
  onPress: (value: string) => void;
  disabled?: boolean;
};

export function Keypad({ onPress, disabled }: KeypadProps) {
  return (
    <div className="mx-auto grid w-full max-w-[300px] grid-cols-3 gap-[10px]">
      {keys.map(key => {
        if (key === 'blank') {
          return <div key="blank" style={{ aspectRatio: 1.4 }} />;
        }

        const isDelete = key === 'delete';

        return (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            data-num={/\d/.test(key) ? key : undefined}
            aria-label={isDelete ? 'Effacer' : key}
            className={`flex items-center justify-center rounded-[20px] text-[28px] font-semibold text-[var(--color-ink)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] ${
              isDelete ? 'bg-transparent text-[var(--color-text-secondary)]' : 'bg-white'
            }`}
            style={{ aspectRatio: '1.4' }}
            whileTap={{ scale: 0.92, backgroundColor: isDelete ? undefined : '#DDDDDA' }}
            onClick={() => onPress(key)}
          >
            {isDelete ? <IconBackspace size={24} stroke={2} /> : key}
          </motion.button>
        );
      })}
    </div>
  );
}
