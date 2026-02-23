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
            href: "mailto:hi@invessiv.de",
            hint: "Scope und Details",
            label: "E-Mail",
            value: "hi@invessiv.de",
          },
        ]}
        checklist={["Ziel", "Deadline"]}
        checklistTitle="Briefing-Check"
        contactCta={{
          hint: "Antwort in 24h.",
          href: "#contact",
          label: "Kickoff anfragen",
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
    expect(screen.getByRole("link", { name: "Kickoff anfragen" }).getAttribute("href")).toBe(
      "#contact",
    );
  });
});
