import { describe, expect, it } from "vitest";

import {
  buildPaginationHref,
  getPaginationItems,
} from "./leads-pagination.utils";

describe("leads pagination utilities", () => {
  it("builds hrefs by preserving the existing query string", () => {
    expect(
      buildPaginationHref("/de/workspace/leads", "sort=created_desc", 3),
    ).toBe("/de/workspace/leads?sort=created_desc&page=3");
  });

  it("builds hrefs without a query string when none exists", () => {
    expect(buildPaginationHref("/de/workspace/leads", "", 1)).toBe(
      "/de/workspace/leads?page=1",
    );
  });

  it("returns no items for an empty page set", () => {
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it("returns a compact window for large page sets", () => {
    expect(getPaginationItems(4, 10)).toEqual([
      { kind: "page", page: 1 },
      { kind: "ellipsis", id: "ellipsis-1-3" },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
      { kind: "page", page: 5 },
      { kind: "ellipsis", id: "ellipsis-5-10" },
      { kind: "page", page: 10 },
    ]);
  });

  it("keeps the first window compact near the start", () => {
    expect(getPaginationItems(2, 12)).toEqual([
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "ellipsis", id: "ellipsis-3-12" },
      { kind: "page", page: 12 },
    ]);
  });

  it("keeps the last window compact near the end", () => {
    expect(getPaginationItems(11, 12)).toEqual([
      { kind: "page", page: 1 },
      { kind: "ellipsis", id: "ellipsis-1-10" },
      { kind: "page", page: 10 },
      { kind: "page", page: 11 },
      { kind: "page", page: 12 },
    ]);
  });

  it("returns all pages when the set is small", () => {
    expect(getPaginationItems(2, 4)).toEqual([
      { kind: "page", page: 1 },
      { kind: "page", page: 2 },
      { kind: "page", page: 3 },
      { kind: "page", page: 4 },
    ]);
  });
});
