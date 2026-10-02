// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalOnboardingBookingDto } from "@invessiv/common/contracts/portal/portal-onboarding-booking.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { getPortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalOnboardingWidget } from "./portal-onboarding-widget";

const content = getPortalDashboardDictionary("en").widgets.onboarding;
const CHAT = "/en/portal/customer-1/messages";
const BOOKING: PortalOnboardingBookingDto = {
  memberDisplayName: "Anna Beispiel",
  bookingUrl: "https://cal.com/anna/onboarding",
  provider: BookingProvider.CalCom,
};

function form(
  status: OnboardingFormStatus,
  canEdit = false,
): PortalOnboardingFormSummaryDto {
  return {
    id: "form-1",
    projectId: "project-1",
    projectTitle: "Relaunch",
    status,
    progress: { answeredRequired: 5, totalRequired: 5, ratio: 1 },
    submittedAt:
      status === OnboardingFormStatus.Open ? null : "2026-10-01T10:00:00.000Z",
    completedAt:
      status === OnboardingFormStatus.Completed
        ? "2026-10-05T10:00:00.000Z"
        : null,
    canEdit,
  };
}

function renderWidget(
  dto: PortalOnboardingFormSummaryDto,
  booking: PortalOnboardingBookingDto | null = BOOKING,
  chatHref: string | null = CHAT,
) {
  render(
    <PortalOnboardingWidget
      booking={booking}
      chatHref={chatHref}
      content={content}
      customerId="customer-1"
      form={dto}
      locale="en"
    />,
  );
  return screen.getByRole("region", { name: content.title });
}

describe("PortalOnboardingWidget onboarding call", () => {
  afterEach(cleanup);

  it("offers the booking link of the responsible member once the form went out", () => {
    const widget = renderWidget(form(OnboardingFormStatus.Submitted));
    const call = within(widget).getByRole("region", {
      name: content.call.heading,
    });

    expect(call).toHaveTextContent("Anna Beispiel");
    expect(call).toHaveTextContent("The calendar runs on Cal.com.");
    const link = within(call).getByRole("link", { name: /Pick a time/ });
    expect(link).toHaveAttribute("href", BOOKING.bookingUrl);
    expect(link).toHaveAttribute("data-primary", "true");
    expect(widget.querySelector("script, iframe")).toBeNull();
  });

  it("keeps the additions in front of the call during a change request", () => {
    const widget = renderWidget(
      form(OnboardingFormStatus.ChangesRequested, true),
    );

    expect(
      within(widget).getByRole("link", { name: /Complete the onboarding/ }),
    ).toHaveAttribute("data-primary", "true");
    expect(
      within(widget).getByRole("link", { name: /Pick a time/ }),
    ).not.toHaveAttribute("data-primary");
  });

  it("says that the team gets in touch when nobody offers a link, never an empty card", () => {
    const widget = renderWidget(form(OnboardingFormStatus.Submitted), null);
    const call = within(widget).getByRole("region", {
      name: content.call.heading,
    });

    expect(call).toHaveTextContent(content.call.fallback.text);
    expect(
      within(call).getByRole("link", { name: content.call.fallback.chat }),
    ).toHaveAttribute("href", CHAT);
  });

  it.each([
    [OnboardingFormStatus.Open, true],
    [OnboardingFormStatus.Completed, false],
  ])(
    "shows no call for a form that is %s, even with a link",
    (status, canEdit) => {
      const widget = renderWidget(form(status, canEdit));

      expect(
        within(widget).queryByRole("region", { name: content.call.heading }),
      ).toBeNull();
      expect(
        within(widget).queryByRole("link", { name: /Pick a time/ }),
      ).toBeNull();
      expect(widget).not.toHaveTextContent(content.call.fallback.text);
    },
  );
});
