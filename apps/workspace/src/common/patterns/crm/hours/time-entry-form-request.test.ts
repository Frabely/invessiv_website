import { describe, expect, it } from "vitest";

import {
  remainingAfterTimeEntry,
  toTimeEntryRequest,
} from "@/common/patterns/crm/hours/time-entry-form-request";

describe("toTimeEntryRequest", () => {
  it("turns the goodwill tick into billable and trims the text", () => {
    expect(
      toTimeEntryRequest({
        performedOn: "2026-10-08",
        minutes: 90,
        description: "  Umbau Hero-Section ",
        goodwill: true,
        taskId: null,
      }),
    ).toEqual({
      performedOn: "2026-10-08",
      durationMinutes: 90,
      description: "Umbau Hero-Section",
      billable: false,
      taskId: null,
    });
  });
});

describe("remainingAfterTimeEntry", () => {
  const project = { remainingMinutes: 120 };

  it("deducts a new billable entry and can go below zero", () => {
    expect(
      remainingAfterTimeEntry(project, { minutes: 90, goodwill: false }, null),
    ).toBe(30);
    expect(
      remainingAfterTimeEntry(project, { minutes: 150, goodwill: false }, null),
    ).toBe(-30);
  });

  it("leaves the figure alone for goodwill", () => {
    expect(
      remainingAfterTimeEntry(project, { minutes: 90, goodwill: true }, null),
    ).toBe(120);
  });

  it("gives back the old minutes of the entry being edited first", () => {
    expect(
      remainingAfterTimeEntry(
        project,
        { minutes: 30, goodwill: false },
        { durationMinutes: 60, billable: true },
      ),
    ).toBe(150);
    // Turning a billable entry into goodwill frees its minutes entirely.
    expect(
      remainingAfterTimeEntry(
        project,
        { minutes: 60, goodwill: true },
        { durationMinutes: 60, billable: true },
      ),
    ).toBe(180);
    // A goodwill entry made billable starts counting.
    expect(
      remainingAfterTimeEntry(
        project,
        { minutes: 60, goodwill: false },
        { durationMinutes: 60, billable: false },
      ),
    ).toBe(60);
  });
});
