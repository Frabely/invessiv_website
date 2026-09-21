import { LineItemTemplateFieldLimits } from "@invessiv/common/constants/crm/forms/line-item-template-field-limits";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { CreateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/create-line-item-template-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { UpdateLineItemTemplateRequestDto } from "@invessiv/common/contracts/crm/update-line-item-template-request.dto";
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
  };
}

export function validateLineItemTemplateForm(
  values: LineItemTemplateFormValues,
): LineItemTemplateFormErrors {
  return validateLineItemFieldsForm(
    values,
    LineItemTemplateFieldLimits.PriceCentsMax,
  );
}

export function toCreateLineItemTemplateRequest(
  values: LineItemTemplateFormValues,
): CreateLineItemTemplateRequestDto {
  return toLineItemFieldsRequestFields(values);
}

export function toUpdateLineItemTemplateRequest(
  values: LineItemTemplateFormValues,
  version: number,
): UpdateLineItemTemplateRequestDto {
  return {
    ...toLineItemFieldsRequestFields(values),
    status: values.status,
    version,
  };
}
