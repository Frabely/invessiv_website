// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FooterSection } from "./footer-section";

describe("FooterSection", () => {
  it("renders hero, columns, socials and legal links", () => {
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
        heroDescription="Starte dein Projekt."
        heroPrimaryCta={{ href: "#contact", label: "Jetzt Projekt anfragen" }}
        heroSecondaryCta={{ href: "#services", label: "Leistungen ansehen" }}
        heroTitle="Bereit fuer eine neue Website?"
        id="footer"
        legalLinks={[{ href: "#", label: "Impressum" }]}
        socialLinks={[{ href: "#", label: "Instagram", platform: "instagram" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Bereit fuer eine neue Website?" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Jetzt Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    expect(screen.getByRole("link", { name: "Instagram" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Impressum" })).toBeTruthy();
  });
});
