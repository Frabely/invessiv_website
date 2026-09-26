import { describe, expect, it } from "vitest";

import { portalTaskCompleteEndpoint } from "./portal-api-endpoints";

describe("portalTaskCompleteEndpoint", () => {
  it("builds the completion path below the portal api", () => {
    expect(portalTaskCompleteEndpoint("customer-1", "task-1")).toBe(
      "/api/portal/customer-1/tasks/task-1/complete",
    );
  });

  it("encodes both path segments", () => {
    expect(portalTaskCompleteEndpoint("a/b", "c d")).toBe(
      "/api/portal/a%2Fb/tasks/c%20d/complete",
    );
  });
});
