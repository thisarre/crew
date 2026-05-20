const DEFAULT_TEAM_CODE = '4729';
const DEFAULT_ADMIN_CODE = '9182';

const normalizeCode = (code: string) => code?.trim();

export function getTeamCode() {
  return process.env.TEAM_CODE ?? DEFAULT_TEAM_CODE;
}

export function getAdminCode() {
  return process.env.ADMIN_CODE ?? DEFAULT_ADMIN_CODE;
}

export function verifyTeamCode(code: string) {
  return normalizeCode(code) === getTeamCode();
}

export function verifyAdminCode(code: string) {
  return normalizeCode(code) === getAdminCode();
}
