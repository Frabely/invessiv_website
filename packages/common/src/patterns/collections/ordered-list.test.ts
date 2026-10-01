import { describe, expect, it } from "vitest";
import { insertListItem, moveListItem, removeListItem } from "./ordered-list";

const items = ["a", "b", "c"] as const;

describe("moveListItem", () => {
  it("swaps with the neighbour in the given direction", () => {
    expect(moveListItem(items, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveListItem(items, 1, 1)).toEqual(["a", "c", "b"]);
  });

  it("is a no-op past either end", () => {
    expect(moveListItem(items, 0, -1)).toEqual(items);
    expect(moveListItem(items, 2, 1)).toEqual(items);
  });

  it("is a no-op for an index outside the list", () => {
    expect(moveListItem(items, 5, -1)).toEqual(items);
    expect(moveListItem(items, -1, 1)).toEqual(items);
  });

  it("never mutates the input", () => {
    const source = ["a", "b"];
    moveListItem(source, 0, 1);
    expect(source).toEqual(["a", "b"]);
  });
});

describe("removeListItem", () => {
  it("removes the item at the index", () => {
    expect(removeListItem(items, 1)).toEqual(["a", "c"]);
  });

  it("is a no-op for an index outside the list", () => {
    expect(removeListItem(items, 3)).toEqual(items);
  });
});

describe("insertListItem", () => {
  it("inserts before the index", () => {
    expect(insertListItem(items, 1, "x")).toEqual(["a", "x", "b", "c"]);
    expect(insertListItem(items, 0, "x")).toEqual(["x", "a", "b", "c"]);
  });

  it("appends at or past the end and clamps a negative index", () => {
    expect(insertListItem(items, 3, "x")).toEqual(["a", "b", "c", "x"]);
    expect(insertListItem(items, 9, "x")).toEqual(["a", "b", "c", "x"]);
    expect(insertListItem(items, -2, "x")).toEqual(["x", "a", "b", "c"]);
  });
});
