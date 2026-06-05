import { describe, expect, it } from "vitest";

import {
  DeliveryTokenInvalidReason,
  LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS,
} from "@/common/constants";

describe("linkedin-post delivery token constants", () => {
  it("exposes the exact token ttl", () => {
    expect(LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("exposes the exact invalid token reasons", () => {
    expect(DeliveryTokenInvalidReason).toEqual({
      Malformed: "malformed",
      Expired: "expired",
    });
  });

  it("has no duplicate invalid token reason values", () => {
    const values = Object.values(DeliveryTokenInvalidReason);
    expect(new Set(values).size).toBe(values.length);
  });
});
