// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalOnboardingBookingDto } from "@invessiv/common/contracts/portal/portal-onboarding-booking.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import {
  portalOnboardingBlock as block,
  portalOnboardingField as field,
  portalOnboardingForm,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import {
  getPortalFilesDictionary,
  getPortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { OnboardingFormView } from "./onboarding-form-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/portal/customer-1/onboarding/form-1",
  useSearchParams: () => new URLSearchParams(),
}));

const content = getPortalOnboardingDictionary("en");
const CHAT = "/en/portal/customer-1/messages";
const BOOKING: PortalOnboardingBookingDto = {
  memberDisplayName: "Anna Beispiel",
  bookingUrl: "https://calendly.com/anna/onboarding",
  provider: BookingProvider.Calendly,
};
const SUBMITTED = portalOnboardingForm(
  [block("Company", [field("Name")]), block("Brand", [field("Claim")])],
  {
    status: OnboardingFormStatus.Submitted,
    submittedAt: "2026-10-01T10:00:00.000Z",
    editableBlockIds: [],
  },
);

function renderView(call: PortalOnboardingCallDto | null) {
  return render(
    <OnboardingFormView
      backHref="/en/portal/customer-1"
      call={call}
      canUpload
      chatHref={CHAT}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      filesContent={getPortalFilesDictionary("en")}
      form={SUBMITTED}
      locale="en"
    />,
  );
}

function callSection() {
  return screen.queryByRole("region", { name: content.call.heading });
}

describe("OnboardingFormView onboarding call", () => {
  afterEach(cleanup);

  it("shows only that the team reviews the answers until the call is due", () => {
    renderView(null);

    expect(
      screen.getByText(content.states.submitted.description),
    ).toBeInTheDocument();
    expect(callSection()).toBeNull();
    expect(screen.queryByRole("link", { name: /Pick a time/ })).toBeNull();
  });

  it("offers the booking link above the answers once the call is due", () => {
    const { container } = renderView({ booking: BOOKING });

    expect(callSection()).toHaveTextContent("Anna Beispiel");
    const link = screen.getByRole("link", { name: /Pick a time/ });
    expect(link).toHaveAttribute("href", BOOKING.bookingUrl);
    expect(link).toHaveAttribute("data-primary", "true");
    expect(container.querySelector("script, iframe")).toBeNull();
    expect(
      callSection()!.compareDocumentPosition(
        screen.getByRole("heading", { name: content.read.heading }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the hint and the way into the chat when nobody offers a link", () => {
    renderView({ booking: null });

    expect(callSection()).toHaveTextContent(content.call.fallback.text);
    expect(
      screen.getByRole("link", { name: content.call.fallback.chat }),
    ).toHaveAttribute("href", CHAT);
  });
});
