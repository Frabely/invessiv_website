// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalBookingDto } from "@invessiv/common/contracts/portal/portal-booking.dto";
import { getPortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { OnboardingBookingCard } from "./onboarding-booking-card";

const texts = getPortalOnboardingDictionary("en").call;
const CHAT = "/en/portal/customer-1?chat=open";
const BOOKING: PortalBookingDto = {
  memberDisplayName: "Anna Beispiel",
  bookingUrl: "https://calendly.com/anna/onboarding",
  provider: BookingProvider.Calendly,
};

function renderCard(
  booking: PortalBookingDto | null,
  chatHref: string | null = CHAT,
) {
  return render(
    <OnboardingBookingCard
      booking={booking}
      chatHref={chatHref}
      texts={texts}
    />,
  );
}

describe("OnboardingBookingCard", () => {
  afterEach(cleanup);

  it("names member, provider and purpose before a link that opens in a new tab", () => {
    renderCard(BOOKING);
    const card = screen.getByRole("region", { name: texts.heading });
    const link = screen.getByRole("link", { name: /Pick a time/ });

    expect(card).toHaveTextContent("Pick a time with Anna Beispiel.");
    expect(card).toHaveTextContent("The calendar runs on Calendly.");
    expect(link).toHaveAttribute("href", BOOKING.bookingUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName(/opens in a new tab/);
    // The notice is what a screen reader hears with the link, and it stands before it.
    const notice = screen.getByText(/The calendar runs on Calendly/);
    expect(link).toHaveAttribute("aria-describedby", notice.id);
    expect(
      notice.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("loads nothing from the provider before the click", () => {
    const { container } = renderCard(BOOKING);

    expect(
      container.querySelector("script, iframe, embed, object, img, link"),
    ).toBeNull();
    // The only place the provider's address appears is the link the customer clicks.
    expect(container.innerHTML.split("calendly.com")).toHaveLength(2);
  });

  it("announces an unknown host as an external provider without inventing a name", () => {
    renderCard({
      ...BOOKING,
      bookingUrl: "https://termine.example.org/anna",
      provider: BookingProvider.Other,
    });

    expect(screen.getByText(texts.booking.noticeOther)).toBeInTheDocument();
    expect(screen.queryByText(/Calendly|Cal\.com/)).not.toBeInTheDocument();
  });

  it("says that the team gets in touch and leads into the chat when there is no link", () => {
    renderCard(null);

    expect(
      screen.getByRole("region", { name: texts.heading }),
    ).toHaveTextContent(texts.fallback.text);
    expect(
      screen.getByRole("link", { name: texts.fallback.chat }),
    ).toHaveAttribute("href", CHAT);
    expect(screen.queryByText(/calendar/i)).not.toBeInTheDocument();
  });

  it("shows the hint alone without the chat permission", () => {
    renderCard(null, null);

    expect(screen.getByText(texts.fallback.text)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
