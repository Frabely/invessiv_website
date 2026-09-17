import { describe, expect, it } from "vitest";

import {
  CUSTOMER_LIST_QUERY_PARAM_VALUES,
  CustomerListQueryParam,
} from "@/common/constants/crm/list/customer-list-query-params";

describe("CustomerListQueryParam", () => {
  it("contains the exact params without duplicates", () => {
    expect(CUSTOMER_LIST_QUERY_PARAM_VALUES).toEqual([
      "page",
      "sort",
      "archived",
      "mode",
      "edit",
      "cockpit",
      "search",
    ]);
    expect(CUSTOMER_LIST_QUERY_PARAM_VALUES).toEqual(
      Object.values(CustomerListQueryParam),
    );
    expect(new Set(CUSTOMER_LIST_QUERY_PARAM_VALUES).size).toBe(
      CUSTOMER_LIST_QUERY_PARAM_VALUES.length,
    );
  });
});
