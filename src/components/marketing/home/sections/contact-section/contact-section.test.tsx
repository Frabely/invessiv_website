// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";

describe("ContactSection", () => {
  it("renders banner copy and both ctas", () => {
    render(
      <ContactSection
        contactCta={{
          hint: "Antwort in 24h.",
          href: "#contact",
          label: "Jetzt Projekt anfragen",
        }}
        contactSecondaryCta={{
          hint: "",
          href: "#services",
          label: "Leistungen ansehen",
        }}
        description="Kontaktiere uns und starte dein Projekt mit Invessiv."
        id="contact"
        title="Bereit fuer eine neue, produktive Website?"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Bereit fuer eine neue, produktive Website?" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Jetzt Projekt anfragen" }).getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen.getByRole("link", { name: "Leistungen ansehen" }).getAttribute("href"),
    ).toBe("#services");
  });
});
