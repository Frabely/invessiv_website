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
        contactChannels={[
          {
            actionLabel: "Per E-Mail anfragen",
            href: "mailto:hi@invessiv.de",
            label: "E-Mail",
            value: "hi@invessiv.de",
          },
        ]}
        contactChecklist={["Ziel", "Deadline", "Assets"]}
        contactChecklistHint="Dauert ca. 2 Minuten."
        contactChecklistTitle="In 3 kurzen Antworten starten"
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
      screen.getByRole("heading", {
        name: "Bereit fuer eine neue, produktive Website?",
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Jetzt Projekt anfragen" })
        .getAttribute("href"),
    ).toBe("#contact");
    expect(
      screen
        .getByRole("link", { name: "Leistungen ansehen" })
        .getAttribute("href"),
    ).toBe("#services");
    expect(screen.getByText("In 3 kurzen Antworten starten")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Per E-Mail anfragen" }),
    ).toBeTruthy();
  });
});
