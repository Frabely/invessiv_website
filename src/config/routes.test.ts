import { describe, expect, it } from "vitest";

import { SITE_ROUTES } from "./routes";

describe("site routes", () => {
  it("keeps global route segments outside domain-specific helpers", () => {
    expect(SITE_ROUTES).toEqual({
      WORKSPACE: "/workspace",
      SIGN_IN: "/sign-in",
      SIGN_UP: "/sign-up",
    });
  });
});
