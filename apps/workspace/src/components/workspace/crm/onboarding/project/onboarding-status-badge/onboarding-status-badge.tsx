import type { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { Badge } from "@invessiv/ui";
import { ONBOARDING_FORM_STATUS_BADGES } from "@/common/constants/crm/onboarding/onboarding-form-status-badges";

export type OnboardingStatusBadgeProps = {
  status: OnboardingFormStatus;
  /** Worded by the caller; the portal names the same states in its own words. */
  label: string;
};

export function OnboardingStatusBadge({
  status,
  label,
}: OnboardingStatusBadgeProps) {
  const badge = ONBOARDING_FORM_STATUS_BADGES[status];
  return (
    <Badge icon={badge.icon} kind="status" label={label} tone={badge.tone} />
  );
}
