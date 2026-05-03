import { describe, expect, it } from "vitest";
import { LEAD_SOURCES_VALUES } from "@/common/constants/leads/lead-sources";
import { LEAD_ACTIVITY_TYPES } from "@/common/constants/leads/lead-activity-types";
import { LEAD_ACTOR_TYPE_VALUES } from "@/common/constants/leads/lead-actor-types";
import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@/common/constants/leads/lead-social-platforms";
import { LEAD_STATUS_TABS } from "@/common/constants/leads/lead-status-tabs";
import {
  LEAD_LIST_PAGE_SIZE,
  LEAD_LIST_MAX_PAGE_SIZE,
} from "@/common/constants/leads/lead-list-defaults";

describe("LEAD_SOURCES", () => {
  it("contains exactly webform, manual, import", () => {
    expect(LEAD_SOURCES_VALUES).toEqual(["webform", "manual", "import"]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_SOURCES_VALUES).size).toBe(LEAD_SOURCES_VALUES.length);
  });
});

describe("LEAD_ACTIVITY_TYPES", () => {
  it("contains exactly the four activity types", () => {
    expect(LEAD_ACTIVITY_TYPES).toEqual([
      "note",
      "status_change",
      "inbound_submission",
      "import",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_ACTIVITY_TYPES).size).toBe(LEAD_ACTIVITY_TYPES.length);
  });
});

describe("LEAD_STATUS_TABS", () => {
  it("contains all, new, qualified, proposal, won in order", () => {
    expect(LEAD_STATUS_TABS).toEqual([
      "all",
      "new",
      "qualified",
      "proposal",
      "won",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_STATUS_TABS).size).toBe(LEAD_STATUS_TABS.length);
  });
});

describe("LEAD_ACTOR_TYPES", () => {
  it("contains exactly system, user", () => {
    expect(LEAD_ACTOR_TYPE_VALUES).toEqual(["system", "user"]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_ACTOR_TYPE_VALUES).size).toBe(
      LEAD_ACTOR_TYPE_VALUES.length,
    );
  });
});

describe("LEAD_SOCIAL_PLATFORMS", () => {
  it("contains exactly linkedin, instagram, youtube", () => {
    expect(LEAD_SOCIAL_PLATFORMS_VALUES).toEqual([
      "linkedin",
      "instagram",
      "youtube",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_SOCIAL_PLATFORMS_VALUES).size).toBe(
      LEAD_SOCIAL_PLATFORMS_VALUES.length,
    );
  });
});

describe("lead list defaults", () => {
  it("sets PAGE_SIZE to 25", () => {
    expect(LEAD_LIST_PAGE_SIZE).toBe(25);
  });

  it("sets MAX_PAGE_SIZE to 100", () => {
    expect(LEAD_LIST_MAX_PAGE_SIZE).toBe(100);
  });

  it("PAGE_SIZE is less than MAX_PAGE_SIZE", () => {
    expect(LEAD_LIST_PAGE_SIZE).toBeLessThan(LEAD_LIST_MAX_PAGE_SIZE);
  });
});
