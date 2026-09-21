import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
  LineItemFieldsRequestFields,
  LineItemFieldsSource,
} from "@/common/contracts/crm/line-item-fields-form-values";
import {
  formatCentsAsEuroInput,
  parseEuroAmountToCents,
} from "@/common/patterns/crm/euro-cents";

export function createLineItemFieldsFormValues(
  source: LineItemFieldsSource | null,
  locale: string,
): LineItemFieldsFormValues {
  return {
    title: source?.title ?? "",
    description: source?.description ?? "",
    priceInput: formatCentsAsEuroInput(source?.priceCents ?? null, locale),
    pricingMode: source?.pricingMode ?? ServicePricingMode.OneTime,
    recurringInterval: source?.recurringInterval ?? null,
  };
}

export function validateLineItemFieldsForm(
  values: LineItemFieldsFormValues,
  priceCentsMax: number,
): LineItemFieldsFormErrors {
  const errors: LineItemFieldsFormErrors = {};
  if (!values.title.trim()) {
    errors.title = LineItemFieldsFormValidationCode.TitleRequired;
  }
  const price = parseEuroAmountToCents(values.priceInput);
  if (!price.ok || price.cents === null) {
    errors.priceInput = LineItemFieldsFormValidationCode.PriceInvalid;
  } else if (price.cents > priceCentsMax) {
    errors.priceInput = LineItemFieldsFormValidationCode.PriceOutOfRange;
  }
  // Mirrors the server refinement and the DB CHECK, so a programmatic caller that skips the
  // dialog's auto-sync still gets a field-level error instead of a generic 422.
  if (
    values.pricingMode === ServicePricingMode.Recurring &&
    !values.recurringInterval
  ) {
    errors.recurringInterval =
      LineItemFieldsFormValidationCode.RecurringIntervalRequired;
  }
  return errors;
}

/** The interval is dropped whenever the mode is not `recurring`, so the request stays consistent. */
export function toLineItemFieldsRequestFields(
  values: LineItemFieldsFormValues,
): LineItemFieldsRequestFields {
  const price = parseEuroAmountToCents(values.priceInput);
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    priceCents: price.ok && price.cents !== null ? price.cents : 0,
    pricingMode: values.pricingMode,
    recurringInterval:
      values.pricingMode === ServicePricingMode.Recurring
        ? values.recurringInterval
        : null,
  };
}

/**
 * True when the pricing mode no longer allows an interval, or when switching to `recurring`
 * leaves the form without one. The dialogs use it to keep the pair consistent while typing.
 */
export function resolveRecurringIntervalFor(
  pricingMode: ServicePricingMode,
  current: LineItemFieldsFormValues["recurringInterval"],
  fallback: NonNullable<LineItemFieldsFormValues["recurringInterval"]>,
): LineItemFieldsFormValues["recurringInterval"] {
  if (pricingMode !== ServicePricingMode.Recurring) return null;
  return current ?? fallback;
}
