import { describe, expect, it } from "vitest";

import { HttpResponseCode } from "@invessiv/common";

describe("HttpResponseCode", () => {
  it("exposes the expected HTTP status constants", () => {
    expect(HttpResponseCode).toEqual({
      Ok: 200,
      Created: 201,
      BadRequest: 400,
      Unauthorized: 401,
      Forbidden: 403,
      NotFound: 404,
      Conflict: 409,
      PayloadTooLarge: 413,
      UnsupportedMediaType: 415,
      TooManyRequests: 429,
      UnprocessableContent: 422,
      ServiceUnavailable: 503,
      InternalServerError: 500,
    });

    expect(new Set(Object.values(HttpResponseCode)).size).toBe(
      Object.keys(HttpResponseCode).length,
    );
  });
});
