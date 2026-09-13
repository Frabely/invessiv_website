import { describe, expect, it } from "vitest";

import {
  ActivityType,
  LEGACY_LEAD_ACTIVITY_TYPE_VALUES,
} from "@invessiv/common/constants/activity/activity-types";
import {
  ActorType,
  LEGACY_LEAD_ACTOR_TYPE_VALUES,
} from "@invessiv/common/constants/activity/actor-types";
import {
  isLegacyLeadActivityType,
  isLegacyLeadActorType,
} from "@invessiv/common/patterns/activity/legacy-lead-activity";

describe("isLegacyLeadActivityType", () => {
  it("accepts every legacy lead activity type", () => {
    expect(
      LEGACY_LEAD_ACTIVITY_TYPE_VALUES.every(isLegacyLeadActivityType),
    ).toBe(true);
  });

  it("rejects activity types the lead timeline cannot render", () => {
    expect(isLegacyLeadActivityType(ActivityType.Created)).toBe(false);
    expect(isLegacyLeadActivityType(ActivityType.ConvertedFromLead)).toBe(
      false,
    );
  });
});

describe("isLegacyLeadActorType", () => {
  it("accepts every legacy lead actor type", () => {
    expect(LEGACY_LEAD_ACTOR_TYPE_VALUES.every(isLegacyLeadActorType)).toBe(
      true,
    );
  });

  it("rejects the customer actor", () => {
    expect(isLegacyLeadActorType(ActorType.Customer)).toBe(false);
  });
});
