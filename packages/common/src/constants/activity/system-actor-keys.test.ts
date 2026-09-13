import { describe, expect, it } from "vitest";

import {
  SYSTEM_ACTOR_KEY_VALUES,
  SystemActorKey,
} from "@invessiv/common/constants/activity/system-actor-keys";

describe("SystemActorKey", () => {
  it("contains the exact values without duplicates", () => {
    expect(SYSTEM_ACTOR_KEY_VALUES).toEqual(["fixture"]);
    expect(SYSTEM_ACTOR_KEY_VALUES).toEqual(Object.values(SystemActorKey));
    expect(new Set(SYSTEM_ACTOR_KEY_VALUES).size).toBe(
      SYSTEM_ACTOR_KEY_VALUES.length,
    );
  });
});
