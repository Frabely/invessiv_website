export const CONTACT_VALIDATION_FIELD_ERROR_CODE = {
  ConsentRequired: "consent_required",
  DuplicateCustomPageNames: "duplicate_custom_page_names",
  DuplicatePageKeys: "duplicate_page_keys",
  GoalRequired: "goal_required",
  InvalidEmail: "invalid_email",
  InvalidStartedAt: "invalid_started_at",
  InvalidWebsite: "invalid_website",
  MessageRequired: "message_required",
  PagesRequired: "pages_required",
  ProjectDetailsRequired: "project_details_required",
  Required: "required",
  SpamDetected: "spam_detected",
  TooLong: "too_long",
  TooManyPages: "too_many_pages",
  WebsiteRequired: "website_required",
  WorkflowRequired: "workflow_required",
} as const;

export type ContactValidationFieldErrorCode =
  (typeof CONTACT_VALIDATION_FIELD_ERROR_CODE)[keyof typeof CONTACT_VALIDATION_FIELD_ERROR_CODE];
