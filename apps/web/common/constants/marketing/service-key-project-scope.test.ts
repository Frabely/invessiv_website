import { describe, expect, it } from "vitest";
import {
  SERVICE_KEY_PROJECT_SCOPE,
  toContactProjectScope,
} from "@/common/constants/marketing/service-key-project-scope";

describe("SERVICE_KEY_PROJECT_SCOPE", () => {
  it("maps every primary service card to a project scope", () => {
    expect(SERVICE_KEY_PROJECT_SCOPE).toEqual({
      landing: "landing_page",
      upgrade: "compact_website",
      web: "business_website",
    });
  });
});

describe("toContactProjectScope", () => {
  it("resolves a known service key", () => {
    expect(toContactProjectScope("upgrade")).toBe("compact_website");
  });

  it("returns null for keys without a project scope", () => {
    expect(toContactProjectScope("maintenance")).toBeNull();
    expect(toContactProjectScope("process")).toBeNull();
    expect(toContactProjectScope(undefined)).toBeNull();
  });
});
