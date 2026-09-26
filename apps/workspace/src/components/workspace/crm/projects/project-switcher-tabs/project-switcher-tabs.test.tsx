// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProjectSwitcherTabs } from "./project-switcher-tabs";

const content = getCrmCockpitDictionary("en");

function project(id: string, title: string): CockpitProjectDto {
  return { id, title, project: null };
}

const projects = [
  project("p1", "Website"),
  project("p2", "Shop"),
  project("p3", "Newsletter"),
];

function Harness() {
  const [active, setActive] = useState("p1");
  return (
    <ProjectSwitcherTabs
      activeProjectId={active}
      onSelectAction={setActive}
      panelId="panel"
      projects={projects}
      statusLabels={content.projects.status}
      tabIdFor={(id) => `tab-${id}`}
      tabsLabel={content.projects.tabsLabel}
    />
  );
}

describe("ProjectSwitcherTabs", () => {
  afterEach(cleanup);

  it("names every tab exactly after its project and keeps one tab in the tab order", () => {
    render(<Harness />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Website",
      "Shop",
      "Newsletter",
    ]);
    expect(screen.getByRole("tab", { name: "Website" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    expect(screen.getByRole("tablist")).toHaveAccessibleName(
      content.projects.tabsLabel,
    );
  });

  it("moves with the arrow keys, wraps around and jumps with Home and End", () => {
    render(<Harness />);
    const tab = (name: string) => screen.getByRole("tab", { name });

    fireEvent.keyDown(tab("Website"), { key: "ArrowLeft" });
    expect(tab("Newsletter")).toHaveAttribute("aria-selected", "true");
    expect(tab("Newsletter")).toHaveFocus();

    fireEvent.keyDown(tab("Newsletter"), { key: "ArrowRight" });
    expect(tab("Website")).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tab("Website"), { key: "End" });
    expect(tab("Newsletter")).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(tab("Newsletter"), { key: "Home" });
    expect(tab("Website")).toHaveAttribute("aria-selected", "true");
  });

  it("selects a tab on click", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Shop" }));
    expect(screen.getByRole("tab", { name: "Shop" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
