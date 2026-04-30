import { describe, expect, it } from "vitest";

import { SITE_ROUTES } from "./routes";

describe("site routes", () => {
  it("keeps global route segments outside domain-specific helpers", () => {
    expect(SITE_ROUTES).toEqual({
      dashboard: "/dashboard",
      signIn: "/sign-in",
      signUp: "/sign-up",
    });
  });
});
