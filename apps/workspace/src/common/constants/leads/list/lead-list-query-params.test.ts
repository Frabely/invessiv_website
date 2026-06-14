import { describe, expect, it } from "vitest";
import {
  LEAD_LIST_QUERY_PARAM_VALUES,
  LeadListQueryParam,
} from "@/common/constants/leads/list/lead-list-query-params";

describe("LeadListQueryParam", () => {
  it("contains the expected query param keys without duplicates", () => {
    expect(LEAD_LIST_QUERY_PARAM_VALUES).toEqual([
      LeadListQueryParam.Category,
      LeadListQueryParam.DateFrom,
      LeadListQueryParam.DateTo,
      LeadListQueryParam.Mode,
      LeadListQueryParam.TargetLeadId,
      LeadListQueryParam.Page,
      LeadListQueryParam.ProfileInclude,
      LeadListQueryParam.ProfileExclude,
      LeadListQueryParam.ScoreMin,
      LeadListQueryParam.Search,
      LeadListQueryParam.Selected,
      LeadListQueryParam.Sort,
      LeadListQueryParam.Source,
      LeadListQueryParam.Status,
    ]);
    expect(new Set(LEAD_LIST_QUERY_PARAM_VALUES).size).toBe(
      LEAD_LIST_QUERY_PARAM_VALUES.length,
    );
  });
});
