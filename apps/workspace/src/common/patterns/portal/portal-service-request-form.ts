import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { MINUTES_PER_HOUR } from "@invessiv/common/constants/time/time-units";
import { PortalServiceRequestLimits } from "@invessiv/common/constants/portal/portal-service-request-limits";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServiceProjectOptionDto } from "@invessiv/common/contracts/portal/portal-service-project-option.dto";
import { PortalServiceRequestFormField as Field } from "@/common/constants/portal/portal-service-request-form-fields";
import type { PortalServiceProjectQuestion } from "@/common/contracts/portal/portal-service-project-question";
import type { PortalServiceRequestFormValues } from "@/common/contracts/portal/portal-service-request-form-values";
import { listPortalServiceProjectWishes } from "./portal-service-project-wishes";

/** `service` is null for a free-text request throughout this module. */
type RequestedService = PortalRequestableServiceDto | null;

/**
 * What the form asks about the project. Free text may name any project the portal shows; a catalog
 * entry only the ones the server offers for it. The allowed answers come from the same rule the
 * server enforces, so the form never offers what the command would reject.
 */
function projectQuestion(
  service: RequestedService,
  allProjects: readonly PortalServiceProjectOptionDto[],
): PortalServiceProjectQuestion {
  const projects = service
    ? allProjects.filter((project) => service.projectIds.includes(project.id))
    : allProjects;
  const wishes = listPortalServiceProjectWishes({
    service,
    selectableProjectCount: projects.length,
  });
  return {
    wishes,
    projects,
    asks:
      wishes.length > 1 ||
      (wishes.includes(Wish.Existing) && projects.length > 1),
  };
}

/**
 * A question with a single answer is answered up front. `preferredProjectId` (the project the
 * dashboard shows) is preselected when the service can be requested for it.
 */
function initialValues(
  question: PortalServiceProjectQuestion,
  preferredProjectId: string | null,
): PortalServiceRequestFormValues {
  const blank = { title: "", note: "", hours: "" };
  const preferred = question.projects.find(
    (project) => project.id === preferredProjectId,
  );
  const only = question.projects.length === 1 ? question.projects[0] : null;
  const project = preferred ?? only ?? null;
  if (question.wishes.includes(Wish.Existing) && project)
    return { ...blank, projectWish: Wish.Existing, projectId: project.id };
  if (question.wishes.length === 1)
    return { ...blank, projectWish: question.wishes[0]!, projectId: null };
  return { ...blank, projectWish: null, projectId: null };
}

/** Whole hours as typed, in minutes; null for anything that is not a whole number in range. */
function toRequestedMinutes(hours: string): number | null {
  if (!/^\d+$/.test(hours.trim())) return null;
  const minutes = Number(hours.trim()) * MINUTES_PER_HOUR;
  return minutes >= PortalServiceRequestLimits.MinRequestedMinutes &&
    minutes <= PortalServiceRequestLimits.MaxRequestedMinutes
    ? minutes
    : null;
}

/** The fields that keep the form from sending, in the order they appear. */
function invalidFields(
  values: PortalServiceRequestFormValues,
  service: RequestedService,
  question: PortalServiceProjectQuestion,
): Field[] {
  const invalid: Field[] = [];
  const projectAnswered =
    values.projectWish !== null &&
    question.wishes.includes(values.projectWish) &&
    (values.projectWish !== Wish.Existing ||
      question.projects.some((project) => project.id === values.projectId));
  if (service === null && values.title.trim() === "") invalid.push(Field.Title);
  if (!projectAnswered) invalid.push(Field.Project);
  if (
    service?.kind === LineItemKind.Hours &&
    toRequestedMinutes(values.hours) === null
  )
    invalid.push(Field.Hours);
  if (service === null && values.note.trim() === "") invalid.push(Field.Note);
  return invalid;
}

/**
 * The request for valid values (`invalidFields` is empty). It never carries a price, a kind or a
 * company: the server takes kind and title from the catalog entry and the company from the session.
 */
function toRequest(
  values: PortalServiceRequestFormValues,
  service: RequestedService,
  idempotencyKey: string,
): CreatePortalServiceRequestDto {
  const projectWish = values.projectWish ?? Wish.Undecided;
  return {
    idempotencyKey,
    lineItemTemplateId: service?.id ?? null,
    title: service ? null : values.title.trim(),
    note: values.note.trim(),
    requestedMinutes:
      service?.kind === LineItemKind.Hours
        ? toRequestedMinutes(values.hours)
        : null,
    projectWish,
    projectId: projectWish === Wish.Existing ? values.projectId : null,
  };
}

export const portalServiceRequestForm = {
  projectQuestion,
  initialValues,
  toRequestedMinutes,
  invalidFields,
  toRequest,
} as const;
