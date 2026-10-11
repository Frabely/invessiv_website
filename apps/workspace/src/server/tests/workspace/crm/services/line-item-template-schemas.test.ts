import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
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
    kind: LineItemKind.Standard,
    projectMode: LineItemProjectMode.ExistingProject,
    portalRequestable: false,
    portalDescription: "",
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

describe("lineItemTemplateSchemas kinds", () => {
  it("accepts hours at a rate and a feedback round at a one-off price", () => {
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({
          kind: LineItemKind.Hours,
          pricingMode: ServicePricingMode.Rate,
        }),
      ).success,
    ).toBe(true);
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({ kind: LineItemKind.FeedbackRound }),
      ).success,
    ).toBe(true);
  });

  it("rejects a pricing mode the kind does not allow", () => {
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({ kind: LineItemKind.Hours }),
      ).success,
    ).toBe(false);
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({
          kind: LineItemKind.FeedbackRound,
          pricingMode: ServicePricingMode.Rate,
        }),
      ).success,
    ).toBe(false);
  });

  it("keeps hours and feedback rounds on an existing project", () => {
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({
          kind: LineItemKind.Hours,
          pricingMode: ServicePricingMode.Rate,
          projectMode: LineItemProjectMode.NewProject,
        }),
      ).success,
    ).toBe(false);
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({ projectMode: LineItemProjectMode.NewProject }),
      ).success,
    ).toBe(true);
  });

  it("requires a customer description once the template is released", () => {
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({ portalRequestable: true, portalDescription: "   " }),
      ).success,
    ).toBe(false);
    expect(
      lineItemTemplateSchemas.create.safeParse(
        createInput({
          portalRequestable: true,
          portalDescription: "Eine weitere Unterseite für deine Website.",
        }),
      ).success,
    ).toBe(true);
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
