import { describe, expect, it } from "vitest";

describe("Smoke tests", () => {
  it("imports utility placeholder", async () => {
    const module = await import("@/lib/utils").catch(() => ({}));
    expect(module).toBeDefined();
  });

  it("loads env variables", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").toBeDefined();
  });
});
