import { describe, expect, it } from "vitest";

import { parseCustomerListFilters } from "./customer-list-search-params";

describe("parseCustomerListFilters", () => {
  it("uses stable defaults", () => {
    expect(parseCustomerListFilters({})).toEqual({
      includeArchived: false,
      page: 1,
      search: "",
      sort: "updated_desc",
    });
  });

  it("accepts supported list state", () => {
    expect(
      parseCustomerListFilters({
        page: "3",
        sort: "number_asc",
        archived: "true",
        search: "  Nordlicht  ",
      }),
    ).toEqual({
      includeArchived: true,
      page: 3,
      search: "Nordlicht",
      sort: "number_asc",
    });
  });

  it("rejects repeated and invalid params", () => {
    expect(
      parseCustomerListFilters({
        page: "-1",
        sort: ["name_asc", "name_desc"],
        archived: ["true", "true"],
      }),
    ).toEqual({
      includeArchived: false,
      page: 1,
      search: "",
      sort: "updated_desc",
    });
  });
});
