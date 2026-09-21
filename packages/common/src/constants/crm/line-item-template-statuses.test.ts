import { describe, expect, it } from "vitest";

import {
  LINE_ITEM_TEMPLATE_STATUS_VALUES,
  LineItemTemplateStatus,
} from "@invessiv/common/constants/crm/line-item-template-statuses";

describe("LineItemTemplateStatus", () => {
  it("lists every const value exactly once", () => {
    expect(LINE_ITEM_TEMPLATE_STATUS_VALUES).toEqual(["active", "archived"]);
    expect(LINE_ITEM_TEMPLATE_STATUS_VALUES).toEqual(
      Object.values(LineItemTemplateStatus),
    );
    expect(new Set(LINE_ITEM_TEMPLATE_STATUS_VALUES).size).toBe(
      LINE_ITEM_TEMPLATE_STATUS_VALUES.length,
    );
  });
});
