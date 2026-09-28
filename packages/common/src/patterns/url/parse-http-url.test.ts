import { describe, expect, it } from "vitest";
import { isHttpUrl, parseHttpUrl } from "./parse-http-url";

describe("HTTP URL parsing", () => {
  it("accepts absolute HTTP and HTTPS URLs", () => {
    expect(parseHttpUrl("https://example.com/path")?.hostname).toBe(
      "example.com",
    );
    expect(isHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects relative, malformed and non-HTTP URLs", () => {
    for (const value of ["/path", "example.com", "mailto:a@b.de", "https://"])
      expect(parseHttpUrl(value)).toBeNull();
  });
});
