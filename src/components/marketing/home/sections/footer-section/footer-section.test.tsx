// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
            links: [{ href: "mailto:info@invessiv.de", label: "info@invessiv.de" }],
            title: "Kontakt",
          },
        ]}
        copyright="(c) 2024"
        description="Schnellzugriff"
        id="footer"
        legalLinks={[{ href: "#", label: "Impressum" }]}
        socialLinks={[{ href: "#", label: "Instagram", platform: "instagram" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "Ergebnisse" }).getAttribute("href")).toBe("#proof");
    expect(screen.getByRole("link", { name: "Instagram" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Impressum" })).toBeTruthy();
  });
});
