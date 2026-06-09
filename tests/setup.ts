import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://placeholder.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-key";
process.env.TEAM_CODE ??= "4729";
process.env.ADMIN_CODE ??= "9182";
// Fige "aujourd'hui" sur la date de départ propre (mardi 9 juin 2026) pour des tests déterministes.
// En production, getReferenceToday() utilise la vraie date du jour.
process.env.CREW_REFERENCE_TODAY ??= "2026-06-09T08:00:00Z";
