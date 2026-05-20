import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfilePicker, { type PickerProfile } from '@/components/auth/profile-picker';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const members: PickerProfile[] = [
  { id: '1', displayName: 'Chana', initials: 'C', avatarColor: '#96D8D0' },
  { id: '2', displayName: 'Isaac', initials: 'I', avatarColor: '#D2B4F1' },
  { id: '3', displayName: 'Chrisciana', initials: 'Cs', avatarColor: '#DAF4AA' },
  { id: '4', displayName: 'Dave', initials: 'D', avatarColor: '#D2B4F1' },
  { id: '5', displayName: 'Stéphanie', initials: 'S', avatarColor: '#96D8D0' },
  { id: '6', displayName: 'Gloria', initials: 'G', avatarColor: '#DAF4AA' },
];

const admin: PickerProfile = { id: 'alpha', displayName: 'Alpha', initials: 'A', avatarColor: '#16161B' };

describe('ProfilePicker', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the 6 member avatars', () => {
    render(<ProfilePicker members={members} admin={admin} />);
    members.forEach(member => {
      expect(screen.getByText(new RegExp(member.displayName, 'i'))).toBeInTheDocument();
    });
  });

  it('shows admin link', () => {
    render(<ProfilePicker members={members} admin={admin} />);
    expect(screen.getByRole('button', { name: /Je suis le responsable/i })).toBeInTheDocument();
  });

  it('navigates to the code screen when a member clicks', async () => {
    const user = userEvent.setup();
    render(<ProfilePicker members={members} admin={admin} />);

    await user.click(screen.getByRole('button', { name: /Chana/ }));
    expect(push).toHaveBeenCalledWith('/code?profile_id=1&is_admin=false');
  });

  it('navigates to admin mode via the link', async () => {
    const user = userEvent.setup();
    render(<ProfilePicker members={members} admin={admin} />);

    await user.click(screen.getByText(/Je suis le responsable/i));
    expect(push).toHaveBeenCalledWith('/code?profile_id=alpha&is_admin=true');
  });
});
