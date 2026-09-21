import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import type { ProjectLineItemFormValues } from "@/common/contracts/crm/project-line-item-form-values";
import {
  applyLineItemTemplateToFormValues,
  createProjectLineItemFormValues,
  toCreateProjectLineItemRequest,
  toUpdateProjectLineItemRequest,
  validateProjectLineItemForm,
} from "@/common/patterns/crm/project-line-item-form";

const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-00000000f001";

const TEMPLATE: LineItemTemplateDto = {
  id: TEMPLATE_ID,
  title: "Wartung",
  description: "Laufende technische Pflege.",
  priceCents: 10000,
  pricingMode: ServicePricingMode.Recurring,
  recurringInterval: BillingInterval.Monthly,
  status: LineItemTemplateStatus.Active,
  version: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const PROJECT_LINE_ITEM: ProjectLineItemDto = {
  id: "55555555-5555-4555-8555-555555555555",
  projectId: "33333333-3333-4333-8333-333333333333",
  sourceLineItemTemplateId: TEMPLATE_ID,
  title: "Wartung klein",
  description: "",
  priceCents: 7500,
  pricingMode: ServicePricingMode.Recurring,
  recurringInterval: BillingInterval.Monthly,
  status: ProjectLineItemStatus.Planned,
  version: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function values(
  overrides: Partial<ProjectLineItemFormValues> = {},
): ProjectLineItemFormValues {
  return {
    sourceLineItemTemplateId: TEMPLATE_ID,
    title: "Landingpage",
    description: "Einseitige Website.",
    priceInput: "2000",
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    status: ProjectLineItemStatus.Planned,
    ...overrides,
  };
}

describe("createProjectLineItemFormValues", () => {
  it("starts empty for a new assignment", () => {
    expect(createProjectLineItemFormValues(null, "de")).toEqual({
      sourceLineItemTemplateId: null,
      title: "",
      description: "",
      priceInput: "",
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      status: ProjectLineItemStatus.Planned,
    });
  });

  it("pre-fills from the stored snapshot, not from its template", () => {
    const formValues = createProjectLineItemFormValues(PROJECT_LINE_ITEM, "de");

    expect(formValues.title).toBe("Wartung klein");
    expect(formValues.priceInput).toBe("75");
    expect(formValues.sourceLineItemTemplateId).toBe(TEMPLATE_ID);
  });
});

describe("applyLineItemTemplateToFormValues", () => {
  it("replaces the whole snapshot and records the origin", () => {
    expect(applyLineItemTemplateToFormValues(TEMPLATE, "de")).toEqual({
      sourceLineItemTemplateId: TEMPLATE_ID,
      title: "Wartung",
      description: "Laufende technische Pflege.",
      priceInput: "100",
      pricingMode: ServicePricingMode.Recurring,
      recurringInterval: BillingInterval.Monthly,
      status: ProjectLineItemStatus.Planned,
    });
  });
});

describe("validateProjectLineItemForm", () => {
  it("accepts a complete assignment", () => {
    expect(
      validateProjectLineItemForm(values(), { requiresTemplate: true }),
    ).toEqual({});
  });

  it("requires a template when assigning", () => {
    expect(
      validateProjectLineItemForm(values({ sourceLineItemTemplateId: null }), {
        requiresTemplate: true,
      }),
    ).toEqual({
      sourceLineItemTemplateId:
        ProjectLineItemFormValidationCode.TemplateRequired,
    });
  });

  it("does not require a template when editing a snapshot whose template is gone", () => {
    expect(
      validateProjectLineItemForm(values({ sourceLineItemTemplateId: null }), {
        requiresTemplate: false,
      }),
    ).toEqual({});
  });

  it("reports a missing title", () => {
    expect(
      validateProjectLineItemForm(values({ title: "  " }), {
        requiresTemplate: true,
      }),
    ).toMatchObject({
      title: LineItemFieldsFormValidationCode.TitleRequired,
    });
  });

  it("reports an unparsable price", () => {
    expect(
      validateProjectLineItemForm(values({ priceInput: "1.500,00" }), {
        requiresTemplate: true,
      }),
    ).toMatchObject({
      priceInput: LineItemFieldsFormValidationCode.PriceInvalid,
    });
  });

  it("reports a price above the column ceiling", () => {
    expect(
      validateProjectLineItemForm(values({ priceInput: "99999999" }), {
        requiresTemplate: true,
      }),
    ).toMatchObject({
      priceInput: LineItemFieldsFormValidationCode.PriceOutOfRange,
    });
  });

  it("reports recurring pricing without an interval", () => {
    expect(
      validateProjectLineItemForm(
        values({ pricingMode: ServicePricingMode.Recurring }),
        { requiresTemplate: true },
      ),
    ).toMatchObject({
      recurringInterval:
        LineItemFieldsFormValidationCode.RecurringIntervalRequired,
    });
  });
});

describe("toCreateProjectLineItemRequest", () => {
  it("parses euro input into cents and keeps the origin", () => {
    expect(
      toCreateProjectLineItemRequest(values({ priceInput: "1999,50" })),
    ).toEqual({
      sourceLineItemTemplateId: TEMPLATE_ID,
      title: "Landingpage",
      description: "Einseitige Website.",
      priceCents: 199950,
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      status: ProjectLineItemStatus.Planned,
    });
  });

  it("drops an interval that no longer fits the pricing mode", () => {
    const request = toCreateProjectLineItemRequest(
      values({ recurringInterval: BillingInterval.Yearly }),
    );

    expect(request.recurringInterval).toBeNull();
  });
});

describe("toUpdateProjectLineItemRequest", () => {
  it("adds the version and omits the origin template", () => {
    const request = toUpdateProjectLineItemRequest(values(), 4);

    expect(request.version).toBe(4);
    expect(request).not.toHaveProperty("sourceLineItemTemplateId");
  });
});
