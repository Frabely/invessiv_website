import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";

const ROUND_ID = "55555555-5555-4555-8555-555555555555";

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("feedbackRoundsApiService.markRead", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to the round's read endpoint and reports a fresh stamp", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, { marked: true });

    await expect(feedbackRoundsApiService.markRead(ROUND_ID)).resolves.toBe(
      true,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/workspace/crm/feedback-rounds/${ROUND_ID}/read`,
      expect.objectContaining({ method: HttpMethod.Post }),
    );
  });

  it("answers false for an earlier stamp, an error and a network failure", async () => {
    respondWith(HttpResponseCode.Ok, { marked: false });
    await expect(feedbackRoundsApiService.markRead(ROUND_ID)).resolves.toBe(
      false,
    );

    respondWith(HttpResponseCode.NotFound, {
      error: "FEEDBACK_ROUND_NOT_FOUND",
    });
    await expect(feedbackRoundsApiService.markRead(ROUND_ID)).resolves.toBe(
      false,
    );

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(feedbackRoundsApiService.markRead(ROUND_ID)).resolves.toBe(
      false,
    );
  });
});
