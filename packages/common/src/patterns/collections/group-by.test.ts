import { describe, expect, it } from "vitest";

import { groupBy } from "./group-by";

describe("groupBy", () => {
  it("collects the items under their key and keeps their order", () => {
    const groups = groupBy(
      [
        { id: "a", parent: "x" },
        { id: "b", parent: "y" },
        { id: "c", parent: "x" },
      ],
      (item) => item.parent,
    );

    expect([...groups.keys()]).toEqual(["x", "y"]);
    expect(groups.get("x")?.map((item) => item.id)).toEqual(["a", "c"]);
  });

  it("answers an empty map for no items", () => {
    expect(groupBy([], () => "never").size).toBe(0);
  });
});
