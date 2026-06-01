import { afterEach, describe, expect, it, vi } from "vitest";
import type { GeneratorUsageLimitStore } from "@invessiv/common/contracts/generator";
import { LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS } from "@invessiv/common/constants/generator";
import { linkedinPostGeneratorUsageKeyService } from "./linkedin-post-generator-usage-key-service";
import { linkedinPostGeneratorUsageLimitService } from "./linkedin-post-generator-usage-limit-service";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("linkedin post generator usage limit service", () => {
  it("uses the first forwarded IP and normalizes IPv4 ports", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7:443, 198.51.100.2",
      "x-real-ip": "198.51.100.9",
    });

    expect(
      linkedinPostGeneratorUsageKeyService.getGeneratorRequestIp(headers),
    ).toBe("203.0.113.7");
  });

  it("creates a scoped HMAC hash without exposing the raw IP", () => {
    const hash =
      linkedinPostGeneratorUsageKeyService.createGeneratorUsageKeyHash(
        "203.0.113.7",
        "secret",
      );

    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toBe(
      linkedinPostGeneratorUsageKeyService.createGeneratorUsageKeyHash(
        "203.0.113.7",
        "secret",
      ),
    );
    expect(hash).not.toBe(
      linkedinPostGeneratorUsageKeyService.createGeneratorUsageKeyHash(
        "203.0.113.8",
        "secret",
      ),
    );
  });

  it("reserves against the configured store with the hashed key", async () => {
    vi.stubEnv("GENERATOR_USAGE_LIMIT_SECRET", "test-secret");
    const reserve = vi.fn<GeneratorUsageLimitStore["reserve"]>(
      async ({ keyHash, limit, now, windowMs }) => ({
        allowed: true,
        keyHash,
        limit,
        remaining: 1,
        resetAt: new Date(now.getTime() + windowMs),
      }),
    );
    const store: GeneratorUsageLimitStore = {
      release: vi.fn(),
      reserve,
    };

    const result =
      await linkedinPostGeneratorUsageLimitService.reserveLinkedInPostGeneratorUsage(
        new Headers({ "x-forwarded-for": "203.0.113.7" }),
        store,
        new Date("2026-06-01T00:00:00.000Z"),
      );

    expect(result.allowed).toBe(true);
    expect(reserve).toHaveBeenCalledWith({
      keyHash: expect.not.stringContaining("203.0.113.7"),
      limit: 2,
      now: new Date("2026-06-01T00:00:00.000Z"),
      windowMs: LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS,
    });
  });

  it("allows two reservations and blocks the third within the window", async () => {
    const store = createMemoryUsageLimitStore();
    const keyHash = "hash";
    const now = new Date("2026-06-01T00:00:00.000Z");
    const input = { keyHash, limit: 2, now, windowMs: 1000 };

    await expect(store.reserve(input)).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
    });
    await expect(store.reserve(input)).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(store.reserve(input)).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it("allows a new reservation after resetAt", async () => {
    const store = createMemoryUsageLimitStore();
    const keyHash = "hash";

    await store.reserve({
      keyHash,
      limit: 2,
      now: new Date("2026-06-01T00:00:00.000Z"),
      windowMs: 1000,
    });
    await store.reserve({
      keyHash,
      limit: 2,
      now: new Date("2026-06-01T00:00:00.000Z"),
      windowMs: 1000,
    });

    await expect(
      store.reserve({
        keyHash,
        limit: 2,
        now: new Date("2026-06-01T00:00:01.001Z"),
        windowMs: 1000,
      }),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
    });
  });

  it("releases a reserved attempt after a downstream failure", async () => {
    const store = createMemoryUsageLimitStore();
    const reservation = await store.reserve({
      keyHash: "hash",
      limit: 2,
      now: new Date("2026-06-01T00:00:00.000Z"),
      windowMs: 1000,
    });

    if (!reservation.allowed) {
      throw new Error("Expected reservation to be allowed.");
    }

    await linkedinPostGeneratorUsageLimitService.releaseLinkedInPostGeneratorUsage(
      reservation,
      store,
    );

    await expect(
      store.reserve({
        keyHash: "hash",
        limit: 2,
        now: new Date("2026-06-01T00:00:00.500Z"),
        windowMs: 1000,
      }),
    ).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
    });
  });
});

function createMemoryUsageLimitStore(): GeneratorUsageLimitStore {
  const records = new Map<string, { count: number; resetAt: Date }>();

  return {
    async reserve({ keyHash, limit, now, windowMs }) {
      const current = records.get(keyHash);
      if (!current || current.resetAt <= now) {
        const resetAt = new Date(now.getTime() + windowMs);
        records.set(keyHash, { count: 1, resetAt });
        return {
          allowed: true,
          keyHash,
          limit,
          remaining: limit - 1,
          resetAt,
        };
      }

      if (current.count >= limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: current.resetAt,
        };
      }

      current.count += 1;
      return {
        allowed: true,
        keyHash,
        limit,
        remaining: limit - current.count,
        resetAt: current.resetAt,
      };
    },
    async release({ keyHash }) {
      const current = records.get(keyHash);
      if (current) {
        current.count = Math.max(0, current.count - 1);
      }
    },
  };
}
