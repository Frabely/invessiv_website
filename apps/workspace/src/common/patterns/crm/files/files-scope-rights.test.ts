import { describe, expect, it } from "vitest";
import { filesScopeRights } from "./files-scope-rights";

const projects = [
  { id: "p1", title: "Website" },
  { id: "p2", title: "Logo" },
];

describe("filesScopeRights", () => {
  it("keeps customer-wide entries closed to project grants", () => {
    const rights = { customerWide: false, projectIds: ["p1"] };
    expect(filesScopeRights.allows(rights, null)).toBe(false);
    expect(filesScopeRights.allows(rights, "p1")).toBe(true);
    expect(filesScopeRights.allows(rights, "p2")).toBe(false);
    expect(filesScopeRights.any(rights)).toBe(true);
    expect(filesScopeRights.any({ customerWide: false, projectIds: [] })).toBe(
      false,
    );
  });

  it("lists writable targets with customer-wide first", () => {
    expect(
      filesScopeRights.targets(
        { customerWide: true, projectIds: ["p2"] },
        projects,
      ),
    ).toEqual([null, "p2"]);
    expect(
      filesScopeRights.targets(
        { customerWide: false, projectIds: [] },
        projects,
      ),
    ).toEqual([]);
  });
});
