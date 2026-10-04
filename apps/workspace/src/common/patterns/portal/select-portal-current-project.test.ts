import { describe, expect, it } from "vitest";

import { selectPortalCurrentProject } from "./select-portal-current-project";

const projects = [{ id: "first" }, { id: "second" }];

describe("selectPortalCurrentProject", () => {
  it("selects the requested project", () => {
    expect(selectPortalCurrentProject(projects, "second")).toEqual({
      id: "second",
    });
  });

  it("falls back to the first project for an unknown or missing id", () => {
    expect(selectPortalCurrentProject(projects, "foreign")).toEqual({
      id: "first",
    });
    expect(selectPortalCurrentProject(projects, null)).toEqual({ id: "first" });
    expect(selectPortalCurrentProject(projects, undefined)).toEqual({
      id: "first",
    });
  });

  it("selects nothing without current projects", () => {
    expect(selectPortalCurrentProject([], "first")).toBeNull();
  });
});
