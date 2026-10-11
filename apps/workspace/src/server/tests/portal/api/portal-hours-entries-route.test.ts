import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalHoursErrorCode } from "@invessiv/common/constants/portal/portal-hours-error-codes";
import { GET } from "@/app/api/portal/[customerId]/hours/entries/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateReader: vi.fn(),
  listPortalTimeEntries: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateReader: mocks.authenticateReader,
  },
}));
vi.mock(
  "@/server/portal/query-handler/list-portal-time-entries.query-handler",
  () => ({ listPortalTimeEntries: mocks.listPortalTimeEntries }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const PAGE = { entries: [], nextCursor: null };
const READER = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalAccess,
    Permission.PortalHoursEntriesRead,
  ]),
  projectPermissions: new Map(),
});

function get(search = "", customerId = CUSTOMER_ID) {
  const request = {
    nextUrl: new URL(`https://portal.test/api?${search}`),
  } as unknown as NextRequest;
  return GET(request, { params: Promise.resolve({ customerId }) });
}

describe("GET /api/portal/[customerId]/hours/entries", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticateReader.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      reader: READER,
    });
    mocks.listPortalTimeEntries.mockResolvedValue({ ok: true, page: PAGE });
  });

  it("lists through the verified reader and keeps the answer private", async () => {
    const response = await get(
      `projectId=${PROJECT_ID}&cursor=abc&customerId=other`,
      CUSTOMER_ID.toUpperCase(),
    );

    expect(response.status).toBe(HttpResponseCode.Ok);
    await expect(response.json()).resolves.toEqual(PAGE);
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
    expect(mocks.authenticateReader).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(mocks.listPortalTimeEntries).toHaveBeenCalledWith(READER, {
      projectId: PROJECT_ID,
      cursor: "abc",
    });
  });

  it("passes no filter when the query is empty", async () => {
    await get();

    expect(mocks.listPortalTimeEntries).toHaveBeenCalledWith(READER, {
      projectId: undefined,
      cursor: undefined,
    });
  });

  it.each([
    [PortalHoursErrorCode.NotFound, HttpResponseCode.NotFound],
    [PortalHoursErrorCode.Validation, HttpResponseCode.UnprocessableContent],
  ])("maps %s to %i", async (code, status) => {
    mocks.listPortalTimeEntries.mockResolvedValue({ ok: false, code });

    const response = await get();

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("answers 404 without a membership and never runs the query", async () => {
    mocks.authenticateReader.mockResolvedValue({
      status: PortalAuthStatus.NotMember,
    });

    const response = await get();

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(mocks.listPortalTimeEntries).not.toHaveBeenCalled();
  });

  it("answers 500 without details when the query throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.listPortalTimeEntries.mockRejectedValue(new Error("select failed"));

    const response = await get();

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    await expect(response.json()).resolves.toEqual({
      code: PortalHoursErrorCode.Internal,
      message: "Hours are temporarily unavailable.",
    });
  });
});
