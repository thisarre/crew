import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { BottomNav, shouldShowServiceDayTab } from '@/components/member/bottom-nav';
import { usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows Service Day tab (always accessible)', () => {
    vi.setSystemTime(new Date('2025-06-21T20:00:00Z'));
    render(<BottomNav nextEventDate="2025-06-22T08:00:00Z" />);
    expect(screen.getByLabelText('Service Day')).toBeInTheDocument();
  });

  it('keeps the three core tabs even with a distant event', () => {
    vi.setSystemTime(new Date('2025-06-17T10:00:00Z'));
    render(<BottomNav nextEventDate="2025-06-23T08:00:00Z" />);
    expect(screen.getByLabelText('Accueil')).toBeInTheDocument();
    expect(screen.getByLabelText('Calendrier')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Day')).toBeInTheDocument();
  });

  it('marks the current route as active', () => {
    mockUsePathname.mockReturnValue('/calendar');
    render(<BottomNav />);
    expect(screen.getByLabelText('Calendrier')).toHaveAttribute('aria-current', 'page');
  });
});

describe('shouldShowServiceDayTab', () => {
  it('returns true when event is within 24h', () => {
    const now = new Date('2025-06-22T18:00:00Z');
    const event = new Date('2025-06-23T05:00:00Z');
    expect(shouldShowServiceDayTab(event, now)).toBe(true);
  });

  it('returns false when event is past 24h window', () => {
    const now = new Date('2025-06-20T10:00:00Z');
    const event = new Date('2025-06-23T05:00:00Z');
    expect(shouldShowServiceDayTab(event, now)).toBe(false);
  });

  it('returns false when no event date provided', () => {
    expect(shouldShowServiceDayTab(undefined, new Date())).toBe(false);
  });
});
