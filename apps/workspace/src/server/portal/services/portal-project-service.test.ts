import { describe, expect, it, vi } from "vitest";

import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { portalProjectService } from "./portal-project-service";

vi.mock("server-only", () => ({}));

describe("portalProjectService.toCurrent", () => {
  it("keeps current projects in status order and preserves newest-first order within each status", () => {
    const summaries = [
      { id: "planned-new", status: ProjectStatus.Planned },
      { id: "active-new", status: ProjectStatus.Active },
      { id: "completed", status: ProjectStatus.Completed },
      { id: "paused", status: ProjectStatus.Paused },
      { id: "active-old", status: ProjectStatus.Active },
    ];

    expect(
      portalProjectService.toCurrent(summaries).map((row) => row.id),
    ).toEqual(["active-new", "active-old", "paused", "planned-new"]);
    expect(summaries.map((row) => row.id)).toEqual([
      "planned-new",
      "active-new",
      "completed",
      "paused",
      "active-old",
    ]);
  });
});
