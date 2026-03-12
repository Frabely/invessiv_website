// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QAndASection } from "./q-and-a-section";

describe("QAndASection", () => {
  it("renders accordion items and toggles answers", () => {
    render(
      <QAndASection
        description=""
        id="faq"
        items={[
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
          },
          {
            question: "Könnt ihr meine alte Website überarbeiten?",
            answer: "Ja, ich kann bestehende Seiten gezielt modernisieren.",
          },
        ]}
        secondaryContact={{
          hint: "Frage nicht dabei?",
          href: "mailto:service@invessiv.com",
          label: "Schreib mir direkt per Mail.",
        }}
        title="Q&A"
      />,
    );

    expect(screen.getByRole("heading", { name: "Q&A" })).toBeTruthy();

    const firstQuestion = screen.getByText("Wie läuft der Projektstart ab?");
    const firstDisclosure = firstQuestion.closest("details");
    expect(firstDisclosure).toBeTruthy();
    expect(firstDisclosure?.hasAttribute("open")).toBe(false);

    fireEvent.click(firstQuestion.closest("summary") as HTMLElement);
    expect(firstDisclosure?.hasAttribute("open")).toBe(true);

    expect(
      screen.getByText(
        "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Könnt ihr meine alte Website überarbeiten?"),
    ).toBeTruthy();
    expect(
      screen.getByText("Ja, ich kann bestehende Seiten gezielt modernisieren."),
    ).toBeTruthy();

    const secondaryContactLink = screen.getByRole("link", {
      name: "Schreib mir direkt per Mail.",
    });
    expect(secondaryContactLink.getAttribute("href")).toBe(
      "mailto:service@invessiv.com",
    );
  });
});
