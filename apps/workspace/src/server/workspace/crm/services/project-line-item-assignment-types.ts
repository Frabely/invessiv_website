import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemRow } from "@invessiv/common/contracts/crm/rows/project-line-item-row";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

/** The project the caller loaded and checked `project_line_items.write` on. */
export type AssignmentProject = {
  id: string;
  customerId: string;
  status: ProjectStatus;
};

/** An active catalog entry; its kind decides what the assignment does beyond the line item. */
export type AssignmentTemplate = {
  id: string;
  kind: LineItemKind;
};

/** The validated snapshot. `status` is ignored for kinds that always start as `confirmed`. */
export type AssignmentFields = {
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
  status: ProjectLineItemStatus;
  quantityMinutes: number | null;
  /** Hours only: allocate the purchase to the project, or leave it in the customer's free stock. */
  allocateHoursToProject: boolean;
};

export type AssignProjectLineItemInput = {
  actor: WorkspaceActor;
  project: AssignmentProject;
  template: AssignmentTemplate;
  fields: AssignmentFields;
};

/** Every way an assignment can be refused; the caller maps them onto its own result. */
export type AssignProjectLineItemFailureCode =
  | typeof ProjectLineItemErrorCode.ValidationError
  | typeof ProjectLineItemErrorCode.ProjectNotFound
  | typeof ProjectLineItemErrorCode.EffectNotPermitted
  | typeof ProjectLineItemErrorCode.ProjectClosed
  | typeof ProjectLineItemErrorCode.FeedbackRoundNotAvailable;

export type AssignProjectLineItemResult =
  | { ok: true; row: ProjectLineItemRow }
  | { ok: false; code: AssignProjectLineItemFailureCode };
