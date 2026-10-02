// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalOnboardingBookingDto } from "@invessiv/common/contracts/portal/portal-onboarding-booking.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
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

function form(
  overrides: Partial<PortalOnboardingFormDto>,
): PortalOnboardingFormDto {
  return portalOnboardingForm(
    [block("Company", [field("Name")]), block("Brand", [field("Claim")])],
    { submittedAt: "2026-10-01T10:00:00.000Z", ...overrides },
  );
}

function renderView(
  dto: PortalOnboardingFormDto,
  booking: PortalOnboardingBookingDto | null = BOOKING,
) {
  return render(
    <OnboardingFormView
      backHref="/en/portal/customer-1"
      booking={booking}
      canUpload
      chatHref={CHAT}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      filesContent={getPortalFilesDictionary("en")}
      form={dto}
      locale="en"
    />,
  );
}

function callSection() {
  return screen.queryByRole("region", { name: content.call.heading });
}

describe("OnboardingFormView onboarding call", () => {
  afterEach(cleanup);

  it("offers the booking link above the answers once the form was submitted", () => {
    const { container } = renderView(
      form({ status: OnboardingFormStatus.Submitted, editableBlockIds: [] }),
    );

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

  it("keeps the call available, but quiet, while the customer answers a change request", () => {
    renderView(
      form({
        status: OnboardingFormStatus.ChangesRequested,
        editableBlockIds: ["Brand"],
      }),
    );

    expect(
      screen.getByRole("link", { name: /Pick a time/ }),
    ).not.toHaveAttribute("data-primary");
    expect(screen.getByRole("textbox", { name: /Claim/ })).toBeEnabled();
  });

  it("shows the hint and the way into the chat when nobody offers a link", () => {
    renderView(
      form({ status: OnboardingFormStatus.Submitted, editableBlockIds: [] }),
      null,
    );

    expect(callSection()).toHaveTextContent(content.call.fallback.text);
    expect(
      screen.getByRole("link", { name: content.call.fallback.chat }),
    ).toHaveAttribute("href", CHAT);
  });

  it.each([
    [OnboardingFormStatus.Open, ["Company", "Brand"]],
    [OnboardingFormStatus.Completed, []],
  ])("shows no call while the form is %s", (status, editableBlockIds) => {
    renderView(
      form({
        status,
        editableBlockIds,
        completedAt:
          status === OnboardingFormStatus.Completed
            ? "2026-10-05T10:00:00.000Z"
            : null,
      }),
    );

    expect(callSection()).toBeNull();
    expect(screen.queryByRole("link", { name: /Pick a time/ })).toBeNull();
  });
});
