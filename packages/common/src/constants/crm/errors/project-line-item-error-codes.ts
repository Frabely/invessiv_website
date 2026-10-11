export const ProjectLineItemErrorCode = {
  ProjectLineItemNotFound: "PROJECT_LINE_ITEM_NOT_FOUND",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  LineItemTemplateChanged: "LINE_ITEM_TEMPLATE_CHANGED",
  LineItemTemplateNotAssignable: "LINE_ITEM_TEMPLATE_NOT_ASSIGNABLE",
  /** The assignment would act on hours or the process track, and the actor may not do that. */
  EffectNotPermitted: "EFFECT_NOT_PERMITTED",
  /** Hours cannot be allocated to a cancelled or archived project. */
  ProjectClosed: "PROJECT_CLOSED",
  /** The project is approved or already has the maximum number of rounds. */
  FeedbackRoundNotAvailable: "FEEDBACK_ROUND_NOT_AVAILABLE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type ProjectLineItemErrorCode =
  (typeof ProjectLineItemErrorCode)[keyof typeof ProjectLineItemErrorCode];

export const PROJECT_LINE_ITEM_ERROR_CODE_VALUES = Object.values(
  ProjectLineItemErrorCode,
) as readonly ProjectLineItemErrorCode[];
