// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectSwitcher } from "./project-switcher";

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/portal/customer-1",
  useSearchParams: () => new URLSearchParams("project=project-2"),
}));
vi.mock("@invessiv/ui", () => ({
  CustomSelect: ({
    ariaLabel,
    options,
    value,
  }: {
    ariaLabel: string;
    options: { value: string; label: string }[];
    value: string;
  }) => (
    <div aria-label={ariaLabel} data-selected={value} role="group">
      {options.map((option) => (
        <span key={option.value}>{option.label}</span>
      ))}
    </div>
  ),
}));

const projects = [
  { id: "project-1", title: "Relaunch" },
  { id: "project-2", title: "Shop" },
];

describe("ProjectSwitcher", () => {
  afterEach(cleanup);

  it("stays hidden with zero or one current project", () => {
    const { rerender } = render(
      <ProjectSwitcher
        dashboardHref="/de/portal/customer-1"
        label="Projekt wechseln"
        projects={[]}
      />,
    );
    expect(
      screen.queryByRole("group", { name: "Projekt wechseln" }),
    ).toBeNull();
    rerender(
      <ProjectSwitcher
        dashboardHref="/de/portal/customer-1"
        label="Projekt wechseln"
        projects={projects.slice(0, 1)}
      />,
    );
    expect(
      screen.queryByRole("group", { name: "Projekt wechseln" }),
    ).toBeNull();
  });

  it("shows the requested project when several are available", () => {
    render(
      <ProjectSwitcher
        dashboardHref="/de/portal/customer-1"
        label="Projekt wechseln"
        projects={projects}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Projekt wechseln" }),
    ).toHaveAttribute("data-selected", "project-2");
    expect(screen.getByText("Relaunch")).toBeInTheDocument();
    expect(screen.getByText("Shop")).toBeInTheDocument();
  });
});
