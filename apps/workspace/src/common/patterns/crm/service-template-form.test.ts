import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServiceTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/service-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { ServiceTemplateFormValidationCode } from "@/common/constants/crm/forms/service-template-form-validation-codes";
import type { ServiceTemplateFormValues } from "@/common/contracts/crm/service-template-form-values";
import { validateServiceTemplateForm } from "@/common/patterns/crm/service-template-form";

const VALUES: ServiceTemplateFormValues = {
  title: "Landingpage",
  description: "",
  priceInput: "1500",
  pricingMode: ServicePricingMode.OneTime,
  recurringInterval: null,
  status: ServiceTemplateStatus.Active,
};

describe("validateServiceTemplateForm", () => {
  it("accepts a complete, valid form", () => {
    expect(validateServiceTemplateForm(VALUES)).toEqual({});
  });

  it("requires a title", () => {
    expect(validateServiceTemplateForm({ ...VALUES, title: "  " })).toEqual({
      title: ServiceTemplateFormValidationCode.TitleRequired,
    });
  });

  it("rejects a price that does not parse", () => {
    expect(
      validateServiceTemplateForm({ ...VALUES, priceInput: "not a price" }),
    ).toEqual({ priceInput: ServiceTemplateFormValidationCode.PriceInvalid });
  });

  it("rejects a price above the Postgres integer column's range", () => {
    const aboveRangeEuros = ServiceTemplateFieldLimits.PriceCentsMax / 100 + 1;
    expect(
      validateServiceTemplateForm({
        ...VALUES,
        priceInput: String(aboveRangeEuros),
      }),
    ).toEqual({
      priceInput: ServiceTemplateFormValidationCode.PriceOutOfRange,
    });
  });

  it("requires an interval once pricing switches to recurring", () => {
    expect(
      validateServiceTemplateForm({
        ...VALUES,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: null,
      }),
    ).toEqual({
      recurringInterval:
        ServiceTemplateFormValidationCode.RecurringIntervalRequired,
    });
  });

  it("accepts a recurring price once an interval is set", () => {
    expect(
      validateServiceTemplateForm({
        ...VALUES,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    ).toEqual({});
  });
});
