import { defineConfig, devices } from "@playwright/test";

const PORT = 3107;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `PORT=${PORT} SUPABASE_MOCK=true NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key TEAM_CODE=4729 ADMIN_CODE=9182 CREW_REFERENCE_TODAY=2025-06-17T08:00:00Z npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
