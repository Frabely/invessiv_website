import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { lineItemTemplateSchemas } from "@/server/workspace/crm/services/line-item-template-schemas";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Landingpage",
    description: "",
    priceCents: 150000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    ...overrides,
  };
}

describe("lineItemTemplateSchemas.create", () => {
  it("accepts a valid one-time template", () => {
    const result = lineItemTemplateSchemas.create.safeParse(createInput());

    expect(result.success).toBe(true);
  });

  it("rejects a blank title", () => {
    const result = lineItemTemplateSchemas.create.safeParse(
      createInput({ title: "   " }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects recurring pricing without an interval", () => {
    const result = lineItemTemplateSchemas.create.safeParse(
      createInput({ pricingMode: ServicePricingMode.Recurring }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a one-time template that carries an interval", () => {
    const result = lineItemTemplateSchemas.create.safeParse(
      createInput({ recurringInterval: BillingInterval.Monthly }),
    );

    expect(result.success).toBe(false);
  });

  it("accepts recurring pricing with an interval", () => {
    const result = lineItemTemplateSchemas.create.safeParse(
      createInput({
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("lineItemTemplateSchemas.update", () => {
  it("requires status and version in addition to the write fields", () => {
    const result = lineItemTemplateSchemas.update.safeParse({
      ...createInput(),
      status: LineItemTemplateStatus.Archived,
      version: 2,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing version", () => {
    const result = lineItemTemplateSchemas.update.safeParse({
      ...createInput(),
      status: LineItemTemplateStatus.Active,
    });

    expect(result.success).toBe(false);
  });
});
