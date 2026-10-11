// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import {
  getCrmCockpitDictionary,
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
  getCrmHoursDictionary,
  getCrmTasksDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  projectFixture,
  taskFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerProjectsSection } from "./customer-projects-section";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: navigation.replace }),
  usePathname: () => "/de/crm",
  useSearchParams: () => new URLSearchParams(),
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
  it.each([
    ProjectStatus.Active,
    ProjectStatus.Completed,
    ProjectStatus.Archived,
    ProjectStatus.Cancelled,
  ])("offers task booking only on bookable projects: %s", (status) => {
    const hoursContent = getCrmHoursDictionary("de");
    const tasksContent = getCrmTasksDictionary("de");
    render(
      <CustomerProjectsSection
        canWrite={false}
        content={content}
        customerId={TEST_CUSTOMER_ID}
        locale="de"
        projects={[{ ...projects[0], project: { ...website, status } }]}
        hoursContent={hoursContent}
        hours={{
          canManage: false,
          writableProjectIds: [website.id],
          bookedMinutesByTaskId: {},
          today: "2026-10-11",
          hours: {
            balance: null,
            purchases: [],
            allocations: [],
            projects: [
              {
                projectId: website.id,
                title: website.title,
                status,
                allocatedMinutes: 60,
                usedMinutes: 0,
                goodwillMinutes: 0,
                remainingMinutes: 60,
                releasableMinutes: 60,
              },
            ],
          },
        }}
        tasksContent={tasksContent}
        tasks={{
          tasks: [taskFixture({ projectId: website.id })],
          readableProjectIds: [website.id],
          writableProjectIds: [],
          members: [],
          today: "2026-10-11",
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: tasksContent.section.expandLabel }),
    );
    const action = screen.queryByRole("button", { name: /Zeit buchen:/ });
    if (status === ProjectStatus.Archived || status === ProjectStatus.Cancelled)
      expect(action).toBeNull();
    else expect(action).toBeVisible();
  });
  beforeAll(() => {
    // jsdom has no layout; the phase scale scrolls its current step into view.
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("switches the project canvas through the tabs", () => {
    const view = renderSection(false);

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAccessibleName("Website");
    expect(
      screen.getByRole("heading", { level: 3, name: "Website" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "Shop" }));
    expect(navigation.replace).toHaveBeenCalledWith(
      `/de/crm?cockpit=${TEST_CUSTOMER_ID}&project=${shop.id}`,
      { scroll: false },
    );
    view.rerender(
      <CustomerProjectsSection
        canWrite={false}
        content={content}
        customerId={TEST_CUSTOMER_ID}
        locale="de"
        projects={projects}
        selectedProjectId={shop.id}
      />,
    );

    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Shop");
    expect(
      screen.getByRole("heading", { level: 3, name: "Shop" }),
    ).toBeVisible();
  });

  it("follows a new project selected through the URL", () => {
    const props = {
      canWrite: false,
      content,
      customerId: TEST_CUSTOMER_ID,
      locale: "de" as const,
      projects,
    };
    const view = render(
      <CustomerProjectsSection {...props} selectedProjectId={website.id} />,
    );
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Website");

    view.rerender(
      <CustomerProjectsSection {...props} selectedProjectId={shop.id} />,
    );
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Shop");
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

  it("shows the onboarding of the open tab in place of the former placeholder", () => {
    const onboardingContent = getCrmOnboardingDictionary("de");
    const onboarding = (projectId: string): OnboardingViewModel => ({
      projectId,
      state: {
        projectId,
        form: null,
        review: null,
        canStart: true,
        projectEligible: true,
        prefillAvailable: false,
      },
      templates: [],
      formHref: null,
    });
    const props = {
      canWrite: false,
      content,
      customerId: TEST_CUSTOMER_ID,
      locale: "de" as const,
      onboardingContent,
      projects,
      questionnaireErrors: getCrmQuestionnaireDictionary("de").errors,
    };
    const view = render(
      <CustomerProjectsSection
        {...props}
        onboarding={onboarding(website.id)}
      />,
    );

    expect(
      screen.getByRole("heading", { name: onboardingContent.project.title }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: onboardingContent.project.start }),
    ).toBeVisible();
    expect(screen.queryByText(content.mock.badge)).toBeNull();

    // The state of another tab is never shown under this project.
    view.rerender(
      <CustomerProjectsSection {...props} onboarding={onboarding(shop.id)} />,
    );
    expect(
      screen.queryByRole("heading", { name: onboardingContent.project.title }),
    ).toBeNull();
  });

  it("has no onboarding area without the right to read the project", () => {
    renderSection(false);
    expect(
      screen.queryByRole("heading", {
        name: getCrmOnboardingDictionary("de").project.title,
      }),
    ).toBeNull();
  });
});
