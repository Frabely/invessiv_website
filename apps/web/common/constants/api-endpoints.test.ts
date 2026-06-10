import { describe, expect, it } from "vitest";

import { WebApiEndpoint } from "@/common/constants";

describe("WebApiEndpoint", () => {
  it("exposes the exact web api endpoints", () => {
    expect(WebApiEndpoint).toEqual({
      ContactSubmit: "/api/public/contact",
      LinkedInPostGenerate: "/api/public/generator/linkedin-post",
    });
  });

  it("has no duplicate endpoint values", () => {
    const values = Object.values(WebApiEndpoint);
    expect(new Set(values).size).toBe(values.length);
  });
});
