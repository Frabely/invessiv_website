import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalHoursErrorCode } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import type { PortalTimeEntryPageDto } from "@invessiv/common/contracts/portal/portal-time-entry-page.dto";
import { portalHoursApiService } from "./portal-hours-api-service";

afterEach(() => vi.unstubAllGlobals());

const PAGE: PortalTimeEntryPageDto = {
  entries: [
    {
      id: "entry-1",
      projectId: null,
      performedOn: "2026-10-01",
      durationMinutes: 60,
      description: "Umbau Hero-Section",
      billable: true,
      taskTitle: null,
    },
  ],
  nextCursor: "next",
};

function respond(payload: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(payload), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("portalHoursApiService.listTimeEntries", () => {
  it("reads a page and sends neither filter nor cursor by default", async () => {
    const fetchMock = respond(PAGE);

    expect(await portalHoursApiService.listTimeEntries("c-1", {})).toEqual({
      ok: true,
      value: PAGE,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/portal/c-1/hours/entries");
  });

  it("sends the project filter and the cursor as query parameters", async () => {
    const fetchMock = respond(PAGE);

    await portalHoursApiService.listTimeEntries("c-1", {
      projectId: "p 1",
      cursor: "2026-10-01~x",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/portal/c-1/hours/entries?projectId=p+1&cursor=2026-10-01%7Ex",
    );
  });

  it("passes the error code of a rejected request on", async () => {
    respond({ code: PortalHoursErrorCode.NotFound }, 404);

    expect(await portalHoursApiService.listTimeEntries("c-1", {})).toEqual({
      ok: false,
      code: PortalHoursErrorCode.NotFound,
    });
  });

  it("treats an answer of an unexpected shape as a failure", async () => {
    respond({ entries: [{ id: "entry-1" }], nextCursor: null });

    expect(await portalHoursApiService.listTimeEntries("c-1", {})).toEqual({
      ok: false,
      code: PortalHoursErrorCode.Internal,
    });
  });
});
