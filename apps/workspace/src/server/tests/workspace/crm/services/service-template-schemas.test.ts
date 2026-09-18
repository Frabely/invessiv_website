import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { serviceTemplateSchemas } from "@/server/workspace/crm/services/service-template-schemas";

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

describe("serviceTemplateSchemas.create", () => {
  it("accepts a valid one-time template", () => {
    const result = serviceTemplateSchemas.create.safeParse(createInput());

    expect(result.success).toBe(true);
  });

  it("rejects a blank title", () => {
    const result = serviceTemplateSchemas.create.safeParse(
      createInput({ title: "   " }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects recurring pricing without an interval", () => {
    const result = serviceTemplateSchemas.create.safeParse(
      createInput({ pricingMode: ServicePricingMode.Recurring }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a one-time template that carries an interval", () => {
    const result = serviceTemplateSchemas.create.safeParse(
      createInput({ recurringInterval: BillingInterval.Monthly }),
    );

    expect(result.success).toBe(false);
  });

  it("accepts recurring pricing with an interval", () => {
    const result = serviceTemplateSchemas.create.safeParse(
      createInput({
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("serviceTemplateSchemas.update", () => {
  it("requires status and version in addition to the write fields", () => {
    const result = serviceTemplateSchemas.update.safeParse({
      ...createInput(),
      status: ServiceTemplateStatus.Archived,
      version: 2,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing version", () => {
    const result = serviceTemplateSchemas.update.safeParse({
      ...createInput(),
      status: ServiceTemplateStatus.Active,
    });

    expect(result.success).toBe(false);
  });
});
