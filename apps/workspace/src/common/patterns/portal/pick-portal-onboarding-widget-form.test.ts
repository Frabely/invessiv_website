import { describe, expect, it } from "vitest";

import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { pickPortalOnboardingWidgetForm } from "./pick-portal-onboarding-widget-form";

function form(
  id: string,
  status: OnboardingFormStatus,
): PortalOnboardingFormSummaryDto {
  return {
    id,
    projectId: `project-${id}`,
    projectTitle: id,
    status,
    progress: { answeredRequired: 0, totalRequired: 1, ratio: 0 },
    submittedAt: null,
    completedAt: null,
    canEdit: true,
  };
}

describe("pickPortalOnboardingWidgetForm", () => {
  it("has nothing to show without a form", () => {
    expect(pickPortalOnboardingWidgetForm([])).toBeNull();
  });

  it("prefers the form the customer can still fill in over a newer one", () => {
    const forms = [
      form("newest", OnboardingFormStatus.Submitted),
      form("open", OnboardingFormStatus.Open),
      form("oldest", OnboardingFormStatus.Completed),
    ];

    expect(pickPortalOnboardingWidgetForm(forms)?.id).toBe("open");
  });

  it("counts a change request as the customer's turn", () => {
    const forms = [
      form("newest", OnboardingFormStatus.Completed),
      form("asked", OnboardingFormStatus.ChangesRequested),
    ];

    expect(pickPortalOnboardingWidgetForm(forms)?.id).toBe("asked");
  });

  it("falls back to the newest form, which the list puts first", () => {
    const forms = [
      form("newest", OnboardingFormStatus.Submitted),
      form("older", OnboardingFormStatus.Completed),
    ];

    expect(pickPortalOnboardingWidgetForm(forms)?.id).toBe("newest");
  });
});
