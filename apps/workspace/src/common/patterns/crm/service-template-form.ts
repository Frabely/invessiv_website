import { ServiceTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/service-template-field-limits";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import type { CreateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/create-service-template-request.dto";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import type { UpdateServiceTemplateRequestDto } from "@invessiv/common/contracts/crm/update-service-template-request.dto";
import { ServiceTemplateFormValidationCode } from "@/common/constants/crm/forms/service-template-form-validation-codes";
import type {
  ServiceTemplateFormErrors,
  ServiceTemplateFormValues,
} from "@/common/contracts/crm/service-template-form-values";
import {
  formatCentsAsEuroInput,
  parseEuroAmountToCents,
} from "@/common/patterns/crm/euro-cents";

export function createServiceTemplateFormValues(
  serviceTemplate: ServiceTemplateDto | null,
  locale: string,
): ServiceTemplateFormValues {
  return {
    title: serviceTemplate?.title ?? "",
    description: serviceTemplate?.description ?? "",
    priceInput: formatCentsAsEuroInput(
      serviceTemplate?.priceCents ?? null,
      locale,
    ),
    pricingMode: serviceTemplate?.pricingMode ?? ServicePricingMode.OneTime,
    recurringInterval: serviceTemplate?.recurringInterval ?? null,
    status: serviceTemplate?.status ?? ServiceTemplateStatus.Active,
  };
}

export function validateServiceTemplateForm(
  values: ServiceTemplateFormValues,
): ServiceTemplateFormErrors {
  const errors: ServiceTemplateFormErrors = {};
  if (!values.title.trim()) {
    errors.title = ServiceTemplateFormValidationCode.TitleRequired;
  }
  const price = parseEuroAmountToCents(values.priceInput);
  if (!price.ok || price.cents === null) {
    errors.priceInput = ServiceTemplateFormValidationCode.PriceInvalid;
  } else if (price.cents > ServiceTemplateFieldLimits.PriceCentsMax) {
    errors.priceInput = ServiceTemplateFormValidationCode.PriceOutOfRange;
  }
  // Mirrors the server's refineIntervalConsistency / DB CHECK, so a programmatic caller that
  // skips the dialog's auto-sync still gets a field-level error instead of a generic 422.
  if (
    values.pricingMode === ServicePricingMode.Recurring &&
    !values.recurringInterval
  ) {
    errors.recurringInterval =
      ServiceTemplateFormValidationCode.RecurringIntervalRequired;
  }
  return errors;
}

function resolvePriceCents(values: ServiceTemplateFormValues): number {
  const price = parseEuroAmountToCents(values.priceInput);
  return price.ok && price.cents !== null ? price.cents : 0;
}

/** The interval is dropped whenever the mode is not `recurring`, so the request is always consistent. */
export function toCreateServiceTemplateRequest(
  values: ServiceTemplateFormValues,
): CreateServiceTemplateRequestDto {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    priceCents: resolvePriceCents(values),
    pricingMode: values.pricingMode,
    recurringInterval:
      values.pricingMode === ServicePricingMode.Recurring
        ? values.recurringInterval
        : null,
  };
}

export function toUpdateServiceTemplateRequest(
  values: ServiceTemplateFormValues,
  version: number,
): UpdateServiceTemplateRequestDto {
  return {
    ...toCreateServiceTemplateRequest(values),
    status: values.status,
    version,
  };
}
