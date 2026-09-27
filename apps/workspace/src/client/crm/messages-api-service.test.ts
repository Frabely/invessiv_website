import { afterEach, describe, expect, it, vi } from "vitest";

import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { messagesApiService } from "@/client/crm/messages-api-service";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const CLIENT_MESSAGE_ID = "33333333-3333-4333-8333-333333333333";
const MESSAGE = {
  id: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-09-26T10:00:00.000Z",
};

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("messagesApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads an older page through the cursor parameter", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, {
      conversation: { id: "c", messages: [] },
    });

    const result = await messagesApiService.getConversation(CUSTOMER_ID, "abc");

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/workspace/crm/customers/${CUSTOMER_ID}/conversation?cursor=abc`,
      { method: HttpMethod.Get },
    );
  });

  it("posts the trimmed body and returns the stored message", async () => {
    const fetchMock = respondWith(HttpResponseCode.Created, {
      message: MESSAGE,
    });

    const result = await messagesApiService.sendMessage(CUSTOMER_ID, {
      body: "Hallo",
      clientMessageId: CLIENT_MESSAGE_ID,
    });

    expect(result).toEqual({ ok: true, value: MESSAGE });
    expect(fetchMock.mock.calls[0][0]).toBe(
      `/api/workspace/crm/customers/${CUSTOMER_ID}/conversation/messages`,
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: HttpMethod.Post,
      body: JSON.stringify({
        body: "Hallo",
        clientMessageId: CLIENT_MESSAGE_ID,
      }),
    });
  });

  it("reads the error code of chat routes and falls back to internal", async () => {
    respondWith(HttpResponseCode.Forbidden, {
      code: MessageErrorCode.Forbidden,
      message: "x",
    });
    expect(await messagesApiService.redactMessage(MESSAGE.id)).toEqual({
      ok: false,
      code: MessageErrorCode.Forbidden,
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await messagesApiService.markRead(CUSTOMER_ID, MESSAGE.id)).toEqual({
      ok: false,
      code: MessageErrorCode.Internal,
    });
  });

  it("returns the current owner on a version conflict", async () => {
    const current = { ownerMemberId: "member-2", version: 4 };
    respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 4,
      current,
    });

    expect(
      await messagesApiService.updateOwner(CUSTOMER_ID, {
        ownerMemberId: "33333333-3333-4333-8333-333333333333",
        version: 3,
      }),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
  });
});
