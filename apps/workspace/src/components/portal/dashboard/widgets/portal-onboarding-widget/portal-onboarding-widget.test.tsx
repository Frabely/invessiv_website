// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { getPortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalOnboardingWidget } from "./portal-onboarding-widget";

const content = getPortalDashboardDictionary("en").widgets.onboarding;
const HREF = "/en/portal/customer-1/onboarding/form-1?project=project-1";

function form(
  overrides: Partial<PortalOnboardingFormSummaryDto> = {},
): PortalOnboardingFormSummaryDto {
  return {
    id: "form-1",
    projectId: "project-1",
    projectTitle: "Relaunch",
    status: OnboardingFormStatus.Open,
    progress: { answeredRequired: 2, totalRequired: 5, ratio: 0.4 },
    submittedAt: null,
    completedAt: null,
    canEdit: true,
    ...overrides,
  };
}

function renderWidget(dto: PortalOnboardingFormSummaryDto) {
  render(
    <PortalOnboardingWidget
      content={content}
      customerId="customer-1"
      form={dto}
      locale="en"
    />,
  );
  return screen.getByRole("region", { name: content.title });
}

describe("PortalOnboardingWidget", () => {
  afterEach(cleanup);

  it("shows the progress of an open form and leads on to filling it in", () => {
    const widget = renderWidget(form());

    expect(widget).not.toHaveAttribute("data-mock", "true");
    expect(widget).toHaveTextContent("Relaunch");
    expect(widget).toHaveTextContent(content.turn.open);
    expect(within(widget).getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "2 of 5 required answers",
    );
    expect(
      within(widget).getByRole("link", {
        name: "Continue the onboarding for Relaunch",
      }),
    ).toHaveAttribute("href", HREF);
  });

  it("asks for additions, not for filling in again, during a change request", () => {
    const widget = renderWidget(
      form({ status: OnboardingFormStatus.ChangesRequested }),
    );

    expect(widget).toHaveTextContent(content.turn.changes_requested);
    const link = within(widget).getByRole("link", {
      name: "Complete the onboarding for Relaunch now",
    });
    expect(link).toHaveTextContent(content.amend);
    expect(link).toHaveAttribute("href", HREF);
  });

  it("offers only a look to a contact who may not fill the form in", () => {
    const widget = renderWidget(form({ canEdit: false }));

    expect(
      within(widget).getByRole("link", {
        name: "View the onboarding for Relaunch",
      }),
    ).toHaveAttribute("href", HREF);
  });

  it("says when the form was submitted and that the team reviews it", () => {
    const widget = renderWidget(
      form({
        status: OnboardingFormStatus.Submitted,
        submittedAt: "2026-10-01T10:00:00.000Z",
        canEdit: false,
      }),
    );

    expect(widget).toHaveTextContent(/Submitted on .*2026/);
    expect(widget).toHaveTextContent("We’re reviewing your answers.");
    expect(within(widget).queryByRole("progressbar")).toBeNull();
    expect(
      within(widget).getByRole("link", {
        name: "View the onboarding for Relaunch",
      }),
    ).toBeInTheDocument();
  });

  it("says when the onboarding was completed", () => {
    const widget = renderWidget(
      form({
        status: OnboardingFormStatus.Completed,
        submittedAt: "2026-10-01T10:00:00.000Z",
        completedAt: "2026-10-05T10:00:00.000Z",
        canEdit: false,
      }),
    );

    expect(widget).toHaveTextContent(/Completed on .*2026/);
    expect(within(widget).getByRole("link")).toHaveAccessibleName(
      "View the onboarding for Relaunch",
    );
  });
});
