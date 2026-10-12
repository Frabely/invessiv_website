import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { apiErrorResponse, privateApiResponse } from "./api-error-response";

vi.mock("server-only", () => ({}));
afterEach(() => vi.restoreAllMocks());
describe("private API error response", () => {
  it("preserves the domain response and private caching without logging customer details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await privateApiResponse(
      async () => {
        throw new Error("private customer text");
      },
      "[test] request failed",
      () =>
        apiErrorResponse("internal", {
          status: HttpResponseCode.InternalServerError,
          message: "Unavailable.",
        }),
    );
    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    expect(await response.json()).toEqual({
      code: "internal",
      message: "Unavailable.",
    });
    expect(response.headers.get(HttpHeaderName.CacheControl)).toBe(
      "private, no-store",
    );
    expect(log).toHaveBeenCalledExactlyOnceWith("[test] request failed", {
      errorName: "Error",
    });
  });
});
