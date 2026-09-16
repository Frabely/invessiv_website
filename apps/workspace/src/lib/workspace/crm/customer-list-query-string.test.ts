import { describe, expect, it } from "vitest";

import {
  buildCustomerListHref,
  buildCustomerListQueryString,
} from "./customer-list-query-string";

describe("customer list query string", () => {
  it("omits defaults", () => {
    const filters = {
      includeArchived: false,
      page: 1,
      sort: "updated_desc",
    } as const;
    expect(buildCustomerListQueryString(filters)).toBe("");
    expect(buildCustomerListHref("/de/crm", filters)).toBe("/de/crm");
  });

  it("serializes non-default list state", () => {
    const filters = {
      includeArchived: true,
      page: 2,
      sort: "name_asc",
    } as const;
    expect(buildCustomerListQueryString(filters)).toBe(
      "page=2&sort=name_asc&archived=true",
    );
  });
});
