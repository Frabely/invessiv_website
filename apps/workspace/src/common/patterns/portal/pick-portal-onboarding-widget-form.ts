import {
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES,
  type OnboardingFormStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";

const CUSTOMER_TURN_STATUSES: readonly OnboardingFormStatus[] =
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES;

/**
 * The one form the dashboard widget shows. A form waiting for the customer comes first, whatever
 * its age; otherwise the newest one, which the list (newest first) puts in front.
 */
export function pickPortalOnboardingWidgetForm(
  forms: readonly PortalOnboardingFormSummaryDto[],
): PortalOnboardingFormSummaryDto | null {
  return (
    forms.find((form) => CUSTOMER_TURN_STATUSES.includes(form.status)) ??
    forms[0] ??
    null
  );
}
