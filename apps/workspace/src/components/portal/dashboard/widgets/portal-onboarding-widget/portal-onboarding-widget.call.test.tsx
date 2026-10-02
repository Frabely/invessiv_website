// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalOnboardingBookingDto } from "@invessiv/common/contracts/portal/portal-onboarding-booking.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
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
const SUBMITTED: PortalOnboardingFormSummaryDto = {
  id: "form-1",
  projectId: "project-1",
  projectTitle: "Relaunch",
  status: OnboardingFormStatus.Submitted,
  progress: { answeredRequired: 5, totalRequired: 5, ratio: 1 },
  submittedAt: "2026-10-01T10:00:00.000Z",
  completedAt: null,
  canEdit: false,
};

function renderWidget(call: PortalOnboardingCallDto | null) {
  render(
    <PortalOnboardingWidget
      call={call}
      chatHref={CHAT}
      content={content}
      customerId="customer-1"
      form={SUBMITTED}
      locale="en"
    />,
  );
  return screen.getByRole("region", { name: content.title });
}

describe("PortalOnboardingWidget onboarding call", () => {
  afterEach(cleanup);

  it("shows no call while the team is still reviewing the submitted form", () => {
    const widget = renderWidget(null);

    expect(widget).toHaveTextContent(/Submitted on .*2026/);
    expect(
      within(widget).queryByRole("region", { name: content.call.heading }),
    ).toBeNull();
    expect(
      within(widget).queryByRole("link", { name: /Pick a time/ }),
    ).toBeNull();
    expect(widget).not.toHaveTextContent(content.call.fallback.text);
  });

  it("offers the booking link of the responsible member once the call is due", () => {
    const widget = renderWidget({ booking: BOOKING });
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

  it("says that the team gets in touch when nobody offers a link, never an empty card", () => {
    const widget = renderWidget({ booking: null });
    const call = within(widget).getByRole("region", {
      name: content.call.heading,
    });

    expect(call).toHaveTextContent(content.call.fallback.text);
    expect(
      within(call).getByRole("link", { name: content.call.fallback.chat }),
    ).toHaveAttribute("href", CHAT);
  });
});
