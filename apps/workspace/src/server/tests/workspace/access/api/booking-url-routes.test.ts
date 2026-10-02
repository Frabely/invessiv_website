import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { PATCH as updateForeign } from "@/app/api/workspace/members/[id]/booking-url/route";
import {
  GET as getOwn,
  PATCH as updateOwn,
} from "@/app/api/workspace/members/me/booking-url/route";
import {
  authorizedWorkspaceRequest,
  notMemberWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  updateBookingUrl: vi.fn(),
  getOwn: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/access/command-handler/update-member-booking-url.command-handler",
  () => ({ updateMemberBookingUrl: mocks.updateBookingUrl }),
);
vi.mock(
  "@/server/workspace/access/query-handler/get-own-booking-url.query-handler",
  () => ({ getOwnBookingUrl: mocks.getOwn }),
);

const LINK = "https://calendly.com/anna/onboarding";
const MEMBER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  bookingUrl: LINK,
  roles: [],
  version: 4,
  createdAt: "2026-09-13T10:00:00.000Z",
};
const FOREIGN_URL =
  "http://localhost/api/workspace/members/member-1/booking-url";
const OWN_URL = "http://localhost/api/workspace/members/me/booking-url";
const context = { params: Promise.resolve({ id: MEMBER.id }) };
const body = { bookingUrl: LINK, version: 3 };

function patch(url: string, payload: unknown = body): NextRequest {
  return new Request(url, {
    method: HttpMethod.Patch,
    body: JSON.stringify(payload),
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

function get(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

describe("booking link routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
  });

  describe("PATCH /members/[id]/booking-url", () => {
    it("is closed without members.manage, even with every other member permission", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        authorizedWorkspaceRequest([Permission.MembersRead]),
      );

      const response = await updateForeign(patch(FOREIGN_URL), context);

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.updateBookingUrl).not.toHaveBeenCalled();
    });

    it("answers 401 without a session and 404 without a membership", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        unauthenticatedWorkspaceRequest(),
      );
      expect((await updateForeign(patch(FOREIGN_URL), context)).status).toBe(
        HttpResponseCode.Unauthorized,
      );
      mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
      expect((await updateForeign(patch(FOREIGN_URL), context)).status).toBe(
        HttpResponseCode.NotFound,
      );
      expect(mocks.updateBookingUrl).not.toHaveBeenCalled();
    });

    it("writes the addressed member and returns it", async () => {
      mocks.updateBookingUrl.mockResolvedValue({ ok: true, member: MEMBER });

      const response = await updateForeign(patch(FOREIGN_URL), context);

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ member: MEMBER });
      expect(mocks.updateBookingUrl).toHaveBeenCalledWith(
        MEMBER.id,
        body,
        expect.objectContaining({ workspaceMemberId: "member-actor-uuid" }),
      );
    });

    it("maps validation, a missing member and a version conflict", async () => {
      mocks.updateBookingUrl.mockResolvedValueOnce({
        ok: false,
        code: WorkspaceMemberErrorCode.ValidationError,
        errors: [],
      });
      expect((await updateForeign(patch(FOREIGN_URL), context)).status).toBe(
        HttpResponseCode.BadRequest,
      );

      mocks.updateBookingUrl.mockResolvedValueOnce({
        ok: false,
        code: WorkspaceMemberErrorCode.MemberNotFound,
      });
      expect((await updateForeign(patch(FOREIGN_URL), context)).status).toBe(
        HttpResponseCode.NotFound,
      );

      const conflict = {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: MEMBER,
      };
      mocks.updateBookingUrl.mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });
      const stale = await updateForeign(patch(FOREIGN_URL), context);
      expect(stale.status).toBe(HttpResponseCode.Conflict);
      expect(await stale.json()).toEqual(conflict);
    });
  });

  describe("/members/me/booking-url", () => {
    it("GET returns only the own link and version, without any permission", async () => {
      mocks.authenticate.mockResolvedValueOnce(authorizedWorkspaceRequest([]));
      mocks.getOwn.mockResolvedValue({ bookingUrl: LINK, version: 4 });

      const response = await getOwn(get(OWN_URL));

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ bookingUrl: LINK, version: 4 });
    });

    it("GET and PATCH answer 401 without a session and 404 without a membership", async () => {
      for (const call of [
        () => getOwn(get(OWN_URL)),
        () => updateOwn(patch(OWN_URL)),
      ]) {
        mocks.authenticate.mockResolvedValueOnce(
          unauthenticatedWorkspaceRequest(),
        );
        expect((await call()).status).toBe(HttpResponseCode.Unauthorized);
        mocks.authenticate.mockResolvedValueOnce(notMemberWorkspaceRequest());
        expect((await call()).status).toBe(HttpResponseCode.NotFound);
      }
      expect(mocks.getOwn).not.toHaveBeenCalled();
      expect(mocks.updateBookingUrl).not.toHaveBeenCalled();
    });

    it("PATCH always addresses the member of the session, whatever the body says", async () => {
      mocks.authenticate.mockResolvedValueOnce(authorizedWorkspaceRequest([]));
      mocks.updateBookingUrl.mockResolvedValue({ ok: true, member: MEMBER });

      const response = await updateOwn(
        patch(OWN_URL, { ...body, memberId: "someone-else", id: "other" }),
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(mocks.updateBookingUrl.mock.calls[0]![0]).toBe(
        "member-actor-uuid",
      );
      // Nothing of the member beyond link and version leaves through this endpoint.
      expect(await response.json()).toEqual({ bookingUrl: LINK, version: 4 });
    });

    it("PATCH narrows a version conflict to the own link as well", async () => {
      mocks.updateBookingUrl.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict: {
          code: ConcurrencyErrorCode.VersionConflict,
          currentVersion: 4,
          current: MEMBER,
        },
      });

      const response = await updateOwn(patch(OWN_URL));

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toEqual({
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: { bookingUrl: LINK, version: 4 },
      });
    });

    it("PATCH answers 400 for malformed JSON and a rejected link, 500 for a crash", async () => {
      const malformed = await updateOwn(
        new Request(OWN_URL, {
          method: HttpMethod.Patch,
          body: "{",
        }) as unknown as NextRequest,
      );
      expect(malformed.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.updateBookingUrl).not.toHaveBeenCalled();

      mocks.updateBookingUrl.mockResolvedValueOnce({
        ok: false,
        code: WorkspaceMemberErrorCode.ValidationError,
        errors: [],
      });
      expect((await updateOwn(patch(OWN_URL))).status).toBe(
        HttpResponseCode.BadRequest,
      );

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      mocks.updateBookingUrl.mockRejectedValueOnce(new Error("boom"));
      expect((await updateOwn(patch(OWN_URL))).status).toBe(
        HttpResponseCode.InternalServerError,
      );
      consoleError.mockRestore();
    });
  });
});
