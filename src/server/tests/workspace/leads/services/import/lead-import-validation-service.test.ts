import { describe, expect, it, vi } from "vitest";

import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadImportColumnKey } from "@/common/constants/leads/import/lead-import-column-keys";
import { LeadImportRowIssueCode } from "@/common/constants/leads/import/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/lead-import-row-issue-severities";
import { LeadImportWarningCode } from "@/common/constants/leads/import/lead-import-warning-codes";
import {
  leadImportRowSchema,
  validateRow,
} from "@/server/workspace/leads/services/import/lead-import-validation-service";
import type { RawLeadImportRow } from "@/server/workspace/leads/services/import/lead-import-row";

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
    expect(leadImportRowSchema.safeParse(validRawRow).success).toBe(true);
  });
});

describe("validateRow", () => {
  it("returns a validated row with normalized social profiles and parsed status", () => {
    const result = validateRow(validRawRow, createContext());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }

    expect(result.issues).toEqual([]);
    expect(result.value).toEqual({
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

  it("accepts minimal email and last_name", () => {
    const result = validateRow(
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
  });

  it("accepts minimal email and company_name", () => {
    const result = validateRow(
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
  });

  it("returns an error when neither last_name nor company_name is provided", () => {
    const result = validateRow(
      {
        email: "anna@example.com",
        first_name: "Anna",
      },
      createContext(),
    );

    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([
      {
        rowIndex: 1,
        code: LeadImportRowIssueCode.MissingNameOrCompany,
        severity: LeadImportRowIssueSeverity.Error,
      },
    ]);
  });

  it("returns an error for invalid score values", () => {
    const result = validateRow(
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
    const result = validateRow(
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

    expect(result.value.status).toBe(ContactLeadStatus.New);
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
    const result = validateRow(
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

    const first = validateRow(
      {
        email: "anna@example.com",
        last_name: "Schmidt",
      },
      context,
    );
    expect(first.ok).toBe(true);

    context.rowIndex = 2;
    const second = validateRow(
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
    const result = validateRow(
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
});
