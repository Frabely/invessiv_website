import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { portalTaskCompleteEndpoint } from "@/common/patterns/portal/portal-api-endpoints";
import { portalTasksApiService } from "./portal-tasks-api-service";

afterEach(() => vi.unstubAllGlobals());

describe("portalTasksApiService.completeTask", () => {
  it("posts to the completion endpoint and reports a fresh completion", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ alreadyDone: false }), {
        status: HttpResponseCode.Ok,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      portalTasksApiService.completeTask("customer-1", "task-1"),
    ).resolves.toEqual({ ok: true, alreadyDone: false });
    expect(fetchMock).toHaveBeenCalledWith(
      portalTaskCompleteEndpoint("customer-1", "task-1"),
      { method: HttpMethod.Post },
    );
  });

  it("passes through an idempotent repeat", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ alreadyDone: true }), {
          status: HttpResponseCode.Ok,
        }),
      ),
    );

    await expect(
      portalTasksApiService.completeTask("customer-1", "task-1"),
    ).resolves.toEqual({ ok: true, alreadyDone: true });
  });

  it("maps 404 to not-found and every other failure to unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response("{}", { status: HttpResponseCode.NotFound }),
        )
        .mockResolvedValueOnce(
          new Response("{}", { status: HttpResponseCode.ServiceUnavailable }),
        )
        .mockRejectedValueOnce(new TypeError("network")),
    );

    await expect(
      portalTasksApiService.completeTask("customer-1", "task-1"),
    ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.NotFound });
    await expect(
      portalTasksApiService.completeTask("customer-1", "task-1"),
    ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.Unavailable });
    await expect(
      portalTasksApiService.completeTask("customer-1", "task-1"),
    ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.Unavailable });
  });
});
