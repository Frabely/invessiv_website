import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { GET as page } from "@/app/api/portal/[customerId]/projects/[projectId]/feedback/route";
import { PUT as draft } from "@/app/api/portal/[customerId]/feedback-rounds/[roundId]/draft/route";
import { POST as submit } from "@/app/api/portal/[customerId]/feedback-rounds/[roundId]/submit/route";
import { POST as approve } from "@/app/api/portal/[customerId]/feedback-rounds/[roundId]/approve/route";
import { POST as attach } from "@/app/api/portal/[customerId]/feedback-rounds/[roundId]/items/[itemId]/files/route";
import { DELETE as detach } from "@/app/api/portal/[customerId]/feedback-rounds/[roundId]/items/[itemId]/files/[fileId]/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  authenticateReader: vi.fn(),
  getPortalProjectFeedback: vi.fn(),
  savePortalFeedbackDraft: vi.fn(),
  submitPortalFeedbackRound: vi.fn(),
  approvePortalFeedback: vi.fn(),
  attachPortalFeedbackFile: vi.fn(),
  detachPortalFeedbackFile: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
    authenticateReader: mocks.authenticateReader,
  },
}));
vi.mock(
  "@/server/portal/query-handler/get-portal-project-feedback.query-handler",
  () => ({ getPortalProjectFeedback: mocks.getPortalProjectFeedback }),
);
vi.mock(
  "@/server/portal/command-handler/save-portal-feedback-draft.command-handler",
  () => ({ savePortalFeedbackDraft: mocks.savePortalFeedbackDraft }),
);
vi.mock(
  "@/server/portal/command-handler/submit-portal-feedback-round.command-handler",
  () => ({ submitPortalFeedbackRound: mocks.submitPortalFeedbackRound }),
);
vi.mock(
  "@/server/portal/command-handler/approve-portal-feedback.command-handler",
  () => ({ approvePortalFeedback: mocks.approvePortalFeedback }),
);
vi.mock(
  "@/server/portal/command-handler/attach-portal-feedback-file.command-handler",
  () => ({ attachPortalFeedbackFile: mocks.attachPortalFeedbackFile }),
);
vi.mock(
  "@/server/portal/command-handler/detach-portal-feedback-file.command-handler",
  () => ({ detachPortalFeedbackFile: mocks.detachPortalFeedbackFile }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const ROUND_ID = "33333333-3333-4333-8333-333333333333";
const ITEM_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const context = {
  params: Promise.resolve({
    customerId: CUSTOMER_ID,
    projectId: PROJECT_ID,
    roundId: ROUND_ID,
    itemId: ITEM_ID,
    fileId: FILE_ID,
  }),
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalFeedbackRead,
    Permission.PortalFeedbackSubmit,
  ]),
  projectPermissions: new Map(),
});

const writeRoutes = [
  [draft, HttpMethod.Put],
  [submit, HttpMethod.Post],
  [approve, HttpMethod.Post],
  [attach, HttpMethod.Post],
  [detach, HttpMethod.Delete],
] as const;
const writeHandlers = [
  mocks.savePortalFeedbackDraft,
  mocks.submitPortalFeedbackRound,
  mocks.approvePortalFeedback,
  mocks.attachPortalFeedbackFile,
  mocks.detachPortalFeedbackFile,
];

function request(method: HttpMethod, body?: object | string) {
  return new NextRequest(`http://localhost/api/portal/${CUSTOMER_ID}`, {
    method,
    ...(body !== undefined
      ? {
          headers: { [HttpHeaderName.ContentType]: MediaType.Json },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }
      : {}),
  });
}

function expectPrivate(response: Response) {
  expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
    "private, no-store",
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticateRequest.mockResolvedValue({
    status: PortalAuthStatus.Authorized,
    actor: ACTOR,
  });
  mocks.authenticateReader.mockResolvedValue({
    status: PortalAuthStatus.Authorized,
    reader: ACTOR,
  });
});

describe("portal feedback routes", () => {
  it.each([[page, HttpMethod.Get] as const, ...writeRoutes])(
    "answers a foreign customer like a missing one, privately",
    async (route, method) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      mocks.authenticateReader.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      const response = await route(
        request(method, method === HttpMethod.Get ? undefined : { version: 1 }),
        context,
      );
      expect(response.status).toBe(H.NotFound);
      expectPrivate(response);
    },
  );

  it.each(writeRoutes)(
    "never reaches a write handler without a membership",
    async (route, method) => {
      mocks.authenticateRequest.mockResolvedValue({
        status: PortalAuthStatus.NotMember,
      });
      await route(request(method, { version: 1 }), context);
      for (const handler of writeHandlers)
        expect(handler).not.toHaveBeenCalled();
    },
  );

  it("reads the page through the reader and hides a missing project", async () => {
    mocks.getPortalProjectFeedback.mockResolvedValue(null);
    const response = await page(request(HttpMethod.Get), context);
    expect(response.status).toBe(H.NotFound);
    expect(mocks.getPortalProjectFeedback).toHaveBeenCalledWith(
      ACTOR,
      PROJECT_ID,
    );
  });

  it("returns 409 with the current round on a stale draft", async () => {
    mocks.savePortalFeedbackDraft.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 3,
        current: { id: ROUND_ID },
      },
    });
    const response = await draft(
      request(HttpMethod.Put, { version: 2, items: [] }),
      context,
    );
    expect(response.status).toBe(H.Conflict);
    expect(await response.json()).toMatchObject({
      currentVersion: 3,
      current: { id: ROUND_ID },
    });
    expectPrivate(response);
  });

  it("lets a submit-only actor write without returning round contents", async () => {
    const writer = createPortalActor({
      userId: ACTOR.userId,
      membershipId: ACTOR.membershipId,
      customerId: CUSTOMER_ID,
      personId: ACTOR.personId,
      firstName: null,
      permissions: new Set([
        Permission.PortalAccess,
        Permission.PortalFeedbackSubmit,
      ]),
      projectPermissions: new Map(),
    });
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: writer,
    });
    mocks.savePortalFeedbackDraft.mockResolvedValue({
      ok: true,
      value: { id: ROUND_ID, items: [{ body: "Private feedback" }] },
    });

    const response = await draft(
      request(HttpMethod.Put, { version: 1, items: [] }),
      context,
    );
    expect(response.status).toBe(H.Ok);
    expect(await response.json()).toEqual({ accepted: true });
  });

  it("names the empty items when submitting", async () => {
    mocks.submitPortalFeedbackRound.mockResolvedValue({
      ok: false,
      code: PortalFeedbackErrorCode.ItemTextRequired,
      itemIds: [ITEM_ID],
    });
    const response = await submit(
      request(HttpMethod.Post, { version: 1 }),
      context,
    );
    expect(response.status).toBe(H.UnprocessableContent);
    expect(await response.json()).toMatchObject({
      code: PortalFeedbackErrorCode.ItemTextRequired,
      itemIds: [ITEM_ID],
    });
  });

  it.each([
    [PortalFeedbackErrorCode.Locked, H.Conflict],
    [PortalFeedbackErrorCode.ConfirmationRequired, H.UnprocessableContent],
    [PortalFeedbackErrorCode.ItemsPresent, H.UnprocessableContent],
    [PortalFeedbackErrorCode.Validation, H.BadRequest],
    [PortalFeedbackErrorCode.NotFound, H.NotFound],
  ])("maps approval error %s to %i", async (code, status) => {
    mocks.approvePortalFeedback.mockResolvedValue({ ok: false, code });
    const response = await approve(
      request(HttpMethod.Post, { version: 1, confirmFinal: true }),
      context,
    );
    expect(response.status).toBe(status);
  });

  it("attaches with 201 and passes the ids from the path", async () => {
    mocks.attachPortalFeedbackFile.mockResolvedValue({
      ok: true,
      value: { id: FILE_ID },
    });
    const response = await attach(
      request(HttpMethod.Post, { fileId: FILE_ID }),
      context,
    );
    expect(response.status).toBe(H.Created);
    expect(mocks.attachPortalFeedbackFile).toHaveBeenCalledWith(
      ACTOR,
      { roundId: ROUND_ID, itemId: ITEM_ID },
      { fileId: FILE_ID },
    );
  });

  it("detaches through the verified actor", async () => {
    mocks.detachPortalFeedbackFile.mockResolvedValue({
      ok: true,
      value: { id: FILE_ID },
    });
    const response = await detach(request(HttpMethod.Delete), context);
    expect(response.status).toBe(H.Ok);
    expect(mocks.detachPortalFeedbackFile).toHaveBeenCalledWith(ACTOR, {
      roundId: ROUND_ID,
      itemId: ITEM_ID,
      fileId: FILE_ID,
    });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await draft(request(HttpMethod.Put, "{"), context);
    expect(response.status).toBe(H.BadRequest);
    expect(mocks.savePortalFeedbackDraft).not.toHaveBeenCalled();
  });

  it("turns an unexpected failure into a private 503", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.submitPortalFeedbackRound.mockRejectedValue(new Error("db down"));
    const response = await submit(
      request(HttpMethod.Post, { version: 1 }),
      context,
    );
    expect(response.status).toBe(H.ServiceUnavailable);
    expectPrivate(response);
  });
});
