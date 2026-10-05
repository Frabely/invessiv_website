// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { projectFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { ProjectOverview } from "./project-overview";

const content = getCrmCockpitDictionary("de");
const steps = ["Onboarding", "Design", "Entwicklung", "Launch"];
const project = projectFixture({
  processSteps: steps,
  currentProcessStep: "Entwicklung",
});

describe("ProjectOverview", () => {
  beforeAll(() => {
    // jsdom has no layout; the track scrolls its current step into view.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("marks completed, current and upcoming steps and states the progress", () => {
    render(
      <ProjectOverview
        content={content}
        ownerWithoutAccess={false}
        project={project}
        title="Website"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset.state)).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
    ]);
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items.map((item) => item.dataset.tone)).toEqual([
      "success",
      "success",
      "info",
      "neutral",
    ]);
    expect(items.map((item) => item.textContent)).toEqual([
      "Onboarding, abgeschlossen",
      "Design, abgeschlossen",
      "Entwicklung, läuft",
      "Launch, offen",
    ]);
    expect(screen.getByText("Schritt 3 von 4")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it.each([
    [ProjectStatus.Planned, "info", "calendar-days"],
    [ProjectStatus.Active, "success", "circle-check"],
    [ProjectStatus.Paused, "warning", "circle-pause"],
    [ProjectStatus.Completed, "primary", "flag-checkered"],
    [ProjectStatus.Cancelled, "danger", "circle-xmark"],
    [ProjectStatus.Archived, "neutral", "box-archive"],
  ])("shows the %s project status as an icon badge", (status, tone, icon) => {
    render(
      <ProjectOverview
        content={content}
        ownerWithoutAccess={false}
        project={projectFixture({ status })}
        title="Website"
      />,
    );

    const badge = screen
      .getByText(content.projects.status[status])
      .closest('[data-kind="status"]');
    expect(badge).toHaveAttribute("data-tone", tone);
    expect(badge?.querySelector("svg")).toHaveAttribute("data-icon", icon);
  });

  it("opens the editor on a chosen step only with an edit action", () => {
    const onEditAction = vi.fn();
    render(
      <ProjectOverview
        content={content}
        onEditAction={onEditAction}
        ownerWithoutAccess={false}
        project={project}
        title="Website"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Launch/ }));
    expect(onEditAction).toHaveBeenCalledWith(project, "Launch");

    fireEvent.click(
      screen.getByRole("button", { name: content.projects.edit }),
    );
    expect(onEditAction).toHaveBeenLastCalledWith(project);
  });
});

describe("ProjectOverview feedback rounds", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  const withBlock = projectFixture({
    processSteps: steps,
    currentProcessStep: "Entwicklung",
    feedbackRoundPositions: [2, 3, 3],
    includedFeedbackRounds: 3,
  });

  it("shows each round as an accented track step at its own position", () => {
    render(
      <ProjectOverview
        content={content}
        ownerWithoutAccess={false}
        project={withBlock}
        title="Website"
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(
      items.map((item) => item.querySelector("[title]")?.textContent),
    ).toEqual([
      "Onboarding",
      "Design",
      "Feedbackrunde 1",
      "Entwicklung",
      "Feedbackrunde 2",
      "Feedbackrunde 3",
      "Launch",
    ]);
    expect(items.map((item) => item.dataset.variant)).toEqual([
      "default",
      "default",
      "accent",
      "default",
      "accent",
      "accent",
      "default",
    ]);
    expect(screen.getByText("Schritt 4 von 7")).toBeVisible();
  });

  it("opens the editor without a preselected step when a round is chosen", () => {
    const onEditAction = vi.fn();
    render(
      <ProjectOverview
        content={content}
        onEditAction={onEditAction}
        ownerWithoutAccess={false}
        project={withBlock}
        title="Website"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Feedbackrunde 2/ }));
    expect(onEditAction).toHaveBeenCalledWith(withBlock, undefined);
    fireEvent.click(screen.getByRole("button", { name: /^Launch/ }));
    expect(onEditAction).toHaveBeenLastCalledWith(withBlock, "Launch");
  });

  it("flags the running round and names it for screen readers", () => {
    render(
      <ProjectOverview
        content={content}
        ownerWithoutAccess={false}
        project={withBlock}
        roundProgress={{
          activeRoundNumber: 1,
          completedRoundNumber: null,
          approvedRoundNumber: null,
        }}
        title="Website"
      />,
    );

    const flagged = screen
      .getAllByRole("listitem")
      .filter((item) => item.dataset.flagged === "true");
    expect(flagged.map((item) => item.textContent)).toEqual([
      "Feedbackrunde 1, Feedbackrunde läuft",
    ]);
    expect(flagged[0]).toHaveAttribute("aria-current", "step");
  });
});
