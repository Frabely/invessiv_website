import { describe, expect, it } from "vitest";

import { ServiceTemplateListQueryParam } from "@/common/constants/crm/list/service-template-list-query-params";

describe("ServiceTemplateListQueryParam", () => {
  it("contains the exact params without duplicates", () => {
    const values = Object.values(ServiceTemplateListQueryParam);

    expect(values).toEqual(["mode", "edit", "includeArchived"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
