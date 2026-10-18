// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BookingProvider } from "@invessiv/common/constants/portal/booking-providers";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import { getPortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackQuotaNotice } from "./feedback-quota-notice";

const content = getPortalFeedbackDictionary("de");
const texts = content.states.exhausted;
const CHAT = "/de/portal/customer-1?chat=open";
const REQUEST =
  "/de/portal/customer-1?widget=serviceRequest&project=project-1&service=service-round";
const CONTACT: PortalContactDto = {
  displayName: "Mara Team",
  email: "mara@example.test",
  booking: {
    memberDisplayName: "Mara Team",
    bookingUrl: "https://cal.example.test/mara",
    provider: BookingProvider.Other,
  },
};

describe("FeedbackQuotaNotice", () => {
  afterEach(cleanup);

  it("offers the further round first and keeps chat, call and email", () => {
    render(
      <FeedbackQuotaNotice
        contact={CONTACT}
        content={content}
        messagesHref={CHAT}
        requestHref={REQUEST}
      />,
    );

    expect(
      screen.getByRole("link", { name: texts.requestLink }),
    ).toHaveAttribute("href", REQUEST);
    expect(screen.getByText(texts.requestDescription)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: texts.chatLink })).toHaveAttribute(
      "href",
      CHAT,
    );
    expect(
      screen.getByRole("link", {
        name: new RegExp(content.contact.booking.action),
      }),
    ).toHaveAttribute("href", "https://cal.example.test/mara");
    expect(
      screen.getByRole("link", { name: "E-Mail an Mara Team schreiben" }),
    ).toHaveAttribute("href", "mailto:mara@example.test");
  });

  it("names every way to reach us without a requestable round", () => {
    render(
      <FeedbackQuotaNotice
        contact={{ ...CONTACT, booking: null }}
        content={content}
        messagesHref={CHAT}
      />,
    );

    expect(screen.getByText(texts.description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: texts.chatLink })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "E-Mail an Mara Team schreiben" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", {
        name: new RegExp(content.contact.booking.action),
      }),
    ).toBeNull();
  });

  it("only explains without chat access and without a responsible member", () => {
    render(
      <FeedbackQuotaNotice
        contact={null}
        content={content}
        messagesHref={null}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByRole("heading", { name: texts.title }),
    ).toBeInTheDocument();
  });
});
