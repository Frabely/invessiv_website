import { describe, expect, it } from "vitest";

import {
  SERVICE_TEMPLATE_ERROR_CODE_VALUES,
  ServiceTemplateErrorCode,
} from "@invessiv/common/constants/crm/errors/service-template-error-codes";

describe("ServiceTemplateErrorCode", () => {
  it("lists every const value exactly once", () => {
    expect(SERVICE_TEMPLATE_ERROR_CODE_VALUES).toEqual(
      Object.values(ServiceTemplateErrorCode),
    );
    expect(new Set(SERVICE_TEMPLATE_ERROR_CODE_VALUES).size).toBe(
      SERVICE_TEMPLATE_ERROR_CODE_VALUES.length,
    );
  });
});
