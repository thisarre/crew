import { describe, expect, it } from 'vitest';

import { verifyAdminCode, verifyTeamCode, getAdminCode, getTeamCode } from '@/lib/auth';

describe('Auth utils', () => {
  it('verifyTeamCode respects TEAM_CODE env', () => {
    process.env.TEAM_CODE = '1234';
    expect(getTeamCode()).toBe('1234');
    expect(verifyTeamCode('1234')).toBe(true);
    expect(verifyTeamCode('0000')).toBe(false);
  });

  it('verifyAdminCode respects ADMIN_CODE env', () => {
    process.env.ADMIN_CODE = '9999';
    expect(getAdminCode()).toBe('9999');
    expect(verifyAdminCode('9999')).toBe(true);
    expect(verifyAdminCode('1111')).toBe(false);
  });
});
