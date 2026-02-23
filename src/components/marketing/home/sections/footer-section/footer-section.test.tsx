// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FooterSection } from "./footer-section";

describe("FooterSection", () => {
  it("renders hero, columns, newsletter and legal links", () => {
    render(
      <FooterSection
        brand="Invessiv"
        columns={[
          {
            links: [{ href: "#proof", label: "Ergebnisse" }],
            title: "Navigation",
          },
        ]}
        copyright="© 2024"
        description="Schnellzugriff"
        heroDescription="Starte dein Projekt."
        heroPrimaryCta={{ href: "#contact", label: "Jetzt Projekt anfragen" }}
        heroSecondaryCta={{ href: "#services", label: "Leistungen ansehen" }}
        heroTitle="Bereit für eine neue Website?"
        id="footer"
        legalLinks={[{ href: "#", label: "Impressum" }]}
        newsletter={{
          buttonLabel: "→",
          consentLabel: "Ich stimme zu",
          description: "Newsletter anmelden",
          inputPlaceholder: "E-Mail",
          title: "Newsletter",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bereit für eine neue Website?" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Jetzt Projekt anfragen" }).getAttribute("href")).toBe(
      "#contact",
    );
    expect(screen.getByRole("heading", { name: "Newsletter" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Impressum" })).toBeTruthy();
  });
});
