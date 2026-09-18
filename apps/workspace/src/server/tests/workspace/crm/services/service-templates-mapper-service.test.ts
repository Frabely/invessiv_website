import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import type { ServiceTemplateRow } from "@invessiv/common/contracts/crm/rows/service-template-row";
import { serviceTemplatesMapperService } from "@/server/workspace/crm/services/service-templates-mapper-service";

function rowFixture(
  overrides: Partial<ServiceTemplateRow> = {},
): ServiceTemplateRow {
  return {
    id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
    title: "Landingpage",
    description: "Einseitige Website.",
    price_cents: 150000,
    pricing_mode: ServicePricingMode.OneTime,
    recurring_interval: null,
    status: ServiceTemplateStatus.Active,
    version: 1,
    created_at: new Date("2026-01-01T10:00:00.000Z"),
    updated_at: new Date("2026-01-02T11:00:00.000Z"),
    ...overrides,
  };
}

describe("serviceTemplatesMapperService.toDto", () => {
  it("maps every snake_case field to its camelCase counterpart", () => {
    const dto = serviceTemplatesMapperService.toDto(rowFixture());

    expect(dto).toEqual({
      id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
      title: "Landingpage",
      description: "Einseitige Website.",
      priceCents: 150000,
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      status: ServiceTemplateStatus.Active,
      version: 1,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-02T11:00:00.000Z",
    });
  });

  it("carries a recurring interval through instead of dropping it", () => {
    const dto = serviceTemplatesMapperService.toDto(
      rowFixture({
        pricing_mode: ServicePricingMode.Recurring,
        recurring_interval: BillingInterval.Monthly,
      }),
    );

    expect(dto.pricingMode).toBe(ServicePricingMode.Recurring);
    expect(dto.recurringInterval).toBe(BillingInterval.Monthly);
  });
});
