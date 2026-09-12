import { describe, expect, it } from "vitest";

import {
  ACTOR_TYPE_VALUES,
  ActorType,
  LEGACY_LEAD_ACTOR_TYPE_VALUES,
} from "@invessiv/common/constants/activity/actor-types";

describe("ActorType", () => {
  it("contains the exact supported values", () => {
    expect(ACTOR_TYPE_VALUES).toEqual(["system", "user", "customer"]);
    expect(ACTOR_TYPE_VALUES).toEqual(Object.values(ActorType));
  });

  it("keeps the persisted legacy lead actor strings unchanged", () => {
    expect(LEGACY_LEAD_ACTOR_TYPE_VALUES).toEqual(["system", "user"]);
  });

  it("has no duplicates", () => {
    expect(new Set(ACTOR_TYPE_VALUES).size).toBe(ACTOR_TYPE_VALUES.length);
  });
});
