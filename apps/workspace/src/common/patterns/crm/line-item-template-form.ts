import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { UpdateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/update-line-item-template-request.dto";
import { LineItemTemplateFormValidationCode } from "@/common/constants/crm/forms/line-item-template-form-validation-codes";
import type {
  LineItemTemplateFormErrors,
  LineItemTemplateFormValues,
} from "@/common/contracts/crm/line-item-template-form-values";
import {
  createLineItemFieldsFormValues,
  toLineItemFieldsRequestFields,
  validateLineItemFieldsForm,
} from "@/common/patterns/crm/line-item-fields-form";

export function createLineItemTemplateFormValues(
  lineItemTemplate: LineItemTemplateDto | null,
  locale: string,
): LineItemTemplateFormValues {
  return {
    ...createLineItemFieldsFormValues(lineItemTemplate, locale),
    status: lineItemTemplate?.status ?? LineItemTemplateStatus.Active,
    kind: lineItemTemplate?.kind ?? LineItemKind.Standard,
    projectMode:
      lineItemTemplate?.projectMode ?? LineItemProjectMode.ExistingProject,
    portalRequestable: lineItemTemplate?.portalRequestable ?? false,
    portalDescription: lineItemTemplate?.portalDescription ?? "",
  };
}

/** The pricing mode a kind dictates; null leaves the choice to the form. */
export function pricingModeOfLineItemKind(
  kind: LineItemKind,
): ServicePricingMode | null {
  if (kind === LineItemKind.Hours) return ServicePricingMode.Rate;
  if (kind === LineItemKind.FeedbackRound) return ServicePricingMode.OneTime;
  return null;
}

/**
 * Hours are sold at a rate, a further round at a one-off price, and both belong to a project that
 * exists. Choosing such a kind sets what it dictates, so the form cannot hold a contradiction.
 */
export function applyLineItemKindToFormValues(
  values: LineItemTemplateFormValues,
  kind: LineItemKind,
): LineItemTemplateFormValues {
  const pricingMode = pricingModeOfLineItemKind(kind);
  if (pricingMode === null) return { ...values, kind };
  return {
    ...values,
    kind,
    pricingMode,
    recurringInterval: null,
    projectMode: LineItemProjectMode.ExistingProject,
  };
}

export function validateLineItemTemplateForm(
  values: LineItemTemplateFormValues,
): LineItemTemplateFormErrors {
  const errors: LineItemTemplateFormErrors = validateLineItemFieldsForm(
    values,
    LineItemTemplateFieldLimits.PriceCentsMax,
  );
  if (values.portalRequestable && !values.portalDescription.trim()) {
    errors.portalDescription =
      LineItemTemplateFormValidationCode.PortalDescriptionRequired;
  }
  return errors;
}

export function toCreateLineItemTemplateRequest(
  values: LineItemTemplateFormValues,
): CreateLineItemTemplateRequestDto {
  return {
    ...toLineItemFieldsRequestFields(values),
    kind: values.kind,
    projectMode: values.projectMode,
    portalRequestable: values.portalRequestable,
    portalDescription: values.portalDescription.trim(),
  };
}

export function toUpdateLineItemTemplateRequest(
  values: LineItemTemplateFormValues,
  version: number,
): UpdateLineItemTemplateRequestDto {
  return {
    ...toCreateLineItemTemplateRequest(values),
    status: values.status,
    version,
  };
}
