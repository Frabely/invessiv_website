// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QAndASection } from "./q-and-a-section";

describe("QAndASection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("starts with all FAQ items collapsed", () => {
    render(
      <QAndASection
        description="Die wichtigsten Fragen vor dem Projektstart werden hier direkt beantwortet."
        id="faq"
        items={[
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
            link: {
              href: "/de/services/landing-page",
              label: "Landingpage-Detailseite ansehen",
            },
          },
          {
            question: "Könnt ihr meine alte Webseite überarbeiten?",
            answer: "Ja, ich kann bestehende Seiten gezielt modernisieren.",
          },
        ]}
        secondaryContact={{
          hint: "Frage nicht dabei?",
          href: "#contact-email",
          label: "Schreib mir direkt per Mail.",
        }}
        title="Q&A"
      />,
    );

    const firstCard = screen.getByRole("button", {
      name: /Wie läuft der Projektstart ab\?/i,
    });
    const secondCard = screen.getByRole("button", {
      name: /Könnt ihr meine alte Webseite überarbeiten\?/i,
    });

    expect(firstCard.getAttribute("aria-expanded")).toBe("false");
    expect(secondCard.getAttribute("aria-expanded")).toBe("false");
  });

  it("lets users toggle FAQ items by clicking the whole card", () => {
    render(
      <QAndASection
        description="Die wichtigsten Fragen vor dem Projektstart werden hier direkt beantwortet."
        id="faq"
        items={[
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
            link: {
              href: "/de/services/landing-page",
              label: "Landingpage-Detailseite ansehen",
            },
          },
          {
            question: "Könnt ihr meine alte Webseite überarbeiten?",
            answer: "Ja, ich kann bestehende Seiten gezielt modernisieren.",
          },
        ]}
        secondaryContact={{
          hint: "Frage nicht dabei?",
          href: "#contact-email",
          label: "Schreib mir direkt per Mail.",
        }}
        title="Q&A"
      />,
    );

    const firstCard = screen.getByRole("button", {
      name: /Wie läuft der Projektstart ab\?/i,
    });
    const secondCard = screen.getByRole("button", {
      name: /Könnt ihr meine alte Webseite überarbeiten\?/i,
    });

    fireEvent.click(firstCard);
    expect(firstCard.getAttribute("aria-expanded")).toBe("true");
    expect(secondCard.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen
        .getByRole("link", { name: "Landingpage-Detailseite ansehen" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");

    fireEvent.click(secondCard);
    expect(firstCard.getAttribute("aria-expanded")).toBe("false");
    expect(secondCard.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.queryByRole("link", {
        name: "Landingpage-Detailseite ansehen",
      }),
    ).toBeNull();

    const secondaryContactLink = screen.getByRole("link", {
      name: "Schreib mir direkt per Mail.",
    });
    expect(secondaryContactLink.getAttribute("href")).toBe("#contact-email");
  });
});
