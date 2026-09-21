import { describe, expect, it } from "vitest";

import {
  CRM_OPERATION_VALUES,
  CrmOperation,
} from "@/common/constants/crm/crm-operations";

describe("CrmOperation", () => {
  it("contains the exact operations without duplicates", () => {
    expect(CRM_OPERATION_VALUES).toEqual([
      "leads.convert",
      "customers.list",
      "customers.create",
      "customers.get",
      "customers.update",
      "project-line-items.list",
      "project-line-items.create",
      "project-line-items.update",
      "line-item-templates.list",
      "line-item-templates.create",
      "line-item-templates.update",
    ]);
    expect(CRM_OPERATION_VALUES).toEqual(Object.values(CrmOperation));
    expect(new Set(CRM_OPERATION_VALUES).size).toBe(
      CRM_OPERATION_VALUES.length,
    );
  });
});
