import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemRow } from "@invessiv/common/contracts/crm/rows/project-line-item-row";
import { projectLineItemsMapperService } from "@/server/workspace/crm/services/project-line-items-mapper-service";

function row(overrides: Partial<ProjectLineItemRow> = {}): ProjectLineItemRow {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    project_id: "33333333-3333-4333-8333-333333333333",
    source_line_item_template_id: "9c8f1a10-1b1a-4a10-8e10-00000000f001",
    title: "Landingpage",
    description: "Einseitige Website.",
    price_cents: 200000,
    pricing_mode: ServicePricingMode.OneTime,
    recurring_interval: null,
    version: 1,
    created_at: new Date("2026-01-02T10:00:00.000Z"),
    updated_at: new Date("2026-01-03T11:30:00.000Z"),
    ...overrides,
  };
}

describe("projectLineItemsMapperService.toDto", () => {
  it("maps the snapshot and its timestamps", () => {
    expect(projectLineItemsMapperService.toDto(row())).toEqual({
      id: "55555555-5555-4555-8555-555555555555",
      projectId: "33333333-3333-4333-8333-333333333333",
      sourceLineItemTemplateId: "9c8f1a10-1b1a-4a10-8e10-00000000f001",
      title: "Landingpage",
      description: "Einseitige Website.",
      priceCents: 200000,
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      version: 1,
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-03T11:30:00.000Z",
    });
  });

  it("keeps a removed origin template as null instead of hiding it", () => {
    const dto = projectLineItemsMapperService.toDto(
      row({ source_line_item_template_id: null }),
    );

    expect(dto.sourceLineItemTemplateId).toBeNull();
  });

  it("carries the recurring interval through", () => {
    const dto = projectLineItemsMapperService.toDto(
      row({
        pricing_mode: ServicePricingMode.Recurring,
        recurring_interval: BillingInterval.Monthly,
      }),
    );

    expect(dto.recurringInterval).toBe(BillingInterval.Monthly);
  });

  it("carries no customer field, because the project decides it", () => {
    expect(projectLineItemsMapperService.toDto(row())).not.toHaveProperty(
      "customerId",
    );
  });
});
