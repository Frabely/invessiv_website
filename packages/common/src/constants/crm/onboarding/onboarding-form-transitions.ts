import { OnboardingFormStatus } from "./onboarding-form-statuses";
import { OnboardingTransitionSide } from "./onboarding-transition-sides";

/**
 * The only source for allowed status changes, read by the server and by the UI. Creating a form
 * is no transition: it always starts as `draft`. Nothing leads out of `completed`.
 */
export const ONBOARDING_FORM_TRANSITIONS = [
  {
    from: OnboardingFormStatus.Draft,
    to: OnboardingFormStatus.Open,
    side: OnboardingTransitionSide.Internal,
  },
  {
    from: OnboardingFormStatus.Open,
    to: OnboardingFormStatus.Submitted,
    side: OnboardingTransitionSide.Customer,
  },
  {
    from: OnboardingFormStatus.Submitted,
    to: OnboardingFormStatus.ChangesRequested,
    side: OnboardingTransitionSide.Internal,
  },
  {
    from: OnboardingFormStatus.ChangesRequested,
    to: OnboardingFormStatus.Submitted,
    side: OnboardingTransitionSide.Customer,
  },
  {
    from: OnboardingFormStatus.Submitted,
    to: OnboardingFormStatus.Completed,
    side: OnboardingTransitionSide.Internal,
  },
] as const;
