import { describe, expect, it } from "vitest";
import { UrlSearchEvent } from "./url-search-events";

describe("URL search events", () => {
  it("names the shared notification for local URL writes", () => {
    expect(UrlSearchEvent).toEqual({ Changed: "workspace:url-search-changed" });
    expect(new Set(Object.values(UrlSearchEvent)).size).toBe(
      Object.values(UrlSearchEvent).length,
    );
  });
});
