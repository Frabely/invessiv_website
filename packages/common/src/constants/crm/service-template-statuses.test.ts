import { describe, expect, it } from "vitest";

import {
  SERVICE_TEMPLATE_STATUS_VALUES,
  ServiceTemplateStatus,
} from "@invessiv/common/constants/crm/service-template-statuses";

describe("ServiceTemplateStatus", () => {
  it("lists every const value exactly once", () => {
    expect(SERVICE_TEMPLATE_STATUS_VALUES).toEqual(["active", "archived"]);
    expect(SERVICE_TEMPLATE_STATUS_VALUES).toEqual(
      Object.values(ServiceTemplateStatus),
    );
    expect(new Set(SERVICE_TEMPLATE_STATUS_VALUES).size).toBe(
      SERVICE_TEMPLATE_STATUS_VALUES.length,
    );
  });
});
