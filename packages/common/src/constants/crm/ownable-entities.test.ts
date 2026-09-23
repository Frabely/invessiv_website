import { describe, expect, it } from "vitest";

import {
  OWNABLE_ENTITY_VALUES,
  OwnableEntity,
} from "@invessiv/common/constants/crm/ownable-entities";

describe("OwnableEntity", () => {
  it("contains the exact values of the const object", () => {
    expect(OWNABLE_ENTITY_VALUES).toEqual(["customer", "task"]);
    expect(OWNABLE_ENTITY_VALUES).toEqual(Object.values(OwnableEntity));
  });

  it("contains no duplicates", () => {
    expect(new Set(OWNABLE_ENTITY_VALUES).size).toBe(
      OWNABLE_ENTITY_VALUES.length,
    );
  });
});
