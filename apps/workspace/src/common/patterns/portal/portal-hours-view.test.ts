import { describe, expect, it } from "vitest";
import { portalHoursView } from "./portal-hours-view";

const PROJECTS = ["project-a", "project-b"];

describe("portalHoursView.projectOf", () => {
  it("prefers a known project from the URL over the dashboard", () => {
    expect(portalHoursView.projectOf("project-b", PROJECTS, "project-a")).toBe(
      "project-b",
    );
  });

  it("shows every project for `all`, even with a dashboard project", () => {
    expect(portalHoursView.projectOf("all", PROJECTS, "project-a")).toBeNull();
  });

  it("falls back to the dashboard project when it is visible", () => {
    expect(portalHoursView.projectOf(null, PROJECTS, "project-a")).toBe(
      "project-a",
    );
    expect(portalHoursView.projectOf("foreign", PROJECTS, "project-a")).toBe(
      "project-a",
    );
  });

  it("shows every project when neither names a visible project", () => {
    expect(portalHoursView.projectOf(null, PROJECTS, "project-x")).toBeNull();
    expect(portalHoursView.projectOf("foreign", PROJECTS, null)).toBeNull();
  });
});

describe("portalHoursView.tabsFor", () => {
  it("offers entries and purchases", () => {
    expect(portalHoursView.tabsFor(true)).toEqual(["entries", "purchases"]);
  });

  it("drops the entries without their read right", () => {
    expect(portalHoursView.tabsFor(false)).toEqual(["purchases"]);
  });
});
