import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { LineItemTemplateRow } from "@invessiv/common/contracts/crm/rows/line-item-template-row";
import { lineItemTemplatesMapperService } from "@/server/workspace/crm/services/line-item-templates-mapper-service";

function rowFixture(
  overrides: Partial<LineItemTemplateRow> = {},
): LineItemTemplateRow {
  return {
    id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
    title: "Landingpage",
    description: "Einseitige Website.",
    price_cents: 150000,
    pricing_mode: ServicePricingMode.OneTime,
    recurring_interval: null,
    status: LineItemTemplateStatus.Active,
    version: 1,
    created_at: new Date("2026-01-01T10:00:00.000Z"),
    updated_at: new Date("2026-01-02T11:00:00.000Z"),
    ...overrides,
  };
}

describe("lineItemTemplatesMapperService.toDto", () => {
  it("maps every snake_case field to its camelCase counterpart", () => {
    const dto = lineItemTemplatesMapperService.toDto(rowFixture());

    expect(dto).toEqual({
      id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
      title: "Landingpage",
      description: "Einseitige Website.",
      priceCents: 150000,
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      status: LineItemTemplateStatus.Active,
      version: 1,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-02T11:00:00.000Z",
    });
  });

  it("carries a recurring interval through instead of dropping it", () => {
    const dto = lineItemTemplatesMapperService.toDto(
      rowFixture({
        pricing_mode: ServicePricingMode.Recurring,
        recurring_interval: BillingInterval.Monthly,
      }),
    );

    expect(dto.pricingMode).toBe(ServicePricingMode.Recurring);
    expect(dto.recurringInterval).toBe(BillingInterval.Monthly);
  });
});
