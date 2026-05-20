import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MemberDashboard } from '@/components/member/dashboard';
import { getMemberDashboardData } from '@/data/member-dashboard';

const dashboardData = getMemberDashboardData();

describe('MemberDashboard', () => {
  it('renders hero header and validation card', () => {
    render(<MemberDashboard data={dashboardData} />);

    expect(screen.getByText(/Hey/)).toBeInTheDocument();
    expect(screen.getByText(/Valide ton mois/)).toBeInTheDocument();
    expect(screen.getByText(/Voir et valider/i)).toBeInTheDocument();
  });

  it('shows calendar legend and next event block', () => {
    render(<MemberDashboard data={dashboardData} />);

    expect(screen.getByText('Culte')).toBeInTheDocument();
    expect(screen.getByText('Semaine')).toBeInTheDocument();
    expect(screen.getByText('Call')).toBeInTheDocument();
    expect(screen.getByText(/Prochain événement/i)).toBeInTheDocument();
    expect(screen.getByText(/Dimanche 23 juin/i)).toBeInTheDocument();
  });
});
