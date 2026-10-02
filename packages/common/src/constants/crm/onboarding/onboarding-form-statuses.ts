export const OnboardingFormStatus = {
  Draft: "draft",
  Open: "open",
  Submitted: "submitted",
  ChangesRequested: "changes_requested",
  Completed: "completed",
} as const;

export type OnboardingFormStatus =
  (typeof OnboardingFormStatus)[keyof typeof OnboardingFormStatus];

export const ONBOARDING_FORM_STATUS_VALUES = [
  OnboardingFormStatus.Draft,
  OnboardingFormStatus.Open,
  OnboardingFormStatus.Submitted,
  OnboardingFormStatus.ChangesRequested,
  OnboardingFormStatus.Completed,
] as const;

/** The customer may write answers only here; during a change request only in the flagged blocks. */
export const ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES = [
  OnboardingFormStatus.Open,
  OnboardingFormStatus.ChangesRequested,
] as const;

/** A draft is still being prepared by the team and does not exist for the portal. */
export const ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES = [
  OnboardingFormStatus.Open,
  OnboardingFormStatus.Submitted,
  OnboardingFormStatus.ChangesRequested,
  OnboardingFormStatus.Completed,
] as const;

/**
 * Blocks and fields may change only here. After the first submission the review works on a fixed
 * structure; what is missing then goes through a change request.
 */
export const ONBOARDING_STRUCTURE_EDITABLE_STATUS_VALUES = [
  OnboardingFormStatus.Draft,
  OnboardingFormStatus.Open,
] as const;

/**
 * The onboarding call is booked here: from the first submission until the team completes the
 * form. Before that the answers are not in, afterwards the call is over.
 */
export const ONBOARDING_CALL_BOOKABLE_STATUS_VALUES = [
  OnboardingFormStatus.Submitted,
  OnboardingFormStatus.ChangesRequested,
] as const;

/** Every status after the first submission; a CHECK requires `submitted_at` for them. */
export const ONBOARDING_SUBMITTED_STATUS_VALUES = [
  OnboardingFormStatus.Submitted,
  OnboardingFormStatus.ChangesRequested,
  OnboardingFormStatus.Completed,
] as const;
