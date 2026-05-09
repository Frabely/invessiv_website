// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";
import { FooterSection } from "./footer-section";

describe("FooterSection", () => {
  it("renders columns, socials and legal links", () => {
    render(
      <FooterSection
        brand="Invessiv"
        columns={[
          {
            links: [{ href: "#proof", label: "Ergebnisse" }],
            title: "Navigation",
          },
          {
            links: [
              { href: "mailto:info@invessiv.de", label: "info@invessiv.de" },
            ],
            title: "Kontakt",
          },
        ]}
        copyright="(c) 2024"
        description="Schnellzugriff"
        id="footer"
        legalLinks={[{ href: "#", label: "Impressum" }]}
        socialLinks={[
          {
            href: "#",
            label: "Instagram",
            platform: LeadSocialPlatform.Instagram,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Ergebnisse" }).getAttribute("href"),
    ).toBe("#proof");
    expect(screen.getByRole("link", { name: "Instagram" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Impressum" })).toHaveLength(1);
    expect(screen.getByText("Schnellzugriff")).toBeTruthy();
    expect(screen.getByText("(c) 2024")).toBeTruthy();
  });
});
