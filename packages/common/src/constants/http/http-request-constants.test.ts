import { describe, expect, it } from "vitest";

import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import {
  HTTP_METHOD_VALUES,
  HttpMethod,
} from "@invessiv/common/constants/http/http-methods";
import { MediaType } from "@invessiv/common/constants/http/media-types";

describe("HttpMethod", () => {
  it("contains the exact methods without duplicates", () => {
    expect(HTTP_METHOD_VALUES).toEqual([
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ]);
    expect([...HTTP_METHOD_VALUES]).toEqual(Object.values(HttpMethod));
    expect(new Set(HTTP_METHOD_VALUES).size).toBe(HTTP_METHOD_VALUES.length);
  });
});

describe("HttpHeaderName and MediaType", () => {
  it("expose the exact header and media type values", () => {
    expect(HttpHeaderName).toEqual({ ContentType: "Content-Type" });
    expect(MediaType).toEqual({ Json: "application/json" });
  });
});
