import { describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadImportColumnKey } from "@invessiv/common/constants/leads/import/columns/lead-import-column-keys";
import { LeadImportRowIssueCode } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-severities";
import { LeadImportWarningCode } from "@invessiv/common/constants/leads/import/warnings/lead-import-warning-codes";
import { leadImportValidationService } from "@/server/workspace/leads/services/import/lead-import-validation-service";
import type { RawLeadImportRow } from "@invessiv/common/contracts/leads/import/csv/lead-import-raw-row";

vi.mock("server-only", () => ({}));

function createContext(categorySlugToId = new Map<string, string>()) {
  return {
    rowIndex: 1,
    seenEmails: new Set<string>(),
    seenExternalGuids: new Set<string>(),
    categorySlugToId,
  };
}

const validRawRow: RawLeadImportRow = {
  display_name: undefined,
  email: "Anna.Schmidt@example.com",
  first_name: "Anna",
  last_name: "Schmidt",
  company_name: undefined,
  phone: "+49 30 1234567",
  owner: "Moritz",
  notes: "Outbound source with full profile",
  external_guid: "lead-001",
  website_url: "https://schmidt-consulting.example",
  linkedin_url: "https://www.linkedin.com/in/anna-schmidt?utm_source=test",
  instagram_url: "https://www.instagram.com/schmidtconsulting",
  youtube_url: "https://www.youtube.com/@schmidtconsulting/",
  category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  score: "82",
  status: "Neu",
  improvements:
    "Clarify hero positioning | Make CTA more visible | Improve mobile above-the-fold copy",
};

describe("leadImportRowSchema", () => {
  it("accepts the mapped raw import row shape", () => {
    expect(
      leadImportValidationService.leadImportRowSchema.safeParse(validRawRow)
        .success,
    ).toBe(true);
  });
});

describe("validateRow", () => {
  it("returns a validated row with normalized social profiles and parsed status", () => {
    const result = leadImportValidationService.validateRow(
      validRawRow,
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value).toEqual({
      displayName: "Anna Schmidt",
      email: "Anna.Schmidt@example.com",
      first_name: "Anna",
      last_name: "Schmidt",
      company_name: undefined,
      phone: "+49 30 1234567",
      owner: "Moritz",
      notes: "Outbound source with full profile",
      external_guid: "lead-001",
      website_url: "https://schmidt-consulting.example",
      category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      score: 82,
      status: ContactLeadStatus.New,
      improvements: [
        "Clarify hero positioning",
        "Make CTA more visible",
        "Improve mobile above-the-fold copy",
      ],
      social_profiles: [
        {
          platform: "linkedin",
          profile_url:
            "https://www.linkedin.com/in/anna-schmidt?utm_source=test",
          normalized_url: "https://www.linkedin.com/in/anna-schmidt",
        },
        {
          platform: "instagram",
          profile_url: "https://www.instagram.com/schmidtconsulting",
          normalized_url: "https://www.instagram.com/schmidtconsulting",
        },
        {
          platform: "youtube",
          profile_url: "https://www.youtube.com/@schmidtconsulting/",
          normalized_url: "https://www.youtube.com/@schmidtconsulting",
        },
      ],
    });
  });

  it("accepts display_name without email and keeps email undefined", () => {
    const result = leadImportValidationService.validateRow(
      {
        display_name: "Display Only",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value.displayName).toBe("Display Only");
    expect(result.value.email).toBeUndefined();
  });

  it("accepts minimal email and last_name", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "max@example.com",
        last_name: "Mustermann",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value.improvements).toEqual([]);
    expect(result.value.status).toBeUndefined();
    expect(result.value.displayName).toBe("Mustermann");
  });

  it("accepts minimal email and company_name", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "kontakt@example.com",
        company_name: "Beispiel GmbH",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value.company_name).toBe("Beispiel GmbH");
    expect(result.value.displayName).toBe("Beispiel GmbH");
  });

  it("derives the display name from first_name when last_name is absent", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        first_name: "Anna",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.displayName).toBe("Anna");
    expect(result.issues).toEqual([]);
  });

  it("returns an error when no name fields are provided", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
      },
      createContext(),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        rowIndex: 1,
        code: LeadImportRowIssueCode.MissingDisplayName,
        severity: LeadImportRowIssueSeverity.Error,
      },
    ]);
  });

  it("returns an error for invalid score values", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
        score: "45.5",
      },
      createContext(),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      rowIndex: 1,
      code: LeadImportRowIssueCode.InvalidScore,
      severity: LeadImportRowIssueSeverity.Error,
      column: LeadImportColumnKey.Score,
    });
  });

  it("falls back to New for unknown status and emits a warning", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
        status: "unknown",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.status).toBe(ContactLeadStatus.PendingReview);
    expect(result.issues).toEqual([
      {
        rowIndex: 1,
        code: LeadImportWarningCode.UnknownStatusFallback,
        severity: LeadImportRowIssueSeverity.Warning,
        column: LeadImportColumnKey.Status,
      },
    ]);
  });

  it("splits improvements and warns about empty tokens", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
        improvements: "a |  | b",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.value.improvements).toEqual(["a", "b"]);
    expect(result.issues).toEqual([
      {
        rowIndex: 1,
        code: LeadImportWarningCode.EmptyImprovementToken,
        severity: LeadImportRowIssueSeverity.Warning,
        column: LeadImportColumnKey.Improvements,
      },
    ]);
  });

  it("skips duplicate emails within the same file", () => {
    const context = createContext();

    const first = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
      },
      context,
    );
    expect(first.ok).toBe(true);

    context.rowIndex = 2;
    const second = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
      },
      context,
    );

    expect(second.ok).toBe(true);
    if (!second.ok) {
      throw new Error("expected success");
    }

    expect(second.issues).toContainEqual({
      rowIndex: 2,
      code: LeadImportRowIssueCode.DuplicateEmailInFile,
      severity: LeadImportRowIssueSeverity.Skip,
      column: LeadImportColumnKey.Email,
    });
  });

  it("returns an error for invalid category ids", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
        category_id: "not-a-uuid",
      },
      createContext(),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      rowIndex: 1,
      code: LeadImportRowIssueCode.UnknownCategoryId,
      severity: LeadImportRowIssueSeverity.Error,
      column: LeadImportColumnKey.CategoryId,
    });
  });

  it("accepts an empty mapped email cell when a name is present", () => {
    const result = leadImportValidationService.validateRow(
      {
        email: "",
        last_name: "Schmidt",
      },
      createContext(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value.email).toBeUndefined();
  });
});
