import { describe, expect, it } from "vitest";

import { resolveListPage } from "./resolve-list-page";

describe("resolveListPage", () => {
  it("keeps a page within range unchanged", () => {
    expect(
      resolveListPage({ perPage: 25, requestedPage: 2, total: 60 }),
    ).toEqual({ offset: 25, page: 2 });
  });

  it("clamps a page beyond the last page down to the last page", () => {
    expect(
      resolveListPage({ perPage: 25, requestedPage: 9, total: 30 }),
    ).toEqual({ offset: 25, page: 2 });
  });

  it("clamps a page below 1 up to 1", () => {
    expect(
      resolveListPage({ perPage: 25, requestedPage: 0, total: 30 }),
    ).toEqual({ offset: 0, page: 1 });
  });

  it("returns page 1 with a zero offset for an empty result", () => {
    expect(
      resolveListPage({ perPage: 25, requestedPage: 4, total: 0 }),
    ).toEqual({ offset: 0, page: 1 });
  });
});
