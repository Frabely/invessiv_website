import { expect, it } from "vitest";
import { PORTAL_E2E_PREFIX } from "./portal-e2e-prefix";
it("keeps the isolated fixture prefix stable", () => {
  expect(PORTAL_E2E_PREFIX).toBe("Invessiv Portal E2E");
});
