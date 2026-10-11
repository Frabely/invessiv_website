import { afterEach, describe, expect, it, vi } from "vitest";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { hoursApiService } from "./hours-api-service";

const balance: CustomerHoursBalanceDto = {
  purchasedMinutes: 120,
  allocatedMinutes: 60,
  freeMinutes: 60,
  usedMinutes: 15,
  goodwillMinutes: 0,
  remainingMinutes: 105,
};
const project: ProjectHoursBalanceDto = {
  projectId: "project",
  allocatedMinutes: 60,
  usedMinutes: 15,
  goodwillMinutes: 0,
  remainingMinutes: 45,
  releasableMinutes: 45,
};
const purchase: HourPurchaseDto = {
  id: "purchase",
  kind: HourPurchaseKind.Purchase,
  source: HourPurchaseSource.Manual,
  minutes: 120,
  purchasedOn: "2026-01-01",
  note: "",
  createdByMemberId: "member",
  createdAt: "2026-01-01T12:00:00Z",
};
const allocation: HourAllocationDto = {
  id: "allocation",
  projectId: "project",
  minutes: 60,
  note: "",
  createdByMemberId: "member",
  createdAt: "2026-01-01T12:00:00Z",
};
const timeEntry: TimeEntryDto = {
  id: "entry",
  projectId: "project",
  taskId: null,
  performedOn: "2026-01-01",
  durationMinutes: 15,
  description: "Planning",
  billable: true,
  performedByMemberId: "member",
  version: 1,
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-01T12:00:00Z",
};

const createPurchase = () =>
  hoursApiService.createPurchase("customer", {
    idempotencyKey: "key",
    kind: purchase.kind,
    minutes: 120,
    purchasedOn: purchase.purchasedOn,
    note: "",
  });
const createAllocation = () =>
  hoursApiService.createAllocation("customer", {
    idempotencyKey: "key",
    projectId: "project",
    minutes: 60,
    note: "",
  });
const entryRequest = {
  performedOn: timeEntry.performedOn,
  durationMinutes: 15,
  description: timeEntry.description,
  billable: true,
  taskId: null,
};
const createEntry = () =>
  hoursApiService.createTimeEntry("project", entryRequest);
const updateEntry = () =>
  hoursApiService.updateTimeEntry("entry", { ...entryRequest, version: 1 });
const deleteEntry = () =>
  hoursApiService.deleteTimeEntry("entry", { version: 1 });
const listEntries = () => hoursApiService.listTimeEntries("project", null);

function respond(payload: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(payload), { status })),
  );
}

describe("hoursApiService response validation", () => {
  afterEach(() => vi.unstubAllGlobals());

  const cases = [
    {
      name: "customer balance",
      field: "balance",
      dto: balance,
      payload: { purchase, balance },
      call: createPurchase,
    },
    {
      name: "purchase",
      field: "purchase",
      dto: purchase,
      payload: { purchase, balance },
      call: createPurchase,
    },
    {
      name: "allocation",
      field: "allocation",
      dto: allocation,
      payload: { allocation, balance, project },
      call: createAllocation,
    },
    {
      name: "project balance",
      field: "project",
      dto: project,
      payload: { allocation, balance, project },
      call: createAllocation,
    },
    {
      name: "created time entry",
      field: "timeEntry",
      dto: timeEntry,
      payload: { timeEntry, project },
      call: createEntry,
    },
    {
      name: "updated time entry",
      field: "timeEntry",
      dto: timeEntry,
      payload: { timeEntry, project },
      call: updateEntry,
    },
  ];

  for (const testCase of cases) {
    it(`accepts a complete ${testCase.name}`, async () => {
      respond(testCase.payload);
      await expect(testCase.call()).resolves.toEqual({
        ok: true,
        ...testCase.payload,
      });
    });

    for (const key of Object.keys(testCase.dto)) {
      it(`rejects ${testCase.name} when ${key} is missing or has the wrong type`, async () => {
        const incomplete: Record<string, unknown> = { ...testCase.dto };
        delete incomplete[key];
        for (const dto of [incomplete, { ...testCase.dto, [key]: {} }]) {
          respond({ ...testCase.payload, [testCase.field]: dto });
          await expect(testCase.call()).resolves.toMatchObject({
            ok: false,
            code: HoursErrorCode.Internal,
          });
        }
      });
    }
  }

  it("rejects unknown purchase kinds and sources", async () => {
    for (const key of ["kind", "source"]) {
      respond({ purchase: { ...purchase, [key]: "unknown" }, balance });
      await expect(createPurchase()).resolves.toMatchObject({
        ok: false,
        code: HoursErrorCode.Internal,
      });
    }
  });

  it("accepts deletion without a time entry and rejects malformed deletion responses", async () => {
    respond({ deleted: true, project });
    await expect(deleteEntry()).resolves.toEqual({
      ok: true,
      timeEntry: null,
      project,
    });
    for (const payload of [
      { project },
      { deleted: false, project },
      { deleted: true, project: { projectId: "project" } },
    ]) {
      respond(payload);
      await expect(deleteEntry()).resolves.toEqual({
        ok: false,
        code: HoursErrorCode.Internal,
      });
    }
  });

  it("validates every entry and the cursor without silently replacing invalid values", async () => {
    for (const nextCursor of [null, "cursor"]) {
      respond({ entries: [timeEntry], nextCursor });
      await expect(listEntries()).resolves.toEqual({
        ok: true,
        value: { entries: [timeEntry], nextCursor },
      });
    }
    for (const key of Object.keys(timeEntry)) {
      const incomplete: Record<string, unknown> = { ...timeEntry };
      delete incomplete[key];
      respond({ entries: [timeEntry, incomplete], nextCursor: null });
      await expect(listEntries()).resolves.toEqual({
        ok: false,
        code: HoursErrorCode.Internal,
      });
    }
    for (const payload of [
      { entries: [] },
      { entries: [], nextCursor: 42 },
      { entries: null, nextCursor: null },
    ]) {
      respond(payload);
      await expect(listEntries()).resolves.toEqual({
        ok: false,
        code: HoursErrorCode.Internal,
      });
    }
  });

  it("keeps valid error details and discards incomplete balances", async () => {
    respond(
      { error: HoursErrorCode.Internal, details: { balance, project } },
      422,
    );
    await expect(createAllocation()).resolves.toEqual({
      ok: false,
      code: HoursErrorCode.Internal,
      balance,
      project,
    });
    respond(
      {
        error: HoursErrorCode.Internal,
        details: {
          balance: {
            purchasedMinutes: 120,
            freeMinutes: 60,
            remainingMinutes: 105,
          },
          project: {
            projectId: "project",
            allocatedMinutes: 60,
            releasableMinutes: 45,
          },
        },
      },
      422,
    );
    await expect(createAllocation()).resolves.toEqual({
      ok: false,
      code: HoursErrorCode.Internal,
      balance: null,
      project: null,
    });
    await expect(createPurchase()).resolves.toEqual({
      ok: false,
      code: HoursErrorCode.Internal,
      balance: null,
    });
  });

  it("only returns complete time entries on version conflicts", async () => {
    respond(
      { code: ConcurrencyErrorCode.VersionConflict, current: timeEntry },
      409,
    );
    await expect(updateEntry()).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: timeEntry,
    });
    respond(
      {
        code: ConcurrencyErrorCode.VersionConflict,
        current: { id: "entry", version: 1, durationMinutes: 15 },
      },
      409,
    );
    await expect(updateEntry()).resolves.toEqual({
      ok: false,
      code: HoursErrorCode.Internal,
    });
  });

  it("handles non-object payloads and network failures as internal errors", async () => {
    for (const payload of [null, [], "invalid"]) {
      respond(payload);
      await expect(createEntry()).resolves.toEqual({
        ok: false,
        code: HoursErrorCode.Internal,
      });
    }
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(createEntry()).resolves.toEqual({
      ok: false,
      code: HoursErrorCode.Internal,
    });
  });
});
