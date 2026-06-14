import { describe, expect, it } from "vitest";
import { ProfileFilterState } from "@/common/constants/leads/profile/profile-filter-state";
import type { ProfileFilterSelection } from "@/common/contracts/leads/profile-filter-selection";
import {
  cycleProfileFilter,
  getProfileFilterState,
  parseProfileTypeCsv,
  readProfileFilterSelection,
  serializeProfileFilterList,
} from "./lead-profile-filter";

describe("parseProfileTypeCsv", () => {
  it("parses a comma-separated list of valid profile types", () => {
    expect(parseProfileTypeCsv("website,linkedin")).toEqual([
      "website",
      "linkedin",
    ]);
  });

  it("drops unknown values", () => {
    expect(parseProfileTypeCsv("website,bogus,youtube")).toEqual([
      "website",
      "youtube",
    ]);
  });

  it("de-duplicates while keeping first-seen order", () => {
    expect(parseProfileTypeCsv("youtube,website,youtube")).toEqual([
      "youtube",
      "website",
    ]);
  });

  it("trims whitespace around values", () => {
    expect(parseProfileTypeCsv(" website , linkedin ")).toEqual([
      "website",
      "linkedin",
    ]);
  });

  it("returns an empty array for undefined or empty input", () => {
    expect(parseProfileTypeCsv(undefined)).toEqual([]);
    expect(parseProfileTypeCsv("")).toEqual([]);
    expect(parseProfileTypeCsv(" , ")).toEqual([]);
  });
});

describe("readProfileFilterSelection", () => {
  it("parses include and exclude query strings into typed lists", () => {
    const selection = readProfileFilterSelection("website,linkedin", "youtube");

    expect(selection.include).toEqual(["website", "linkedin"]);
    expect(selection.exclude).toEqual(["youtube"]);
  });

  it("returns empty lists for missing params", () => {
    const selection = readProfileFilterSelection(undefined, undefined);

    expect(selection.include).toEqual([]);
    expect(selection.exclude).toEqual([]);
  });
});

describe("getProfileFilterState", () => {
  const selection: ProfileFilterSelection = {
    include: ["website"],
    exclude: ["youtube"],
  };

  it("reports include state", () => {
    expect(getProfileFilterState(selection, "website")).toBe(
      ProfileFilterState.Include,
    );
  });

  it("reports exclude state", () => {
    expect(getProfileFilterState(selection, "youtube")).toBe(
      ProfileFilterState.Exclude,
    );
  });

  it("reports inactive state", () => {
    expect(getProfileFilterState(selection, "linkedin")).toBe(
      ProfileFilterState.Inactive,
    );
  });
});

describe("cycleProfileFilter", () => {
  it("moves an inactive type into include", () => {
    const next = cycleProfileFilter({ include: [], exclude: [] }, "website");

    expect(next.include).toEqual(["website"]);
    expect(next.exclude).toEqual([]);
  });

  it("moves an include type into exclude", () => {
    const next = cycleProfileFilter(
      { include: ["website"], exclude: [] },
      "website",
    );

    expect(next.include).toEqual([]);
    expect(next.exclude).toEqual(["website"]);
  });

  it("moves an exclude type back to inactive", () => {
    const next = cycleProfileFilter(
      { include: [], exclude: ["website"] },
      "website",
    );

    expect(next.include).toEqual([]);
    expect(next.exclude).toEqual([]);
  });

  it("does not affect other selected types", () => {
    const next = cycleProfileFilter(
      { include: ["linkedin"], exclude: ["youtube"] },
      "website",
    );

    expect(next.include).toEqual(["linkedin", "website"]);
    expect(next.exclude).toEqual(["youtube"]);
  });
});

describe("serializeProfileFilterList", () => {
  it("joins values with commas", () => {
    expect(serializeProfileFilterList(["website", "linkedin"])).toBe(
      "website,linkedin",
    );
  });

  it("returns undefined for an empty list", () => {
    expect(serializeProfileFilterList([])).toBeUndefined();
  });
});
