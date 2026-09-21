import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { UpdateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/update-project-line-item-request.dto";
import { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type {
  ProjectLineItemFormErrors,
  ProjectLineItemFormValues,
} from "@/common/contracts/crm/project-line-item-form-values";
import {
  createLineItemFieldsFormValues,
  toLineItemFieldsRequestFields,
  validateLineItemFieldsForm,
} from "@/common/patterns/crm/line-item-fields-form";

export function createProjectLineItemFormValues(
  projectLineItem: ProjectLineItemDto | null,
  locale: string,
): ProjectLineItemFormValues {
  return {
    ...createLineItemFieldsFormValues(projectLineItem, locale),
    sourceLineItemTemplateId: projectLineItem?.sourceLineItemTemplateId ?? null,
    status: projectLineItem?.status ?? ProjectLineItemStatus.Planned,
  };
}

/**
 * Picking a template replaces the whole snapshot, because a half-adopted template would be a
 * price nobody agreed on. Everything stays editable afterwards.
 */
export function applyLineItemTemplateToFormValues(
  template: LineItemTemplateDto,
  locale: string,
): ProjectLineItemFormValues {
  return {
    ...createLineItemFieldsFormValues(template, locale),
    sourceLineItemTemplateId: template.id,
    status: ProjectLineItemStatus.Planned,
  };
}

export function validateProjectLineItemForm(
  values: ProjectLineItemFormValues,
  options: { requiresTemplate: boolean },
): ProjectLineItemFormErrors {
  const errors: ProjectLineItemFormErrors = validateLineItemFieldsForm(
    values,
    ProjectLineItemFieldLimits.PriceCentsMax,
  );
  if (options.requiresTemplate && !values.sourceLineItemTemplateId) {
    errors.sourceLineItemTemplateId =
      ProjectLineItemFormValidationCode.TemplateRequired;
  }
  return errors;
}

/** Only reachable once `validateProjectLineItemForm` accepted the template, hence the empty fallback. */
export function toCreateProjectLineItemRequest(
  values: ProjectLineItemFormValues,
): CreateProjectLineItemRequestDto {
  return {
    ...toLineItemFieldsRequestFields(values),
    sourceLineItemTemplateId: values.sourceLineItemTemplateId ?? "",
    status: values.status,
  };
}

export function toUpdateProjectLineItemRequest(
  values: ProjectLineItemFormValues,
  version: number,
): UpdateProjectLineItemRequestDto {
  return {
    ...toLineItemFieldsRequestFields(values),
    status: values.status,
    version,
  };
}
