import { describe, expect, it } from "vitest";
import {
  LEAD_PROFILE_TYPE_VALUES,
  LeadProfileType,
} from "@/common/constants/leads/profile/lead-profile-types";

describe("LEAD_PROFILE_TYPE_VALUES", () => {
  it("contains website, phone and the three social platforms", () => {
    expect(LEAD_PROFILE_TYPE_VALUES).toEqual([
      "website",
      "phone",
      "linkedin",
      "instagram",
      "youtube",
    ]);
  });

  it("has no duplicate values", () => {
    expect(new Set(LEAD_PROFILE_TYPE_VALUES).size).toBe(
      LEAD_PROFILE_TYPE_VALUES.length,
    );
  });

  it("exposes the website type separately from the social platforms", () => {
    expect(LeadProfileType.Website).toBe("website");
  });
});
