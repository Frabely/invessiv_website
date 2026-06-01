import { describe, expect, it } from "vitest";
import { LinkedInPostGeneratorUsageLimitUnavailableReason } from "./linkedin-post-generator-usage-limit-unavailable-reasons";

describe("LinkedInPostGeneratorUsageLimitUnavailableReason", () => {
  it("contains the expected reason codes", () => {
    expect(LinkedInPostGeneratorUsageLimitUnavailableReason).toEqual({
      RequestIpMissing: "usage_limit_request_ip_missing",
      SecretMissing: "usage_limit_secret_missing",
      StorageUnavailable: "usage_limit_storage_unavailable",
    });
    expect(
      new Set(Object.values(LinkedInPostGeneratorUsageLimitUnavailableReason))
        .size,
    ).toBe(
      Object.values(LinkedInPostGeneratorUsageLimitUnavailableReason).length,
    );
  });
});
