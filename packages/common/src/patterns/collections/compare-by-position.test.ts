import { describe, expect, it } from "vitest";

import { compareByPosition } from "./compare-by-position";

describe("compareByPosition", () => {
  it("sorts ascending by position", () => {
    const items = [{ position: 2 }, { position: 0 }, { position: 1 }];

    expect([...items].sort(compareByPosition)).toEqual([
      { position: 0 },
      { position: 1 },
      { position: 2 },
    ]);
  });
});
