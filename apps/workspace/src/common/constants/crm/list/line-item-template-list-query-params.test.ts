import { describe, expect, it } from "vitest";

import { LineItemTemplateListQueryParam } from "@/common/constants/crm/list/line-item-template-list-query-params";

describe("LineItemTemplateListQueryParam", () => {
  it("contains the exact params without duplicates", () => {
    const values = Object.values(LineItemTemplateListQueryParam);

    expect(values).toEqual(["mode", "edit", "includeArchived"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
