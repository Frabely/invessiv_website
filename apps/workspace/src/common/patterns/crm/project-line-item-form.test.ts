import { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";
import { resolveProjectLineItemFormBlocker } from "./project-line-item-form";
import { describe, expect, it } from "vitest";

import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
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
  kind: LineItemKind.Standard,
  projectMode: LineItemProjectMode.ExistingProject,
  portalRequestable: false,
  portalDescription: "",
  version: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const PROJECT_LINE_ITEM: ProjectLineItemDto = {
  id: "55555555-5555-4555-8555-555555555555",
  projectId: "33333333-3333-4333-8333-333333333333",
  sourceLineItemTemplateId: TEMPLATE_ID,
  kind: LineItemKind.Standard,
  quantityMinutes: null,
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
    kind: LineItemKind.Standard,
    quantityInput: "",
    allocateHoursToProject: true,
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
      kind: LineItemKind.Standard,
      quantityInput: "",
      allocateHoursToProject: true,
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
      sourceLineItemTemplateVersion: TEMPLATE.version,
      title: "Wartung",
      description: "Laufende technische Pflege.",
      priceInput: "100",
      pricingMode: ServicePricingMode.Recurring,
      recurringInterval: BillingInterval.Monthly,
      status: ProjectLineItemStatus.Planned,
      kind: LineItemKind.Standard,
      quantityInput: "",
      allocateHoursToProject: true,
    });
  });

  it("starts purchased hours as confirmed and without a quantity", () => {
    expect(
      applyLineItemTemplateToFormValues(
        {
          ...TEMPLATE,
          kind: LineItemKind.Hours,
          pricingMode: ServicePricingMode.Rate,
          recurringInterval: null,
        },
        "de",
      ),
    ).toMatchObject({
      kind: LineItemKind.Hours,
      status: ProjectLineItemStatus.Confirmed,
      quantityInput: "",
    });
  });
});

describe("quantity of purchased hours", () => {
  const hours = () =>
    values({
      kind: LineItemKind.Hours,
      pricingMode: ServicePricingMode.Rate,
      quantityInput: "5:00",
    });

  it("is required when hours are assigned", () => {
    expect(
      validateProjectLineItemForm(
        { ...hours(), quantityInput: "" },
        { requiresTemplate: true },
      ),
    ).toEqual({ quantityInput: "required" });
    expect(
      validateProjectLineItemForm(
        { ...hours(), quantityInput: "0:20" },
        { requiresTemplate: true },
      ),
    ).toEqual({ quantityInput: "invalid" });
  });

  it("is not asked again when a stored hours item is edited", () => {
    expect(
      validateProjectLineItemForm(
        { ...hours(), quantityInput: "" },
        { requiresTemplate: false },
      ),
    ).toEqual({});
  });

  it("travels as minutes in the request and stays out of a standard one", () => {
    expect(toCreateProjectLineItemRequest(hours()).quantityMinutes).toBe(300);
    expect(
      toCreateProjectLineItemRequest(values({ quantityInput: "5:00" }))
        .quantityMinutes,
    ).toBeNull();
  });

  it("says whether the hours go to the project or stay free, for hours only", () => {
    expect(toCreateProjectLineItemRequest(hours())).toMatchObject({
      allocateHoursToProject: true,
    });
    expect(
      toCreateProjectLineItemRequest({
        ...hours(),
        allocateHoursToProject: false,
      }),
    ).toMatchObject({ allocateHoursToProject: false });
    expect(toCreateProjectLineItemRequest(values())).not.toHaveProperty(
      "allocateHoursToProject",
    );
  });

  it("pre-fills the stored quantity for display", () => {
    expect(
      createProjectLineItemFormValues(
        {
          ...PROJECT_LINE_ITEM,
          kind: LineItemKind.Hours,
          quantityMinutes: 315,
        },
        "de",
      ).quantityInput,
    ).toBe("5:15");
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
      quantityMinutes: null,
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

describe("resolveProjectLineItemFormBlocker", () => {
  it("allows free hours on a closed project but never bypasses missing hours permission", () => {
    const closed = {
      hours: LineItemAssignmentBlocker.ProjectClosed,
      feedbackRound: null,
    };
    expect(
      resolveProjectLineItemFormBlocker(LineItemKind.Hours, closed, true),
    ).toBe(LineItemAssignmentBlocker.ProjectClosed);
    expect(
      resolveProjectLineItemFormBlocker(LineItemKind.Hours, closed, false),
    ).toBeNull();
    const denied = {
      hours: LineItemAssignmentBlocker.MissingHoursPermission,
      feedbackRound: null,
    };
    expect(
      resolveProjectLineItemFormBlocker(LineItemKind.Hours, denied, false),
    ).toBe(LineItemAssignmentBlocker.MissingHoursPermission);
    expect(
      resolveProjectLineItemFormBlocker(LineItemKind.Hours, denied, true, true),
    ).toBeNull();
  });
});
