import { describe, expect, it } from "vitest";
import { LEAD_SOURCES_VALUES } from "@/common/constants/leads/sources/lead-sources";
import { LEAD_ACTIVITY_TYPES } from "@/common/constants/leads/activity/lead-activity-types";
import { LEAD_ACTOR_TYPE_VALUES } from "@/common/constants/leads/activity/lead-actor-types";
import { LEAD_SOCIAL_PLATFORMS_VALUES } from "@/common/constants/leads/social/lead-social-platforms";
import { LEAD_SORT_VALUES } from "@/common/constants/leads/list/lead-sort";
import {
  LEAD_DETAIL_ENTRY_KIND_VALUES,
  LeadDetailEntryKind,
} from "@/common/constants/leads/activity/lead-detail-entry-kinds";
import {
  LEAD_BADGE_KIND_VALUES,
  LeadBadgeKind,
} from "@/common/constants/leads/badges/lead-badge-kinds";
import {
  LEAD_BADGE_TONE_VALUES,
  LeadBadgeTone,
} from "@/common/constants/leads/badges/lead-badge-tones";
import {
  LEAD_LIST_QUERY_PARAM_VALUES,
  LeadListQueryParam,
} from "@/common/constants/leads/list/lead-list-query-params";
import { CONTACT_LEAD_STATUS_ALL } from "@/common/constants/contact/contact-lead-statuses";
import {
  LEAD_LIST_MAX_PAGE_SIZE,
  LEAD_LIST_PAGE_SIZE,
} from "@/common/constants/leads/list/lead-list-defaults";
import {
  LEAD_ERROR_CODE_VALUES,
  LEAD_VALIDATION_ISSUE_CODE_VALUES,
  LeadErrorCode,
  LeadValidationIssueCode,
} from "@/common/constants/leads/errors/lead-error-codes";
import {
  LEAD_VALIDATION_MESSAGE_CODE_VALUES,
  LeadValidationMessageCode,
} from "@/common/constants/leads/forms/lead-form-validation";

describe("LEAD_SOURCES", () => {
  it("contains exactly webform, manual, import", () => {
    expect(LEAD_SOURCES_VALUES).toEqual(["webform", "manual", "import"]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_SOURCES_VALUES).size).toBe(LEAD_SOURCES_VALUES.length);
  });
});

describe("LEAD_ACTIVITY_TYPES", () => {
  it("contains exactly the four activity types", () => {
    expect(LEAD_ACTIVITY_TYPES).toEqual([
      "note",
      "status_change",
      "inbound_submission",
      "import",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_ACTIVITY_TYPES).size).toBe(LEAD_ACTIVITY_TYPES.length);
  });
});

describe("LEAD_ACTOR_TYPES", () => {
  it("contains exactly system, user", () => {
    expect(LEAD_ACTOR_TYPE_VALUES).toEqual(["system", "user"]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_ACTOR_TYPE_VALUES).size).toBe(
      LEAD_ACTOR_TYPE_VALUES.length,
    );
  });
});

describe("CONTACT_LEAD_STATUS_ALL", () => {
  it("exposes the all filter value", () => {
    expect(CONTACT_LEAD_STATUS_ALL).toBe("all");
  });
});

describe("LEAD_SOCIAL_PLATFORMS", () => {
  it("contains exactly linkedin, instagram, youtube", () => {
    expect(LEAD_SOCIAL_PLATFORMS_VALUES).toEqual([
      "linkedin",
      "instagram",
      "youtube",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_SOCIAL_PLATFORMS_VALUES).size).toBe(
      LEAD_SOCIAL_PLATFORMS_VALUES.length,
    );
  });
});

describe("LEAD_SORT_VALUES", () => {
  it("contains the expected sort values in order", () => {
    expect(LEAD_SORT_VALUES).toEqual([
      "created_asc",
      "created_desc",
      "updated_asc",
      "updated_desc",
      "score_asc",
      "score_desc",
      "name_asc",
      "name_desc",
    ]);
  });

  it("has no duplicates", () => {
    expect(new Set(LEAD_SORT_VALUES).size).toBe(LEAD_SORT_VALUES.length);
  });
});

describe("LeadListQueryParam", () => {
  it("contains the expected query param keys without duplicates", () => {
    expect(LEAD_LIST_QUERY_PARAM_VALUES).toEqual([
      LeadListQueryParam.Category,
      LeadListQueryParam.Create,
      LeadListQueryParam.DateFrom,
      LeadListQueryParam.DateTo,
      LeadListQueryParam.Edit,
      LeadListQueryParam.Page,
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

describe("LeadBadgeTone", () => {
  it("contains the expected badge tones without duplicates", () => {
    expect(LEAD_BADGE_TONE_VALUES).toEqual([
      LeadBadgeTone.Danger,
      LeadBadgeTone.Info,
      LeadBadgeTone.Neutral,
      LeadBadgeTone.Primary,
      LeadBadgeTone.Purple,
      LeadBadgeTone.Success,
      LeadBadgeTone.Warning,
    ]);
    expect(new Set(LEAD_BADGE_TONE_VALUES).size).toBe(
      LEAD_BADGE_TONE_VALUES.length,
    );
  });
});

describe("LeadBadgeKind", () => {
  it("contains the expected badge kinds without duplicates", () => {
    expect(LEAD_BADGE_KIND_VALUES).toEqual([
      LeadBadgeKind.Category,
      LeadBadgeKind.Source,
      LeadBadgeKind.Status,
    ]);
    expect(new Set(LEAD_BADGE_KIND_VALUES).size).toBe(
      LEAD_BADGE_KIND_VALUES.length,
    );
  });
});

describe("LeadDetailEntryKind", () => {
  it("contains the expected timeline entry kinds without duplicates", () => {
    expect(LEAD_DETAIL_ENTRY_KIND_VALUES).toEqual([
      LeadDetailEntryKind.Activity,
      LeadDetailEntryKind.Submission,
    ]);
    expect(new Set(LEAD_DETAIL_ENTRY_KIND_VALUES).size).toBe(
      LEAD_DETAIL_ENTRY_KIND_VALUES.length,
    );
  });
});

describe("lead list defaults", () => {
  it("sets PAGE_SIZE to 25", () => {
    expect(LEAD_LIST_PAGE_SIZE).toBe(25);
  });

  it("sets MAX_PAGE_SIZE to 100", () => {
    expect(LEAD_LIST_MAX_PAGE_SIZE).toBe(100);
  });

  it("PAGE_SIZE is less than MAX_PAGE_SIZE", () => {
    expect(LEAD_LIST_PAGE_SIZE).toBeLessThan(LEAD_LIST_MAX_PAGE_SIZE);
  });
});

describe("LeadErrorCode", () => {
  it("contains the expected API error codes without duplicates", () => {
    expect(LEAD_ERROR_CODE_VALUES).toEqual([
      LeadErrorCode.EmailExists,
      LeadErrorCode.ValidationError,
      LeadErrorCode.NotFound,
      LeadErrorCode.Internal,
    ]);
    expect(new Set(LEAD_ERROR_CODE_VALUES).size).toBe(
      LEAD_ERROR_CODE_VALUES.length,
    );
  });
});

describe("LeadValidationIssueCode", () => {
  it("contains the expected validation issue codes without duplicates", () => {
    expect(LEAD_VALIDATION_ISSUE_CODE_VALUES).toEqual([
      LeadValidationIssueCode.LastNameOrCompanyNameRequired,
    ]);
    expect(new Set(LEAD_VALIDATION_ISSUE_CODE_VALUES).size).toBe(
      LEAD_VALIDATION_ISSUE_CODE_VALUES.length,
    );
  });
});

describe("LeadValidationMessageCode", () => {
  it("contains the expected validation message codes without duplicates", () => {
    expect(LEAD_VALIDATION_MESSAGE_CODE_VALUES).toEqual([
      LeadValidationMessageCode.CategoryInvalid,
      LeadValidationMessageCode.EmailInvalid,
      LeadValidationMessageCode.EmailRequired,
      LeadValidationMessageCode.ImprovementRequired,
      LeadValidationMessageCode.PhoneInvalid,
      LeadValidationMessageCode.ScoreInvalid,
      LeadValidationMessageCode.SocialProfileInvalid,
      LeadValidationMessageCode.SocialProfileRequired,
      LeadValidationMessageCode.UrlInvalid,
    ]);
    expect(new Set(LEAD_VALIDATION_MESSAGE_CODE_VALUES).size).toBe(
      LEAD_VALIDATION_MESSAGE_CODE_VALUES.length,
    );
  });
});
