import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ResetChoiceDialog } from '@/components/member/validation/reset-choice-dialog';
import type { ValidationEvent } from '@/data/member-validation';

const event: ValidationEvent = {
  id: 'evt-sunday-2',
  label: 'Culte dimanche',
  dateLabel: 'Dimanche 2 juin',
  info: 'Arrivée 13h30 · Sono · Salle principale',
  teammates: [],
  theme: 'Thème : la fidélité',
  type: 'sunday_service',
  calendarDay: 2,
  status: 'confirmed',
};

describe('ResetChoiceDialog', () => {
  it('asks for confirmation before resetting a calendar choice', () => {
    render(<ResetChoiceDialog event={event} onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Annuler mon choix' })).toBeInTheDocument();
    expect(screen.getByText(/Dimanche 2 juin/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oui' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non' })).toBeInTheDocument();
  });

  it('calls the matching action from yes and no', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(<ResetChoiceDialog event={event} onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Non' }));
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
