// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  CONTACT_CHANNEL_KEY,
  CONTACT_CHANNEL_KEYS,
} from "@/common/constants/contact/contact-channel-keys";
import {
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_TEL,
} from "@/config/company";
import { getContactChannelContent } from "@/i18n/dictionaries/shared/contact-channels";

import { ContactChannelLinks } from "./contact-channel-links";

const EXPECTED_HREF = {
  [CONTACT_CHANNEL_KEY.Email]: COMPANY_MAILTO,
  [CONTACT_CHANNEL_KEY.Phone]: COMPANY_TEL,
  [CONTACT_CHANNEL_KEY.Linkedin]: COMPANY_SOCIAL_LINKEDIN,
  [CONTACT_CHANNEL_KEY.Instagram]: COMPANY_SOCIAL_INSTAGRAM,
};

describe("ContactChannelLinks", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders one link per channel in the given order, pointing at the configured targets", () => {
    render(
      <ContactChannelLinks
        analyticsArea="footer"
        channels={CONTACT_CHANNEL_KEYS}
        locale="de"
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(CONTACT_CHANNEL_KEYS.length);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CONTACT_CHANNEL_KEYS.map((channel) => EXPECTED_HREF[channel]),
    );
  });

  it("renders only the requested channels", () => {
    render(
      <ContactChannelLinks
        analyticsArea="contact"
        channels={[CONTACT_CHANNEL_KEY.Email]}
        locale="de"
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveProperty("href", COMPANY_MAILTO);
  });

  it.each(["de", "en"] as const)(
    "labels the list and every link from the %s dictionary",
    (locale) => {
      const content = getContactChannelContent(locale);

      render(
        <ContactChannelLinks
          analyticsArea="footer"
          channels={CONTACT_CHANNEL_KEYS}
          locale={locale}
        />,
      );

      expect(
        screen.getByRole("list", { name: content.listAriaLabel }),
      ).toBeTruthy();

      for (const channel of CONTACT_CHANNEL_KEYS) {
        expect(
          screen.getByRole("link", { name: content.channels[channel] }),
        ).toBeTruthy();
      }
    },
  );

  it("opens external profiles in a new tab and keeps mail and phone in place", () => {
    render(
      <ContactChannelLinks
        analyticsArea="footer"
        channels={CONTACT_CHANNEL_KEYS}
        locale="de"
      />,
    );

    for (const channel of [
      CONTACT_CHANNEL_KEY.Linkedin,
      CONTACT_CHANNEL_KEY.Instagram,
    ]) {
      const link = document.querySelector(
        "a[href='" + EXPECTED_HREF[channel] + "']",
      );

      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.getAttribute("rel")).toBe("noreferrer");
    }

    for (const channel of [
      CONTACT_CHANNEL_KEY.Email,
      CONTACT_CHANNEL_KEY.Phone,
    ]) {
      const link = document.querySelector(
        "a[href='" + EXPECTED_HREF[channel] + "']",
      );

      expect(link?.getAttribute("target")).toBeNull();
      expect(link?.getAttribute("rel")).toBeNull();
    }
  });

  it("marks every link for contact channel tracking with the resolved channel", () => {
    render(
      <ContactChannelLinks
        analyticsArea="footer"
        channels={CONTACT_CHANNEL_KEYS}
        locale="de"
      />,
    );

    const links = screen.getAllByRole("link");

    for (const link of links) {
      expect(link.getAttribute("data-analytics-event")).toBe(
        "contact_channel_clicked",
      );
    }

    // Every channel href resolves through getContactTarget.
    expect(
      links.map(
        (link) =>
          JSON.parse(link.getAttribute("data-analytics-payload") ?? "{}") as {
            area: string;
            channel: string;
          },
      ),
    ).toEqual(
      ["email", "phone", "linkedin", "instagram"].map((channel) => ({
        area: "footer",
        channel,
      })),
    );
  });

  it("stays icon-only so the buttons carry no visible label", () => {
    render(
      <ContactChannelLinks
        analyticsArea="footer"
        channels={CONTACT_CHANNEL_KEYS}
        locale="de"
      />,
    );

    for (const link of screen.getAllByRole("link")) {
      expect(link.textContent).toBe("");
      expect(link.querySelector("[aria-hidden='true']")).toBeTruthy();
    }
  });
});
