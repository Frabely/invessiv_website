import { describe, expect, it } from "vitest";
import {
  HEADER_CONTROL_VARIANT_VALUES,
  HeaderControlVariant,
} from "./header-control-variants";

describe("HeaderControlVariant", () => {
  it("contains the exact values without duplicates", () => {
    expect(HEADER_CONTROL_VARIANT_VALUES).toEqual(["desktop", "mobile"]);
    expect([...HEADER_CONTROL_VARIANT_VALUES]).toEqual(
      Object.values(HeaderControlVariant),
    );
  });
});
