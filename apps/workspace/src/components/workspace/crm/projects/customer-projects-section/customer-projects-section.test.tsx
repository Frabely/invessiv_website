// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  projectFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerProjectsSection } from "./customer-projects-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const content = getCrmCockpitDictionary("de");

const website = projectFixture({ id: "project-website", title: "Website" });
const shop = projectFixture({ id: "project-shop", title: "Shop" });
const projects: CockpitProjectDto[] = [website, shop].map((project) => ({
  id: project.id,
  title: project.title,
  project,
}));

function renderSection(canWrite: boolean) {
  return render(
    <CustomerProjectsSection
      canWrite={canWrite}
      content={content}
      customerId={TEST_CUSTOMER_ID}
      locale="de"
      projects={projects}
    />,
  );
}

describe("CustomerProjectsSection", () => {
  beforeAll(() => {
    // jsdom has no layout; the phase scale scrolls its current step into view.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("switches the project canvas through the tabs", () => {
    renderSection(false);

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAccessibleName("Website");
    expect(
      screen.getByRole("heading", { level: 3, name: "Website" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Shop" }));

    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Shop");
    expect(
      screen.getByRole("heading", { level: 3, name: "Shop" }),
    ).toBeVisible();
  });

  it("offers create and edit only with write access, editing from the project header", () => {
    renderSection(false);
    expect(
      screen.queryByRole("button", { name: content.projects.create }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: content.projects.edit }),
    ).toBeNull();
    cleanup();

    renderSection(true);
    const create = screen.getByRole("button", {
      name: content.projects.create,
    });
    expect(create).toBeVisible();
    expect(create).toHaveTextContent(content.projects.create);
    const edit = screen.getAllByRole("button", { name: content.projects.edit });
    expect(edit).toHaveLength(1);
    expect(screen.getByRole("tablist")).not.toContainElement(edit[0]);

    fireEvent.click(edit[0]);
    expect(
      screen.getByRole("dialog", { name: content.projects.formTitleEdit }),
    ).toBeVisible();
  });

  it("reserves the roadmap areas of a project as marked placeholders", () => {
    renderSection(false);

    for (const area of Object.values(content.projects.futureAreas)) {
      expect(screen.getByRole("heading", { name: area.title })).toBeVisible();
    }
    expect(screen.getAllByText(content.mock.badge)).toHaveLength(
      Object.keys(content.projects.futureAreas).length,
    );
  });
});
