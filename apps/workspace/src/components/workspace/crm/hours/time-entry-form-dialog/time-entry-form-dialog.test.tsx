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

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { fillDurationInput } from "@invessiv/ui/components/duration-input/duration-input.test-helper";
import {
  TimeEntryFormDialog,
  type TimeEntryFormDialogProps,
} from "./time-entry-form-dialog";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const api = vi.hoisted(() => ({
  createTimeEntry: vi.fn(),
  updateTimeEntry: vi.fn(),
}));
vi.mock("@/client/crm/hours-api-service", () => ({ hoursApiService: api }));

const content = getCrmHoursDictionary("de");
const text = content.entryDialog;
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const TASK_ID = "44444444-4444-4444-8444-444444444444";

const project = {
  projectId: PROJECT_ID,
  allocatedMinutes: 300,
  usedMinutes: 180,
  goodwillMinutes: 0,
  remainingMinutes: 120,
  releasableMinutes: 120,
};

function entry(overrides: Partial<TimeEntryDto> = {}): TimeEntryDto {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    projectId: PROJECT_ID,
    taskId: null,
    performedOn: "2026-10-07",
    durationMinutes: 60,
    description: "Formular angepasst",
    billable: true,
    performedByMemberId: "member-1",
    version: 3,
    createdAt: "2026-10-07T10:00:00.000Z",
    updatedAt: "2026-10-07T10:00:00.000Z",
    ...overrides,
  };
}

const onClose = vi.fn();
const onSaved = vi.fn();

function renderDialog(overrides: Partial<TimeEntryFormDialogProps> = {}) {
  return render(
    <TimeEntryFormDialog
      content={content}
      entry={null}
      locale="de"
      onCloseAction={onClose}
      onSavedAction={onSaved}
      project={project}
      projectTitle="Relaunch"
      tasks={[
        { id: TASK_ID, title: "Umbau Hero-Section", linkable: true },
        { id: "cancelled-task", title: "Verworfen", linkable: false },
      ]}
      today="2026-10-08"
      {...overrides}
    />,
  );
}

function durationInput() {
  return screen.getByRole("spinbutton", { name: new RegExp(text.minutes) });
}

function descriptionInput() {
  return screen.getByRole("textbox", {
    name: new RegExp(text.descriptionField),
  });
}

function submit(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("TimeEntryFormDialog", () => {
  beforeEach(() => {
    [
      refresh,
      onClose,
      onSaved,
      api.createTimeEntry,
      api.updateTimeEntry,
    ].forEach((mock) => mock.mockReset());
  });
  afterEach(cleanup);

  it("marks the description as visible to the customer", () => {
    renderDialog();

    expect(screen.getByText(text.descriptionHint)).toBeVisible();
  });

  it("shows the remaining balance on opening and after resetting the duration", () => {
    renderDialog({ project: { ...project, remainingMinutes: 180 } });

    const forecast = text.remainingAfter.replace("{duration}", "3:00");
    expect(screen.getByText(forecast)).toBeVisible();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "1",
      "00",
    );
    expect(
      screen.getByText(text.remainingAfter.replace("{duration}", "2:00")),
    ).toBeVisible();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "0",
      "00",
    );
    expect(screen.getByText(forecast)).toBeVisible();
  });

  it("books the typed time with today's date by default", async () => {
    api.createTimeEntry.mockResolvedValue({ ok: true });
    renderDialog();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "1",
      "30",
    );
    fireEvent.change(descriptionInput(), {
      target: { value: "Umbau Hero-Section" },
    });
    submit(text.submitCreate);

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(api.createTimeEntry).toHaveBeenCalledWith(PROJECT_ID, {
      performedOn: "2026-10-08",
      durationMinutes: 90,
      description: "Umbau Hero-Section",
      billable: true,
      taskId: null,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("books more than 24 hours without capping the duration", async () => {
    api.createTimeEntry.mockResolvedValue({ ok: true });
    renderDialog();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "25",
      "15",
    );
    expect(durationInput()).toHaveAttribute("aria-valuenow", "25");
    fireEvent.change(descriptionInput(), {
      target: { value: "Projektarbeit" },
    });
    submit(text.submitCreate);

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(api.createTimeEntry).toHaveBeenCalledWith(
      PROJECT_ID,
      expect.objectContaining({ durationMinutes: 1515 }),
    );
  });

  it("prefills the description from the task it was opened for", () => {
    renderDialog({ initialTaskId: TASK_ID });

    expect(descriptionInput()).toHaveValue("Umbau Hero-Section");
  });

  it("says what is left, by how much it overdraws, and that goodwill does not count", () => {
    renderDialog();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "1",
      "00",
    );
    expect(
      screen.getByText(text.remainingAfter.replace("{duration}", "1:00")),
    ).toBeVisible();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "2",
      "30",
    );
    expect(
      screen.getByText(text.overdrawsBy.replace("{duration}", "0:30")),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("checkbox", { name: /Kulanz/ }));
    expect(screen.getByText(text.goodwillNote)).toBeVisible();
  });

  it("requires a positive duration and description before any request", () => {
    renderDialog();

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "0",
      "00",
    );
    submit(text.submitCreate);

    expect(screen.getByText(content.duration.required)).toBeVisible();
    expect(screen.getByText(text.descriptionRequired)).toBeVisible();
    expect(api.createTimeEntry).not.toHaveBeenCalled();
  });

  it("gives the old minutes back when an entry is edited", () => {
    renderDialog({ entry: entry() });

    expect(durationInput()).toHaveAttribute("aria-valuenow", "1");
    expect(
      screen.getByRole("spinbutton", { name: content.duration.minutes }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(descriptionInput()).toHaveValue("Formular angepasst");
    // 2:00 left already include this entry's hour, so keeping it leaves 2:00.
    expect(
      screen.getByText(text.remainingAfter.replace("{duration}", "2:00")),
    ).toBeVisible();
  });

  it("keeps the input and retries against the fresh version after a conflict", async () => {
    api.updateTimeEntry.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: entry({ version: 4, durationMinutes: 45 }),
    });
    api.updateTimeEntry.mockResolvedValueOnce({ ok: true });
    renderDialog({ entry: entry() });

    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "2",
      "00",
    );
    submit(text.submitEdit);

    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("0:45");
    expect(durationInput()).toHaveAttribute("aria-valuenow", "2");
    expect(
      screen.getByText(text.remainingAfter.replace("{duration}", "1:00")),
    ).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();

    submit(text.submitEdit);
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(api.updateTimeEntry).toHaveBeenLastCalledWith(
      entry().id,
      expect.objectContaining({ version: 4, durationMinutes: 120 }),
    );
  });

  it("offers no task field without the right to read tasks", () => {
    renderDialog({ tasks: null });

    expect(screen.queryByText(text.task)).not.toBeInTheDocument();
  });

  it("keeps the balance snapshot consistent when a conflict changes billability", async () => {
    api.updateTimeEntry.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: entry({ version: 4, billable: false }),
    });
    renderDialog({ entry: entry() });
    fillDurationInput(
      new RegExp(text.minutes),
      content.duration.minutes,
      "2",
      "00",
    );
    submit(text.submitEdit);
    await screen.findByRole("alert");
    expect(
      screen.getByText(text.remainingAfter.replace("{duration}", "1:00")),
    ).toBeVisible();
  });
});
