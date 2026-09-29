// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProcessStepEditor } from "./process-step-editor";

const content = getCrmCockpitDictionary("de").projects;

function Harness({ initial }: { initial: ProjectProcessPlan }) {
  const [plan, setPlan] = useState(initial);
  return (
    <>
      <ProcessStepEditor
        content={content}
        onPlanChangeAction={setPlan}
        plan={plan}
      />
      <output data-testid="state">{JSON.stringify(plan)}</output>
    </>
  );
}

function state() {
  return JSON.parse(
    screen.getByTestId("state").textContent ?? "{}",
  ) as ProjectProcessPlan;
}

function rowTexts() {
  return screen
    .getAllByRole("listitem")
    .map((row) =>
      row.dataset.kind
        ? row.querySelector("strong")?.textContent
        : row.querySelector("input")?.value,
    );
}

const PLAN: ProjectProcessPlan = {
  steps: ["Design", "Entwicklung", "Launch"],
  feedbackRoundPositions: [],
  currentProcessStep: "Design",
};

describe("ProcessStepEditor", () => {
  afterEach(cleanup);

  it("inserts one round per click right after the chosen step", () => {
    render(<Harness initial={PLAN} />);

    const afterDevelopment = screen.getByRole("button", {
      name: "Runde nach Entwicklung einfügen",
    });
    fireEvent.click(afterDevelopment);
    fireEvent.click(afterDevelopment);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Runde nach Design einfügen",
      }),
    );

    expect(rowTexts()).toEqual([
      "Design",
      "Feedbackrunde 1",
      "Entwicklung",
      "Feedbackrunde 2",
      "Feedbackrunde 3",
      "Launch",
    ]);
    expect(state().feedbackRoundPositions).toEqual([1, 2, 2]);
    expect(screen.getByText("3 Feedbackrunden eingeplant.")).toBeVisible();
  });

  it("keeps focus on the insert button and announces the insertion", () => {
    render(<Harness initial={PLAN} />);

    const insert = screen.getByRole("button", {
      name: "Runde nach Design einfügen",
    });
    insert.focus();
    fireEvent.click(insert);

    expect(
      screen.getByRole("button", {
        name: "Runde nach Design einfügen",
      }),
    ).toHaveFocus();
    expect(screen.getByText("Feedbackrunde eingefügt.")).toBeInTheDocument();
  });

  it("renders rounds as fixed rows without a text input", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [1] }} />);

    const round = screen.getAllByRole("listitem")[1];
    expect(round).toHaveAttribute("data-kind", "feedback");
    expect(round?.querySelector("input")).toBeNull();
  });

  it("moves a single round, keeps focus on it and announces the position", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [2] }} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Feedbackrunde 1 nach oben" }),
    );

    expect(state().feedbackRoundPositions).toEqual([1]);
    expect(
      screen.getByRole("button", { name: "Feedbackrunde 1 nach oben" }),
    ).toHaveFocus();
    expect(
      screen.getByText("Feedbackrunde 1 steht jetzt nach Design."),
    ).toBeInTheDocument();
  });

  it("removes only the chosen round and renumbers the rest", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [1, 2] }} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Feedbackrunde 1 entfernen" }),
    );

    expect(rowTexts()).toEqual([
      "Design",
      "Entwicklung",
      "Feedbackrunde 1",
      "Launch",
    ]);
  });

  it("disables inserting at 20 rounds and names the reason", () => {
    render(
      <Harness
        initial={{
          ...PLAN,
          feedbackRoundPositions: Array.from({ length: 20 }, () => 3),
        }}
      />,
    );

    const insert = screen.getByRole("button", {
      name: "Runde nach Design einfügen",
    });
    expect(insert).toBeDisabled();
    expect(insert).toHaveAccessibleDescription(
      "20 Feedbackrunden eingeplant. Mehr als 20 Feedbackrunden je Projekt sind nicht möglich.",
    );
  });

  it("adds a free-text step named Feedback as a plain step", () => {
    render(<Harness initial={PLAN} />);

    fireEvent.change(screen.getByLabelText("Neuer Prozessschritt"), {
      target: { value: "Feedback" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schritt hinzufügen" }));

    expect(state().steps).toEqual([
      "Design",
      "Entwicklung",
      "Launch",
      "Feedback",
    ]);
    expect(state().feedbackRoundPositions).toEqual([]);
  });

  it("moves a step past a round one row at a time", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [1] }} />);

    fireEvent.click(screen.getByRole("button", { name: "Design nach unten" }));

    expect(rowTexts()).toEqual([
      "Feedbackrunde 1",
      "Design",
      "Entwicklung",
      "Launch",
    ]);
  });

  it("numbers only the free-text steps", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [1] }} />);

    expect(screen.getByLabelText("Prozessschritt 2")).toHaveValue(
      "Entwicklung",
    );
    expect(screen.queryByLabelText("Prozessschritt 4")).toBeNull();
  });

  it("announces a round moved to the start and a step by its step number", () => {
    render(<Harness initial={{ ...PLAN, feedbackRoundPositions: [1] }} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Feedbackrunde 1 nach oben" }),
    );
    expect(
      screen.getByText("Feedbackrunde 1 steht jetzt am Anfang."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Design nach unten" }));
    expect(
      screen.getByText("Design steht jetzt an Position 2."),
    ).toBeInTheDocument();
  });
});
