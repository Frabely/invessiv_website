import { describe, expect, it } from "vitest";
import { ProjectStatus } from "../crm/project-statuses";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "./portal-visible-project-statuses";

describe("PORTAL_VISIBLE_PROJECT_STATUS_VALUES", () => {
  it("never releases archived or cancelled projects to the portal", () => {
    expect(PORTAL_VISIBLE_PROJECT_STATUS_VALUES).not.toContain(
      ProjectStatus.Archived,
    );
    expect(PORTAL_VISIBLE_PROJECT_STATUS_VALUES).not.toContain(
      ProjectStatus.Cancelled,
    );
  });
});
