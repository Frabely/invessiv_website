import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";
import {
  AUTOMATED_LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { UpdateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/update-project-line-item-request.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import type {
  ProjectLineItemFormErrors,
  ProjectLineItemFormValues,
} from "@/common/contracts/crm/project-line-item-form-values";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import {
  createLineItemFieldsFormValues,
  toLineItemFieldsRequestFields,
  validateLineItemFieldsForm,
} from "@/common/patterns/crm/line-item-fields-form";

/** Kinds whose effect happened with the assignment: their status is `confirmed` and stays. */
export function isAutomatedLineItemKind(kind: LineItemKind): boolean {
  return AUTOMATED_LINE_ITEM_KIND_VALUES.includes(kind);
}

export function createProjectLineItemFormValues(
  projectLineItem: ProjectLineItemDto | null,
  locale: string,
): ProjectLineItemFormValues {
  return {
    ...createLineItemFieldsFormValues(projectLineItem, locale),
    sourceLineItemTemplateId: projectLineItem?.sourceLineItemTemplateId ?? null,
    status: projectLineItem?.status ?? ProjectLineItemStatus.Planned,
    kind: projectLineItem?.kind ?? LineItemKind.Standard,
    quantityInput:
      projectLineItem?.quantityMinutes != null
        ? formatDuration(projectLineItem.quantityMinutes)
        : "",
    allocateHoursToProject: true,
  };
}

/**
 * Picking a template replaces the whole snapshot, because a half-adopted template would be a
 * price nobody agreed on. Everything stays editable afterwards — except the status of a kind
 * that acts on the project, which is `confirmed` from the start.
 */
export function applyLineItemTemplateToFormValues(
  template: LineItemTemplateDto,
  locale: string,
): ProjectLineItemFormValues {
  return {
    ...createLineItemFieldsFormValues(template, locale),
    sourceLineItemTemplateId: template.id,
    status: isAutomatedLineItemKind(template.kind)
      ? ProjectLineItemStatus.Confirmed
      : ProjectLineItemStatus.Planned,
    kind: template.kind,
    quantityInput: "",
    allocateHoursToProject: true,
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
  // The quantity is fixed once assigned, so only a new assignment has to carry one.
  if (options.requiresTemplate && values.kind === LineItemKind.Hours) {
    const quantity = readDurationInput(values.quantityInput);
    if (!quantity.ok) errors.quantityInput = quantity.error;
  }
  return errors;
}

/** Purchased minutes of an hours form, or null while the input is no usable duration. */
export function readProjectLineItemQuantity(
  values: ProjectLineItemFormValues,
): number | null {
  if (values.kind !== LineItemKind.Hours) return null;
  const quantity = readDurationInput(values.quantityInput);
  return quantity.ok ? quantity.minutes : null;
}

/** Only reachable once `validateProjectLineItemForm` accepted the template, hence the empty fallback. */
export function toCreateProjectLineItemRequest(
  values: ProjectLineItemFormValues,
): CreateProjectLineItemRequestDto {
  return {
    ...toLineItemFieldsRequestFields(values),
    sourceLineItemTemplateId: values.sourceLineItemTemplateId ?? "",
    status: values.status,
    quantityMinutes: readProjectLineItemQuantity(values),
    // Sent only where it means something, so a standard request stays as it was.
    ...(values.kind === LineItemKind.Hours
      ? { allocateHoursToProject: values.allocateHoursToProject }
      : {}),
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
