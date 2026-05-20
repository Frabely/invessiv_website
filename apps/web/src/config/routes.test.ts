import { describe, expect, it } from "vitest";

import { SITE_ROUTES } from "./routes";

describe("site routes", () => {
  it("keeps public web route segments outside domain-specific helpers", () => {
    expect(SITE_ROUTES).toEqual({
      HOME: "/",
      LANDING: "/landing",
      PROJECTS: "/projects",
      IMPRINT: "/imprint",
      PRIVACY: "/privacy",
      TERMS: "/terms",
    });
  });
});
