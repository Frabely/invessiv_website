import { describe, expect, it } from "vitest";

import {
  ACCESS_OPERATION_VALUES,
  AccessOperation,
} from "@/common/constants/access/access-operations";

describe("AccessOperation", () => {
  it("lists every operation of the const object without duplicates", () => {
    expect([...ACCESS_OPERATION_VALUES]).toEqual(
      Object.values(AccessOperation),
    );
    expect(new Set(ACCESS_OPERATION_VALUES).size).toBe(
      ACCESS_OPERATION_VALUES.length,
    );
  });
});
