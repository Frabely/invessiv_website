import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { isServiceRequestWithoutOffer } from "@invessiv/common/patterns/crm/service-request-state";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { AcceptServiceRequestRequestDto } from "@invessiv/common/contracts/crm/service-requests/accept-service-request-request.dto";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import type { ServiceRequestAcceptFormValues } from "@/common/contracts/crm/service-request-accept-form-values";
import {
  createLineItemFieldsFormValues,
  toLineItemFieldsRequestFields,
  validateLineItemFieldsForm,
} from "@/common/patterns/crm/line-item-fields-form";
import {
  createProjectFormValues,
  toCreateProjectRequest,
} from "@/common/patterns/crm/project-form";
import { formatCentsAsEuroInput } from "@/common/patterns/crm/euro-cents";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import { ProjectLineItemFieldLimits } from "@invessiv/common/constants/crm/forms/project-line-item-field-limits";

/** A new project is only a choice for a standard service and with the right to create one. */
export function canChooseServiceRequestProject(
  request: ServiceRequestDto,
  viewModel: ServiceRequestsViewModel,
): boolean {
  return viewModel.canCreateProject && request.kind === LineItemKind.Standard;
}
/** Only free text may pick or create a template; a catalog request keeps its own. */
export function canChooseServiceRequestTemplate(
  request: ServiceRequestDto,
  viewModel: ServiceRequestsViewModel,
): boolean {
  return (
    !request.lineItemTemplateId &&
    viewModel.canCreateTemplate &&
    request.kind === LineItemKind.Standard
  );
}
export function createServiceRequestAcceptForm(
  request: ServiceRequestDto,
  viewModel: ServiceRequestsViewModel,
  locale: string,
): ServiceRequestAcceptFormValues {
  const template = viewModel.templates.find(
    (t) => t.id === request.lineItemTemplateId && t.kind === request.kind,
  );
  const fields = createLineItemFieldsFormValues(template ?? null, locale);
  // What was offered is what gets booked; the catalog only fills in when no offer recorded a value.
  const quantityMinutes = request.offeredMinutes ?? request.requestedMinutes;
  return {
    ...fields,
    priceInput:
      request.offeredPriceCents !== null
        ? formatCentsAsEuroInput(request.offeredPriceCents, locale)
        : fields.priceInput,
    title: template?.title ?? request.title,
    description: template?.description ?? request.note,
    projectMode:
      canChooseServiceRequestProject(request, viewModel) &&
      (request.projectWish === Mode.New ||
        template?.projectMode === LineItemProjectMode.NewProject)
        ? Mode.New
        : Mode.Existing,
    projectId:
      viewModel.projects.find((p) => p.id === request.requestedProjectId)?.id ??
      viewModel.projects[0]?.id ??
      "",
    projectTitle: request.title,
    templateMode: canChooseServiceRequestTemplate(request, viewModel)
      ? Mode.New
      : Mode.Existing,
    templateId: template?.id ?? "",
    quantityInput:
      quantityMinutes !== null ? formatDuration(quantityMinutes) : "",
    allocateHoursToProject: true,
    status: ProjectLineItemStatus.Planned,
    confirmedWithoutOffer: false,
  };
}
export function applyServiceRequestTemplate(
  values: ServiceRequestAcceptFormValues,
  template: LineItemTemplateDto,
  locale: string,
): ServiceRequestAcceptFormValues {
  return {
    ...values,
    ...createLineItemFieldsFormValues(template, locale),
    templateId: template.id,
  };
}
export function validateServiceRequestAcceptForm(
  values: ServiceRequestAcceptFormValues,
  request: ServiceRequestDto,
): boolean {
  if (
    Object.keys(
      validateLineItemFieldsForm(
        values,
        ProjectLineItemFieldLimits.PriceCentsMax,
      ),
    ).length
  )
    return false;
  if (values.projectMode === Mode.Existing && !values.projectId) return false;
  if (values.projectMode === Mode.New && !values.projectTitle.trim())
    return false;
  if (values.templateMode === Mode.Existing && !values.templateId) return false;
  return (
    request.kind !== LineItemKind.Hours ||
    readDurationInput(values.quantityInput).ok
  );
}
export function toAcceptServiceRequest(
  values: ServiceRequestAcceptFormValues,
  request: ServiceRequestDto,
  viewModel: ServiceRequestsViewModel,
): AcceptServiceRequestRequestDto {
  const fields = toLineItemFieldsRequestFields(values);
  const projectValues = createProjectFormValues(null, viewModel.defaultPlan);
  projectValues.title = values.projectTitle;
  const quantity = readDurationInput(values.quantityInput);
  return {
    version: request.version,
    acceptWithoutOffer:
      isServiceRequestWithoutOffer(request.status) &&
      values.confirmedWithoutOffer,
    project:
      values.projectMode === Mode.New
        ? { mode: Mode.New, project: toCreateProjectRequest(projectValues) }
        : { mode: Mode.Existing, projectId: values.projectId },
    template:
      values.templateMode === Mode.New
        ? {
            mode: Mode.New,
            template: {
              ...fields,
              kind: LineItemKind.Standard,
              projectMode:
                values.projectMode === Mode.New
                  ? LineItemProjectMode.NewProject
                  : LineItemProjectMode.ExistingProject,
              portalRequestable: false,
              portalDescription: "",
            },
          }
        : { mode: Mode.Existing, lineItemTemplateId: values.templateId },
    lineItem: {
      ...fields,
      status: values.status,
      quantityMinutes:
        request.kind === LineItemKind.Hours && quantity.ok
          ? quantity.minutes
          : null,
      allocateHoursToProject: values.allocateHoursToProject,
    },
  };
}
