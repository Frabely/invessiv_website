import { describe, expect, it } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import type { LineItemTemplateFormValues } from "@/common/contracts/crm/line-item-template-form-values";
import { validateLineItemTemplateForm } from "@/common/patterns/crm/line-item-template-form";

const VALUES: LineItemTemplateFormValues = {
  title: "Landingpage",
  description: "",
  priceInput: "1500",
  pricingMode: ServicePricingMode.OneTime,
  recurringInterval: null,
  status: LineItemTemplateStatus.Active,
};

describe("validateLineItemTemplateForm", () => {
  it("accepts a complete, valid form", () => {
    expect(validateLineItemTemplateForm(VALUES)).toEqual({});
  });

  it("requires a title", () => {
    expect(validateLineItemTemplateForm({ ...VALUES, title: "  " })).toEqual({
      title: LineItemFieldsFormValidationCode.TitleRequired,
    });
  });

  it("rejects a price that does not parse", () => {
    expect(
      validateLineItemTemplateForm({ ...VALUES, priceInput: "not a price" }),
    ).toEqual({ priceInput: LineItemFieldsFormValidationCode.PriceInvalid });
  });

  it("rejects a price above the Postgres integer column's range", () => {
    const aboveRangeEuros = LineItemTemplateFieldLimits.PriceCentsMax / 100 + 1;
    expect(
      validateLineItemTemplateForm({
        ...VALUES,
        priceInput: String(aboveRangeEuros),
      }),
    ).toEqual({
      priceInput: LineItemFieldsFormValidationCode.PriceOutOfRange,
    });
  });

  it("requires an interval once pricing switches to recurring", () => {
    expect(
      validateLineItemTemplateForm({
        ...VALUES,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: null,
      }),
    ).toEqual({
      recurringInterval:
        LineItemFieldsFormValidationCode.RecurringIntervalRequired,
    });
  });

  it("accepts a recurring price once an interval is set", () => {
    expect(
      validateLineItemTemplateForm({
        ...VALUES,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      }),
    ).toEqual({});
  });
});
