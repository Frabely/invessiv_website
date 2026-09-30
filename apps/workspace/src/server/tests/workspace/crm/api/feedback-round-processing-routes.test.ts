import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH as setResult } from "@/app/api/workspace/crm/feedback-round-items/[itemId]/result/route";
import { POST as changeStatus } from "@/app/api/workspace/crm/feedback-rounds/[roundId]/status/route";
import { authorizedWorkspaceRequest } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const ROUND_ID = "44444444-4444-4444-8444-444444444444";
const ITEM_ID = "55555555-5555-4555-8555-555555555555";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  changeFeedbackRoundStatus: vi.fn(),
  setFeedbackItemResult: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler",
  () => ({ changeFeedbackRoundStatus: mocks.changeFeedbackRoundStatus }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler",
  () => ({ setFeedbackItemResult: mocks.setFeedbackItemResult }),
);

const roundContext = { params: Promise.resolve({ roundId: ROUND_ID }) };
const itemContext = { params: Promise.resolve({ itemId: ITEM_ID }) };

function request(method: HttpMethod, body: string): NextRequest {
  return new Request("http://localhost/api/workspace/crm/feedback", {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

const statusBody = JSON.stringify({
  version: 1,
  to: FeedbackRoundStatus.InProgress,
});
const resultBody = JSON.stringify({ version: 1, result: "implemented" });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
});

describe("feedback round processing routes", () => {
  it("forbids both writes without projects.write anywhere", async () => {
    mocks.authenticate.mockResolvedValue(
      authorizedWorkspaceRequest([Permission.ProjectsRead]),
    );
    const status = await changeStatus(
      request(HttpMethod.Post, statusBody),
      roundContext,
    );
    const result = await setResult(
      request(HttpMethod.Patch, resultBody),
      itemContext,
    );
    expect(status.status).toBe(HttpResponseCode.Forbidden);
    expect(result.status).toBe(HttpResponseCode.Forbidden);
    expect(mocks.changeFeedbackRoundStatus).not.toHaveBeenCalled();
    expect(mocks.setFeedbackItemResult).not.toHaveBeenCalled();
  });

  it("answers the changed round and item directly, privately", async () => {
    mocks.changeFeedbackRoundStatus.mockResolvedValue({
      ok: true,
      round: { id: ROUND_ID },
    });
    mocks.setFeedbackItemResult.mockResolvedValue({
      ok: true,
      item: { id: ITEM_ID },
    });
    const status = await changeStatus(
      request(HttpMethod.Post, statusBody),
      roundContext,
    );
    const result = await setResult(
      request(HttpMethod.Patch, resultBody),
      itemContext,
    );
    expect(status.status).toBe(HttpResponseCode.Ok);
    expect(await status.json()).toEqual({ id: ROUND_ID });
    expect(await result.json()).toEqual({ id: ITEM_ID });
    expect(status.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
    expect(mocks.changeFeedbackRoundStatus).toHaveBeenCalledWith(
      ROUND_ID,
      { version: 1, to: FeedbackRoundStatus.InProgress },
      expect.anything(),
    );
  });

  it("returns the version conflict body with the current state", async () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 3,
      current: { id: ROUND_ID, version: 3 },
    };
    mocks.changeFeedbackRoundStatus.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    const response = await changeStatus(
      request(HttpMethod.Post, statusBody),
      roundContext,
    );
    expect(response.status).toBe(HttpResponseCode.Conflict);
    expect(await response.json()).toEqual(conflict);
  });

  it.each([
    [FeedbackRoundErrorCode.InvalidTransition, HttpResponseCode.Conflict],
    [
      FeedbackRoundErrorCode.ResultsIncomplete,
      HttpResponseCode.UnprocessableContent,
    ],
    [FeedbackRoundErrorCode.RoundNotFound, HttpResponseCode.NotFound],
    [FeedbackRoundErrorCode.ValidationError, HttpResponseCode.BadRequest],
  ])("maps the status error %s to %i", async (code, status) => {
    mocks.changeFeedbackRoundStatus.mockResolvedValue({
      ok: false,
      code,
      errors: [],
    });
    const response = await changeStatus(
      request(HttpMethod.Post, statusBody),
      roundContext,
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: code });
  });

  it.each([
    [FeedbackRoundErrorCode.RoundLocked, HttpResponseCode.Conflict],
    [FeedbackRoundErrorCode.ItemNotFound, HttpResponseCode.NotFound],
  ])("maps the result error %s to %i", async (code, status) => {
    mocks.setFeedbackItemResult.mockResolvedValue({ ok: false, code });
    const response = await setResult(
      request(HttpMethod.Patch, resultBody),
      itemContext,
    );
    expect(response.status).toBe(status);
  });

  it("rejects a body that is not JSON without calling a command", async () => {
    const status = await changeStatus(
      request(HttpMethod.Post, "{"),
      roundContext,
    );
    const result = await setResult(request(HttpMethod.Patch, "{"), itemContext);
    expect(status.status).toBe(HttpResponseCode.BadRequest);
    expect(result.status).toBe(HttpResponseCode.BadRequest);
    expect(mocks.changeFeedbackRoundStatus).not.toHaveBeenCalled();
    expect(mocks.setFeedbackItemResult).not.toHaveBeenCalled();
  });
});
