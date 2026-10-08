// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  ProjectHoursSection,
  type ProjectHoursSectionProps,
} from "./project-hours-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const api = vi.hoisted(() => ({
  listTimeEntries: vi.fn(),
  deleteTimeEntry: vi.fn(),
  createAllocation: vi.fn(),
}));
vi.mock("@/client/crm/hours-api-service", () => ({ hoursApiService: api }));

const content = getCrmHoursDictionary("de");
const text = content.project;
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const TASK_ID = "44444444-4444-4444-8444-444444444444";

function project(
  overrides: Partial<CustomerHoursProjectDto> = {},
): CustomerHoursProjectDto {
  return {
    projectId: PROJECT_ID,
    title: "Relaunch",
    status: ProjectStatus.Active,
    allocatedMinutes: 300,
    usedMinutes: 90,
    goodwillMinutes: 0,
    remainingMinutes: 210,
    releasableMinutes: 210,
    ...overrides,
  };
}

function entry(overrides: Partial<TimeEntryDto> = {}): TimeEntryDto {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    projectId: PROJECT_ID,
    taskId: TASK_ID,
    performedOn: "2026-10-07",
    durationMinutes: 60,
    description: "Hero neu gebaut",
    billable: true,
    performedByMemberId: "member-1",
    version: 1,
    createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-07T10:00:00.000Z",
    ...overrides,
  };
}

const onBook = vi.fn();
const onEdit = vi.fn();
const onChanged = vi.fn();

function renderSection(overrides: Partial<ProjectHoursSectionProps> = {}) {
  render(
    <ProjectHoursSection
      canManage
      canWrite
      content={content}
      customerId="11111111-1111-4111-8111-111111111111"
      freeMinutes={120}
      locale="de"
      onBookAction={onBook}
      onChangedAction={onChanged}
      onEditAction={onEdit}
      project={project()}
      revision={0}
      tasks={[{ id: TASK_ID, title: "Umbau Hero-Section", linkable: true }]}
      {...overrides}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: text.expandLabel }));
}

describe("ProjectHoursSection", () => {
  beforeEach(() => {
    [onBook, onEdit, onChanged, ...Object.values(api)].forEach((mock) =>
      mock.mockReset(),
    );
    api.listTimeEntries.mockResolvedValue({
      ok: true,
      value: {
        entries: [
          entry(),
          entry({
            id: "66666666-6666-4666-8666-666666666666",
            taskId: null,
            durationMinutes: 30,
            description: "Beratung am Telefon",
            billable: false,
          }),
        ],
        nextCursor: null,
      },
    });
  });
  afterEach(cleanup);

  it("shows the figures and every entry with what the customer will read", async () => {
    renderSection();

    expect(screen.getByText("3:30 übrig")).toBeVisible();
    expect(await screen.findByText("Hero neu gebaut")).toBeVisible();
    // The task is a second line only when it says more than the description.
    expect(screen.getByText("Umbau Hero-Section")).toBeVisible();
    expect(screen.getByText("Beratung am Telefon")).toBeVisible();
    expect(screen.getByText(content.entry.goodwill)).toBeVisible();
    expect(screen.getByLabelText(text.figuresLabel)).toHaveTextContent(
      "Zugewiesen5:00",
    );
  });

  it("names an overdrawn project in the header", async () => {
    renderSection({
      project: project({
        usedMinutes: 360,
        remainingMinutes: -60,
        releasableMinutes: 0,
      }),
    });

    expect(screen.getByText("1:00 überzogen")).toBeVisible();
    await screen.findByText("Hero neu gebaut");
    expect(
      screen.queryByRole("button", { name: content.projects.releaseAction }),
    ).not.toBeInTheDocument();
  });

  it("renders no action without the rights", async () => {
    renderSection({ canManage: false, canWrite: false });

    await screen.findByText("Hero neu gebaut");
    expect(
      screen.queryByRole("button", { name: text.bookAction }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Ändern/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.projects.allocateAction }),
    ).not.toBeInTheDocument();
  });

  it("hands booking and editing to the dialog one level up", async () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: text.bookAction }));
    expect(onBook).toHaveBeenCalledOnce();

    fireEvent.click(
      (await screen.findAllByRole("button", { name: /^Ändern/ }))[0],
    );
    expect(onEdit).toHaveBeenCalledWith(entry());
  });

  it("deletes with the entry's version after asking", async () => {
    api.deleteTimeEntry.mockResolvedValue({ ok: true });
    renderSection();

    fireEvent.click(
      (await screen.findAllByRole("button", { name: /^Löschen/ }))[0],
    );
    expect(screen.getByText(content.deleteDialog.title)).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: content.deleteDialog.confirm }),
    );

    await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
    expect(api.deleteTimeEntry).toHaveBeenCalledWith(entry().id, {
      version: 1,
    });
  });

  it("points out hours still allocated to a finished project and never books on a closed one", async () => {
    renderSection({ project: project({ status: ProjectStatus.Archived }) });

    await screen.findByText("Hero neu gebaut");
    expect(
      screen.getByText(text.closedHint.replace("{duration}", "3:30")),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: content.projects.releaseAction }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: text.bookAction }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.projects.allocateAction }),
    ).not.toBeInTheDocument();
  });

  it("explains the area while nothing is booked and warns without allocated hours", async () => {
    api.listTimeEntries.mockResolvedValue({
      ok: true,
      value: { entries: [], nextCursor: null },
    });
    renderSection({
      project: project({
        allocatedMinutes: 0,
        usedMinutes: 0,
        remainingMinutes: 0,
        releasableMinutes: 0,
      }),
    });

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(screen.getByText(new RegExp(text.emptyUnallocated))).toBeVisible();
  });

  it("loads the next page on request and announces it", async () => {
    api.listTimeEntries.mockResolvedValueOnce({
      ok: true,
      value: { entries: [entry()], nextCursor: "next" },
    });
    api.listTimeEntries.mockResolvedValueOnce({
      ok: true,
      value: {
        entries: [
          entry({
            id: "77777777-7777-4777-8777-777777777777",
            description: "Ältere Buchung",
            performedOn: "2026-09-01",
          }),
        ],
        nextCursor: null,
      },
    });
    renderSection();

    fireEvent.click(await screen.findByRole("button", { name: text.loadMore }));

    expect(await screen.findByText("Ältere Buchung")).toBeVisible();
    expect(api.listTimeEntries).toHaveBeenLastCalledWith(PROJECT_ID, "next");
    expect(screen.getByRole("status")).toHaveTextContent(
      text.moreLoaded.replace("{count}", "1"),
    );
    expect(
      screen.queryByRole("button", { name: text.loadMore }),
    ).not.toBeInTheDocument();
  });

  it("offers a retry when the list cannot be loaded", async () => {
    api.listTimeEntries.mockResolvedValue({ ok: false, code: "INTERNAL" });
    renderSection();

    expect(await screen.findByText(new RegExp(text.loadError))).toBeVisible();
    expect(screen.getByRole("button", { name: text.retry })).toBeVisible();
  });
});
