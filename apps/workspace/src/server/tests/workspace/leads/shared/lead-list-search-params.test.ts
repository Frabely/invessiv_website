import { describe, expect, it } from "vitest";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import {
  hasActiveLeadFilters,
  parseLeadListFilters,
} from "@/server/workspace/leads/shared/lead-list-search-params";

describe("parseLeadListFilters - profile filter", () => {
  it("parses a comma-separated include list into an array", () => {
    const filters = parseLeadListFilters({
      [LeadListQueryParam.ProfileInclude]: "website,linkedin",
    });

    expect(filters.profile_include).toEqual(["website", "linkedin"]);
  });

  it("parses a single exclude value", () => {
    const filters = parseLeadListFilters({
      [LeadListQueryParam.ProfileExclude]: "instagram",
    });

    expect(filters.profile_exclude).toEqual(["instagram"]);
  });

  it("drops unknown profile values", () => {
    const filters = parseLeadListFilters({
      [LeadListQueryParam.ProfileInclude]: "website,bogus,youtube",
    });

    expect(filters.profile_include).toEqual(["website", "youtube"]);
  });

  it("de-duplicates repeated values", () => {
    const filters = parseLeadListFilters({
      [LeadListQueryParam.ProfileInclude]: "website,website,linkedin",
    });

    expect(filters.profile_include).toEqual(["website", "linkedin"]);
  });

  it("omits the key when only invalid or empty values are given", () => {
    const filters = parseLeadListFilters({
      [LeadListQueryParam.ProfileInclude]: " , ,bogus",
    });

    expect(filters.profile_include).toBeUndefined();
  });

  it("flags profile filters as active", () => {
    expect(hasActiveLeadFilters({ profile_include: ["website"] })).toBe(true);
    expect(hasActiveLeadFilters({ profile_exclude: ["youtube"] })).toBe(true);
    expect(hasActiveLeadFilters({})).toBe(false);
  });
});
