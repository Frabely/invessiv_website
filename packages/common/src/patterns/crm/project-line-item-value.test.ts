import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import { calculateProjectLineItemValue } from "@invessiv/common/patterns/crm/project-line-item-value";

function item(overrides: Partial<ProjectLineItemDto>): ProjectLineItemDto {
  return {
    id: "item",
    projectId: "project",
    sourceLineItemTemplateId: null,
    kind: LineItemKind.Standard,
    title: "Service",
    description: "",
    priceCents: 10000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    quantityMinutes: null,
    status: ProjectLineItemStatus.Confirmed,
    version: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("calculateProjectLineItemValue", () => {
  it("adds confirmed one-time and monthly items", () => {
    expect(
      calculateProjectLineItemValue([
        item({ priceCents: 20000 }),
        item({
          priceCents: 3000,
          pricingMode: ServicePricingMode.Recurring,
          recurringInterval: BillingInterval.Monthly,
        }),
        item({ status: ProjectLineItemStatus.Planned }),
      ]),
    ).toEqual({ oneTimeCents: 20000, monthlyCents: 3000 });
  });

  it("keeps a rate without a quantity out of the sums", () => {
    expect(
      calculateProjectLineItemValue([
        item({ pricingMode: ServicePricingMode.Rate }),
      ]),
    ).toEqual({ oneTimeCents: 0, monthlyCents: 0 });
  });

  it("counts purchased hours as a one-time value of rate times hours", () => {
    expect(
      calculateProjectLineItemValue([
        item({
          kind: LineItemKind.Hours,
          pricingMode: ServicePricingMode.Rate,
          priceCents: 10000,
          quantityMinutes: 315,
        }),
      ]),
    ).toEqual({ oneTimeCents: 52500, monthlyCents: 0 });
  });
});
