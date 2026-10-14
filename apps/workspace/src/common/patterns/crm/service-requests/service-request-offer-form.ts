import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { createLineItemFieldsFormValues } from "@/common/patterns/crm/line-item-fields-form";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ChangeServiceRequestStatusRequestDto } from "@invessiv/common/contracts/crm/service-requests/change-service-request-status-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import type { ServiceRequestOfferFormValues } from "@/common/contracts/crm/service-request-offer-form-values";
import {
  formatCentsAsEuroInput,
  parseEuroAmountToCents,
} from "@/common/patterns/crm/euro-cents";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";

/** Starts from the catalog price of the requested service and the hours the customer asked for. */
export function createServiceRequestOfferForm(
  request: ServiceRequestDto,
  templates: readonly LineItemTemplateDto[],
  locale: string,
): ServiceRequestOfferFormValues {
  const template = templates.find(
    (t) => t.id === request.lineItemTemplateId && t.kind === request.kind,
  );
  return {
    ...createLineItemFieldsFormValues(template ?? null, locale),
    priceInput: formatCentsAsEuroInput(template?.priceCents ?? null, locale),
    pricingMode:
      request.kind === LineItemKind.Hours
        ? ServicePricingMode.Rate
        : request.kind === LineItemKind.FeedbackRound
          ? ServicePricingMode.OneTime
          : (template?.pricingMode ?? ServicePricingMode.OneTime),
    quantityInput:
      request.requestedMinutes !== null
        ? formatDuration(request.requestedMinutes)
        : "",
  };
}

function readOfferPrice(values: ServiceRequestOfferFormValues): number | null {
  const price = parseEuroAmountToCents(values.priceInput);
  return price.ok &&
    price.cents !== null &&
    price.cents <= ProjectLineItemFieldLimits.PriceCentsMax
    ? price.cents
    : null;
}

export function isServiceRequestOfferPriceValid(
  values: ServiceRequestOfferFormValues,
): boolean {
  return readOfferPrice(values) !== null;
}

/** Null while the form is not sendable; hours need a usable duration on top of the price. */
export function toOfferServiceRequest(
  values: ServiceRequestOfferFormValues,
  request: ServiceRequestDto,
): ChangeServiceRequestStatusRequestDto | null {
  const priceCents = readOfferPrice(values);
  if (priceCents === null) return null;
  if (
    values.pricingMode === ServicePricingMode.Recurring &&
    values.recurringInterval === null
  )
    return null;
  if (
    request.kind === LineItemKind.Hours &&
    values.pricingMode !== ServicePricingMode.Rate
  )
    return null;
  if (
    request.kind === LineItemKind.FeedbackRound &&
    values.pricingMode !== ServicePricingMode.OneTime
  )
    return null;
  const base = {
    to: ServiceRequestStatus.Offered,
    version: request.version,
    priceCents,
    pricingMode: values.pricingMode,
    recurringInterval:
      values.pricingMode === ServicePricingMode.Recurring
        ? values.recurringInterval
        : null,
  };
  if (request.kind !== LineItemKind.Hours) return { ...base, minutes: null };
  const quantity = readDurationInput(values.quantityInput);
  return quantity.ok ? { ...base, minutes: quantity.minutes } : null;
}
