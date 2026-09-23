import { describe, expect, it } from "vitest";

import { parseLineItemTemplateListFilters } from "./line-item-template-list-search-params";

describe("parseLineItemTemplateListFilters", () => {
  it("uses stable defaults", () => {
    expect(parseLineItemTemplateListFilters({})).toEqual({
      includeArchived: false,
      page: 1,
    });
  });

  it("accepts supported list state", () => {
    expect(
      parseLineItemTemplateListFilters({ page: "3", includeArchived: "true" }),
    ).toEqual({ includeArchived: true, page: 3 });
  });

  it("rejects repeated and invalid params", () => {
    expect(
      parseLineItemTemplateListFilters({
        page: "-1",
        includeArchived: ["true", "true"],
      }),
    ).toEqual({ includeArchived: false, page: 1 });
  });
});
