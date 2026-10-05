import { describe, expect, it } from "vitest";
import { OPTION_TILE_KIND_VALUES, OptionTileKind } from "./option-tile-kinds";

describe("OptionTileKind", () => {
  it("contains the exact values without duplicates", () => {
    expect(OPTION_TILE_KIND_VALUES).toEqual(["radio", "checkbox"]);
    expect([...OPTION_TILE_KIND_VALUES]).toEqual(Object.values(OptionTileKind));
  });
});
