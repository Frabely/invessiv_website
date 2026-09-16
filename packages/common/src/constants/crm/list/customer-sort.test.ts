import { describe, expect, it } from "vitest";

import {
  CUSTOMER_SORT_VALUES,
  CustomerSort,
} from "@invessiv/common/constants/crm/list/customer-sort";

describe("CustomerSort", () => {
  it("contains the exact values without duplicates", () => {
    expect(CUSTOMER_SORT_VALUES).toEqual([
      "number_asc",
      "number_desc",
      "name_asc",
      "name_desc",
      "status_asc",
      "status_desc",
      "updated_asc",
      "updated_desc",
    ]);
    expect(new Set(CUSTOMER_SORT_VALUES).size).toBe(
      CUSTOMER_SORT_VALUES.length,
    );
    expect(CUSTOMER_SORT_VALUES).toEqual(Object.values(CustomerSort));
  });
});
