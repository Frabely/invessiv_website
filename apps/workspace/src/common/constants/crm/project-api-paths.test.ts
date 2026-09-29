import { describe, expect, it } from "vitest";

import { ProjectApiPath } from "./project-api-paths";

describe("ProjectApiPath", () => {
  it("contains the exact path segments without duplicates", () => {
    expect(ProjectApiPath).toEqual({ Projects: "projects" });
    const values = Object.values(ProjectApiPath);
    expect(new Set(values).size).toBe(values.length);
  });
});
