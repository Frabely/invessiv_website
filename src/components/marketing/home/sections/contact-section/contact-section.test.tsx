// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";

describe("ContactSection", () => {
  it("renders channels, checklist and primary cta", () => {
    render(
      <ContactSection
        channels={[
          {
            actionLabel: "Per E-Mail anfragen",
            copyLabel: "E-Mail kopieren",
            copiedLabel: "Kopiert",
            copyValue: "hi@invessiv.de",
            href: "mailto:hi@invessiv.de",
            hint: "Scope und Details",
            label: "E-Mail",
            value: "hi@invessiv.de",
          },
        ]}
        checklist={["Ziel", "Deadline"]}
        checklistHint="Dauert 2 Minuten."
        checklistTitle="Briefing-Check"
        contactCta={{
          hint: "Antwort in 24h.",
          href: "#contact",
          label: "Kostenlosen Call buchen",
        }}
        description="Kurzer Kontaktweg"
        id="contact"
        title="Kontakt"
      />,
    );

    expect(screen.getByRole("heading", { name: "Kontakt" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "hi@invessiv.de" }).getAttribute("href")).toBe(
      "mailto:hi@invessiv.de",
    );
    expect(screen.getByRole("button", { name: "E-Mail kopieren" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Kostenlosen Call buchen" }).getAttribute("href"),
    ).toBe("#contact");
  });
});
