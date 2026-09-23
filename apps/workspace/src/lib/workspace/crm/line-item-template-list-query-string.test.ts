import { describe, expect, it } from "vitest";

import {
  buildLineItemTemplateListHref,
  buildLineItemTemplateListQueryString,
} from "./line-item-template-list-query-string";

describe("line item template list query string", () => {
  it("omits defaults", () => {
    const filters = { includeArchived: false, page: 1 } as const;
    expect(buildLineItemTemplateListQueryString(filters)).toBe("");
    expect(
      buildLineItemTemplateListHref("/de/crm/line-item-templates", filters),
    ).toBe("/de/crm/line-item-templates");
  });

  it("serializes non-default list state", () => {
    const filters = { includeArchived: true, page: 2 } as const;
    expect(buildLineItemTemplateListQueryString(filters)).toBe(
      "page=2&includeArchived=true",
    );
  });
});
