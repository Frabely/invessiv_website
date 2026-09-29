import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { GET as detail } from "@/app/api/workspace/crm/feedback-rounds/[roundId]/route";
import {
  GET as list,
  POST as handOver,
} from "@/app/api/workspace/crm/projects/[projectId]/feedback-rounds/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const ROUND_ID = "44444444-4444-4444-8444-444444444444";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listProjectFeedbackRounds: vi.fn(),
  handOverFeedbackRound: vi.fn(),
  getFeedbackRound: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-project-feedback-rounds.query-handler",
  () => ({ listProjectFeedbackRounds: mocks.listProjectFeedbackRounds }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler",
  () => ({ handOverFeedbackRound: mocks.handOverFeedbackRound }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-feedback-round.query-handler",
  () => ({ getFeedbackRound: mocks.getFeedbackRound }),
);

const LIST_URL = `http://localhost/api/workspace/crm/projects/${PROJECT_ID}/feedback-rounds`;
const listContext = { params: Promise.resolve({ projectId: PROJECT_ID }) };
const detailContext = { params: Promise.resolve({ roundId: ROUND_ID }) };

function request(method: HttpMethod, body?: string): NextRequest {
  return new Request(LIST_URL, {
    method,
    ...(body !== undefined
      ? { body, headers: { [HttpHeaderName.ContentType]: MediaType.Json } }
      : {}),
  }) as unknown as NextRequest;
}

function expectPrivate(response: Response) {
  expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
    "private, no-store",
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
});

describe("feedback round routes", () => {
  it("rejects anonymous requests before any handler runs, privately", async () => {
    mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());
    const response = await list(request(HttpMethod.Get), listContext);
    expect(response.status).toBe(HttpResponseCode.Unauthorized);
    expectPrivate(response);
    expect(mocks.listProjectFeedbackRounds).not.toHaveBeenCalled();
  });

  it("forbids the handover without projects.write anywhere", async () => {
    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.ProjectsRead]),
    );
    const response = await handOver(
      request(HttpMethod.Post, JSON.stringify({ areaOptions: [] })),
      listContext,
    );
    expect(response.status).toBe(HttpResponseCode.Forbidden);
    expect(mocks.handOverFeedbackRound).not.toHaveBeenCalled();
  });

  it("answers an unreachable project and round with 404", async () => {
    mocks.listProjectFeedbackRounds.mockResolvedValue(null);
    mocks.getFeedbackRound.mockResolvedValue(null);
    const listed = await list(request(HttpMethod.Get), listContext);
    const read = await detail(request(HttpMethod.Get), detailContext);
    expect(listed.status).toBe(HttpResponseCode.NotFound);
    expect(read.status).toBe(HttpResponseCode.NotFound);
    expect(await read.json()).toMatchObject({
      error: FeedbackRoundErrorCode.RoundNotFound,
    });
    expectPrivate(read);
  });

  it("creates a round with 201", async () => {
    mocks.handOverFeedbackRound.mockResolvedValue({
      ok: true,
      round: { id: ROUND_ID },
    });
    const response = await handOver(
      request(HttpMethod.Post, JSON.stringify({ areaOptions: ["Start"] })),
      listContext,
    );
    expect(response.status).toBe(HttpResponseCode.Created);
    expect(await response.json()).toEqual({ id: ROUND_ID });
    expectPrivate(response);
  });

  it("returns the running round on a second handover", async () => {
    mocks.handOverFeedbackRound.mockResolvedValue({
      ok: false,
      code: FeedbackRoundErrorCode.RoundAlreadyActive,
      activeRound: { id: ROUND_ID, roundNumber: 1 },
    });
    const response = await handOver(
      request(HttpMethod.Post, JSON.stringify({ areaOptions: [] })),
      listContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toMatchObject({
      error: FeedbackRoundErrorCode.RoundAlreadyActive,
      activeRound: { id: ROUND_ID },
    });
  });

  it.each([
    [FeedbackRoundErrorCode.ProjectNotEligible, HttpResponseCode.Conflict],
    [FeedbackRoundErrorCode.QuotaExhausted, HttpResponseCode.Conflict],
    [FeedbackRoundErrorCode.ProjectNotFound, HttpResponseCode.NotFound],
    [FeedbackRoundErrorCode.ValidationError, HttpResponseCode.BadRequest],
  ])("maps %s to %i", async (code, status) => {
    mocks.handOverFeedbackRound.mockResolvedValue({
      ok: false,
      code,
      errors: [],
    });
    const response = await handOver(
      request(HttpMethod.Post, JSON.stringify({ areaOptions: [] })),
      listContext,
    );
    expect(response.status).toBe(status);
  });

  it("rejects a body that is not JSON without calling the command", async () => {
    const response = await handOver(request(HttpMethod.Post, "{"), listContext);
    expect(response.status).toBe(HttpResponseCode.BadRequest);
    expect(mocks.handOverFeedbackRound).not.toHaveBeenCalled();
  });

  it("hides unexpected failures behind a private 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getFeedbackRound.mockRejectedValue(new Error("db down"));
    const response = await detail(request(HttpMethod.Get), detailContext);
    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    expect(await response.json()).toMatchObject({
      error: FeedbackRoundErrorCode.Internal,
    });
    expectPrivate(response);
  });
});
