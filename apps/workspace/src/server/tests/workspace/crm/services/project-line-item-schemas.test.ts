import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { projectLineItemSchemas } from "@/server/workspace/crm/services/project-line-item-schemas";

const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-00000000f001";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    sourceLineItemTemplateId: TEMPLATE_ID,
    title: "Landingpage",
    description: "Einseitige Website.",
    priceCents: 200000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    ...overrides,
  };
}

describe("projectLineItemSchemas.create", () => {
  it("accepts a one-off snapshot without an interval", () => {
    expect(projectLineItemSchemas.create.safeParse(createInput()).success).toBe(
      true,
    );
  });

  it("requires an origin template", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ sourceLineItemTemplateId: undefined }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a template id that is not a uuid", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ sourceLineItemTemplateId: "landingpage" }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a blank title", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ title: "   " }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ priceCents: -1 }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects a price above the integer column ceiling", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ priceCents: ProjectLineItemFieldLimits.PriceCentsMax + 1 }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects recurring pricing without an interval", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ pricingMode: ServicePricingMode.Recurring }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects an interval on a one-off price", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ recurringInterval: BillingInterval.Monthly }),
    );

    expect(result.success).toBe(false);
  });

  it("accepts recurring pricing with an interval", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    );

    expect(result.success).toBe(true);
  });

  it("normalizes a missing interval to null", () => {
    const result = projectLineItemSchemas.create.safeParse(
      createInput({ recurringInterval: undefined }),
    );

    expect(result.success && result.data.recurringInterval).toBeNull();
  });
});

describe("projectLineItemSchemas.update", () => {
  it("requires a positive version", () => {
    const snapshot = createInput();

    expect(
      projectLineItemSchemas.update.safeParse({ ...snapshot, version: 0 })
        .success,
    ).toBe(false);
    expect(
      projectLineItemSchemas.update.safeParse({ ...snapshot, version: 2 })
        .success,
    ).toBe(true);
  });

  it("ignores an origin template in the body, because it is immutable", () => {
    const result = projectLineItemSchemas.update.safeParse({
      ...createInput(),
      sourceLineItemTemplateId: "9c8f1a10-1b1a-4a10-8e10-00000000f009",
      version: 2,
    });

    expect(result.success).toBe(true);
    expect(result.success && "sourceLineItemTemplateId" in result.data).toBe(
      false,
    );
  });
});
