// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProblemSolutionSection } from "./problem-solution-section";

const CONTENT = {
  body: "Eine Landingpage bündelt dein Angebot auf einer Seite.",
  eyebrow: "Problem → Lösung",
  pairs: [
    { problem: "Angebot zu allgemein", solution: "Angebot klar auf den Punkt" },
    {
      problem: "Nächster Schritt unklar",
      solution: "Nächster Schritt eindeutig",
    },
  ],
  problemLabel: "Ohne Landingpage",
  solutionLabel: "Mit Landingpage",
  title: "Warum Besucher abspringen — und was deine Landingpage anders macht.",
};

describe("ProblemSolutionSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders heading, body, and both labelled lists with all pairs", () => {
    render(<ProblemSolutionSection id="solution" locale="de" {...CONTENT} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Warum Besucher abspringen/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Eine Landingpage bündelt dein Angebot auf einer Seite.",
      ),
    ).toBeTruthy();

    const chaosList = screen.getByRole("list", { name: "Ohne Landingpage" });
    const clarityList = screen.getByRole("list", { name: "Mit Landingpage" });
    expect(within(chaosList).getAllByRole("listitem")).toHaveLength(2);
    expect(within(clarityList).getAllByRole("listitem")).toHaveLength(2);
    expect(within(chaosList).getByText("Angebot zu allgemein")).toBeTruthy();
    expect(
      within(clarityList).getByText("Angebot klar auf den Punkt"),
    ).toBeTruthy();
    expect(within(chaosList).getByText("Nächster Schritt unklar")).toBeTruthy();
    expect(
      within(clarityList).getByText("Nächster Schritt eindeutig"),
    ).toBeTruthy();
  });

  it("highlights the matching problem scrap when hovering a solution row", () => {
    render(<ProblemSolutionSection id="solution" locale="de" {...CONTENT} />);

    const solutionRow = screen
      .getByText("Angebot klar auf den Punkt")
      .closest("li") as HTMLElement;
    const problemScrap = screen
      .getByText("Angebot zu allgemein")
      .closest("li") as HTMLElement;

    expect(problemScrap.dataset.highlight).toBeUndefined();

    fireEvent.mouseOver(solutionRow);
    expect(problemScrap.dataset.highlight).toBe("true");
    expect(solutionRow.dataset.highlight).toBe("true");

    fireEvent.mouseOut(solutionRow);
    expect(problemScrap.dataset.highlight).toBeUndefined();
  });

  it("marks items as visible for the staggered reveal", async () => {
    render(<ProblemSolutionSection id="solution" locale="de" {...CONTENT} />);

    const firstScrap = screen
      .getByText("Angebot zu allgemein")
      .closest("li") as HTMLElement;
    await waitFor(() => {
      expect(firstScrap.dataset.visible).toBe("true");
    });
  });
});
