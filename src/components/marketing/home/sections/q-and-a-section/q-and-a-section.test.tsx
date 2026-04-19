// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QAndASection } from "./q-and-a-section";

describe("QAndASection", () => {
  it("lets users close an open FAQ by clicking the whole card", () => {
    render(
      <QAndASection
        description="Die wichtigsten Fragen vor dem Projektstart werden hier direkt beantwortet."
        id="faq"
        items={[
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
          },
          {
            question: "Könnt ihr meine alte Webseite überarbeiten?",
            answer: "Ja, ich kann bestehende Seiten gezielt modernisieren.",
          },
        ]}
        secondaryContact={{
          hint: "Frage nicht dabei?",
          href: "mailto:service@invessiv.com",
          label: "Schreib mir direkt per Mail.",
        }}
        summaryPoints={[
          "Typische Projektfragen",
          "Kurz, klar, direkt beantwortet",
        ]}
        title="Q&A"
      />,
    );

    const firstCard = screen.getByRole("button", {
      name: /Wie läuft der Projektstart ab\?/i,
    });
    const secondCard = screen.getByRole("button", {
      name: /Könnt ihr meine alte Webseite überarbeiten\?/i,
    });

    expect(firstCard.getAttribute("aria-expanded")).toBe("true");
    expect(secondCard.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(firstCard);
    expect(firstCard.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(secondCard);
    expect(secondCard.getAttribute("aria-expanded")).toBe("true");

    const secondaryContactLink = screen.getByRole("link", {
      name: "Schreib mir direkt per Mail.",
    });
    expect(secondaryContactLink.getAttribute("href")).toBe(
      "mailto:service@invessiv.com",
    );
  });
});
