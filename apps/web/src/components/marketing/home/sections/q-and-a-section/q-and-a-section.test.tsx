// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FAQ_SECTION_ID } from "@/config/navigation/home";
import { QAndASection } from "./q-and-a-section";

const items = [
  {
    question: "Wie läuft der Projektstart ab?",
    answer: "Kickoff erfolgt nach der Rahmen-Abstimmung mit klarem Zeitplan.",
    link: {
      href: "/de/services/landing-page",
      label: "Mehr zu Landingpages",
    },
  },
  {
    question: "Was kostet ein Projekt?",
    answer: "Der Preis hängt vom Umfang ab und wird vorab gemeinsam geklärt.",
  },
  {
    question: "Wem gehört die Website danach?",
    answer: "Dir. Alle Zugänge laufen auf deinen Namen.",
  },
];

const disclosure = {
  moreLabel: "Weitere Fragen anzeigen",
  lessLabel: "Weniger anzeigen",
};

function renderSection(sectionItems = items) {
  return render(
    <QAndASection
      avatarAlt="Moritz Hecht, Webentwickler aus Chemnitz"
      disclosure={disclosure}
      id={FAQ_SECTION_ID}
      intro={{
        primary: "Hast du noch Fragen?",
        secondary: "Hier sind Fragen, die mir häufig gestellt werden.",
      }}
      items={sectionItems}
      secondaryContact={{
        hint: "Frage nicht dabei?",
        href: "#contact-email",
        label: "Schreib mir direkt per Mail.",
      }}
      title="Q&A"
    />,
  );
}

describe("QAndASection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("ships the finished board so the content works without scroll choreography", () => {
    const { container } = renderSection();

    expect(container.querySelector("section")?.dataset.qnaPhase).toBe("board");
    expect(screen.getByText("Hast du noch Fragen?")).toBeTruthy();
    expect(
      screen.getByText("Hier sind Fragen, die mir häufig gestellt werden."),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "Moritz Hecht, Webentwickler aus Chemnitz",
      }),
    ).toBeTruthy();
    expect(
      items.map((item) =>
        screen
          .getByRole("button", { name: item.question })
          .getAttribute("aria-expanded"),
      ),
    ).toEqual(items.map(() => "false"));
  });

  it("splits the questions into a left and a right column around the portrait", () => {
    const { container } = renderSection();

    const columns = Array.from(
      container.querySelectorAll("[data-qna-column]"),
    ).map((column) => ({
      side: column.getAttribute("data-qna-column"),
      questionCount: column.querySelectorAll("button").length,
    }));

    expect(columns).toEqual([
      { side: "left", questionCount: 2 },
      { side: "right", questionCount: 1 },
    ]);
  });

  it("keeps only one answer open at a time across both columns", () => {
    renderSection();

    const firstQuestion = screen.getByRole("button", {
      name: "Wie läuft der Projektstart ab?",
    });
    const lastQuestion = screen.getByRole("button", {
      name: "Wem gehört die Website danach?",
    });

    fireEvent.click(firstQuestion);
    expect(firstQuestion.getAttribute("aria-expanded")).toBe("true");
    expect(lastQuestion.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen
        .getByRole("link", { name: "Mehr zu Landingpages" })
        .getAttribute("href"),
    ).toBe("/de/services/landing-page");

    fireEvent.click(lastQuestion);
    expect(firstQuestion.getAttribute("aria-expanded")).toBe("false");
    expect(lastQuestion.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.queryByRole("link", { name: "Mehr zu Landingpages" }),
    ).toBeNull();

    fireEvent.click(lastQuestion);
    expect(lastQuestion.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps every question in place while the set stays short", () => {
    renderSection();

    expect(
      screen.queryByRole("button", { name: "Weitere Fragen anzeigen" }),
    ).toBeNull();
  });

  it("marks the questions beyond the first four as the collapsed batch", () => {
    const longItems = Array.from({ length: 7 }, (_, index) => ({
      question: `Frage ${index + 1}?`,
      answer: `Antwort ${index + 1}.`,
    }));

    const { container } = renderSection(longItems);

    const overflowFlags = Array.from(
      container.querySelectorAll("[data-qna-overflow]"),
    ).map((item) => item.getAttribute("data-qna-overflow"));

    expect(overflowFlags).toEqual([
      "false",
      "false",
      "false",
      "false",
      "true",
      "true",
      "true",
    ]);
  });

  it("toggles the collapsed batch and closes an answer that goes back into hiding", () => {
    const longItems = Array.from({ length: 7 }, (_, index) => ({
      question: `Frage ${index + 1}?`,
      answer: `Antwort ${index + 1}.`,
    }));

    const { container } = renderSection(longItems);

    const board = container.querySelector("[data-qna-expanded]");
    const toggle = screen.getByRole("button", {
      name: "Weitere Fragen anzeigen",
    });

    expect(board?.getAttribute("data-qna-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);

    expect(board?.getAttribute("data-qna-expanded")).toBe("true");
    const openToggle = screen.getByRole("button", { name: "Weniger anzeigen" });
    expect(openToggle.getAttribute("aria-expanded")).toBe("true");

    const hiddenQuestion = screen.getByRole("button", { name: "Frage 6?" });
    fireEvent.click(hiddenQuestion);
    expect(hiddenQuestion.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(openToggle);

    expect(board?.getAttribute("data-qna-expanded")).toBe("false");
    expect(
      screen
        .getByRole("button", { name: "Frage 6?" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("keeps the direct mail route available", () => {
    renderSection();

    const mailLink = screen.getByRole("link", {
      name: "Schreib mir direkt per Mail.",
    });

    expect(mailLink.getAttribute("href")).toBe("#contact-email");
    expect(mailLink.getAttribute("data-analytics-location")).toBe("qna");
  });
});
