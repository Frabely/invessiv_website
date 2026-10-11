import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";

export type AssignProjectLineItemFailureCode =
  | typeof ProjectLineItemErrorCode.ValidationError
  | typeof ProjectLineItemErrorCode.ProjectNotFound
  | typeof ProjectLineItemErrorCode.EffectNotPermitted
  | typeof ProjectLineItemErrorCode.ProjectClosed
  | typeof ProjectLineItemErrorCode.FeedbackRoundNotAvailable;
