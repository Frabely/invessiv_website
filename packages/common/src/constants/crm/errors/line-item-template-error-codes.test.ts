import { describe, expect, it } from "vitest";

import {
  LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES,
  LineItemTemplateErrorCode,
} from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";

describe("LineItemTemplateErrorCode", () => {
  it("lists every const value exactly once", () => {
    expect(LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES).toEqual(
      Object.values(LineItemTemplateErrorCode),
    );
    expect(new Set(LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES).size).toBe(
      LINE_ITEM_TEMPLATE_ERROR_CODE_VALUES.length,
    );
  });
});
