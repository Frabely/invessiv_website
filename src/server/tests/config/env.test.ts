import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getServerEnv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults contact mail provider to resend in development", async () => {
    vi.stubEnv("VERCEL_ENV", "development");
    vi.stubEnv("VITEST", "true");

    const { getServerEnv } = await import("@/server/config/env");
    const env = getServerEnv();

    expect(env.contactMailProvider).toBe("resend");
  });

  it("still disables mail outside development when no provider is set", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VITEST", "true");

    const { getServerEnv } = await import("@/server/config/env");
    const env = getServerEnv();

    expect(env.contactMailProvider).toBe("disabled");
  });
});
