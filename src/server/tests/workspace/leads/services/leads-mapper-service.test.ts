import { describe, expect, it } from "vitest";
import { CONTACT_REQUEST_KIND } from "@/common/constants/contact/contact-request-kind";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadActivityRow } from "@/common/contracts/leads/rows/lead-activity-row";
import type { LeadDetailMainRow } from "@/common/contracts/leads/rows/lead-detail-main-row";
import type { LeadSocialProfileRow } from "@/common/contracts/leads/rows/lead-social-profile-row";
import type { LeadSubmissionRow } from "@/common/contracts/leads/rows/lead-submission-row";
import type { LeadSocialProfileDto } from "@/common/contracts/leads/lead-social-profile.dto";
import type { LeadSummaryRow } from "@/common/contracts/leads/rows/lead-summary-row";
import { leadsMapperService } from "@/server/workspace/leads/services/leads-mapper-service";

const NOW = new Date("2024-03-01T12:00:00Z");

const baseRow = {
  id: "lead-uuid-1",
  display_name: "Anna Beispiel",
  first_name: "Anna",
  last_name: "Beispiel",
  company_name: null,
  email: "anna@example.com",
  phone: null,
  website_url: "https://anna.example.com",
  score: 75,
  source: "manual" as const,
  lead_status: "qualified" as const,
  owner: "Moritz",
  created_at: NOW,
  updated_at: NOW,
  category_id: null,
  category_slug: null,
  category_label_key: null,
} satisfies LeadSummaryRow;

const socialProfiles: LeadSocialProfileDto[] = [
  {
    id: "social-1",
    platform: "linkedin",
    profileUrl: "https://linkedin.com/in/anna",
    normalizedUrl: "linkedin.com/in/anna",
  },
];

describe("leadsMapperService.mapLeadRowToSummaryDto", () => {
  it("maps all scalar fields from snake_case to camelCase", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto({
      ...baseRow,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result).toEqual({
      id: "lead-uuid-1",
      displayName: "Anna Beispiel",
      firstName: "Anna",
      lastName: "Beispiel",
      companyName: null,
      email: "anna@example.com",
      phone: null,
      websiteUrl: "https://anna.example.com",
      score: 75,
      source: "manual",
      leadStatus: "qualified",
      owner: "Moritz",
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      category: null,
      socialProfiles: [],
    });
  });

  it("maps category when all category fields are present", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto({
      ...baseRow,
      category_id: "cat-uuid-1",
      category_slug: "coaches",
      category_label_key: "leads.categories.coaches",
    });

    expect(result.category).toEqual({
      id: "cat-uuid-1",
      slug: "coaches",
      labelKey: "leads.categories.coaches",
    });
  });

  it("maps category to null when category fields are null", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto({
      ...baseRow,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result.category).toBeNull();
  });

  it("maps nullable scalar fields correctly", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto({
      ...baseRow,
      first_name: null,
      last_name: null,
      company_name: "ACME GmbH",
      phone: null,
      website_url: null,
      score: null,
      owner: null,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.companyName).toBe("ACME GmbH");
    expect(result.phone).toBeNull();
    expect(result.websiteUrl).toBeNull();
    expect(result.score).toBeNull();
    expect(result.owner).toBeNull();
  });

  it("maps phone and social profiles into the dto", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto(
      {
        ...baseRow,
        phone: "+49 30 1234567",
        category_id: null,
        category_slug: null,
        category_label_key: null,
      },
      socialProfiles,
    );

    expect(result.phone).toBe("+49 30 1234567");
    expect(result.socialProfiles).toEqual(socialProfiles);
  });

  it("defaults to empty social profiles when none are provided", () => {
    const result = leadsMapperService.mapLeadRowToSummaryDto({
      ...baseRow,
      phone: null,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result.phone).toBeNull();
    expect(result.socialProfiles).toEqual([]);
  });
});

const DETAIL_NOW = new Date("2024-03-01T12:00:00Z");
const DETAIL_LATER = new Date("2024-03-02T08:00:00Z");

const detailMainRow = {
  id: "lead-uuid-1",
  display_name: "Anna Beispiel",
  first_name: "Anna",
  last_name: "Beispiel",
  company_name: null,
  email: "anna@example.com",
  phone: "+49 123 456",
  website_url: "https://anna.example.com",
  score: 75,
  source: "manual" as const,
  lead_status: ContactLeadStatus.Qualified,
  owner: "Moritz",
  notes: "Interessante Kundin",
  improvements: ["Mehr Social Proof", "Klarere CTA"],
  external_guid: null,
  created_at: DETAIL_NOW,
  updated_at: DETAIL_NOW,
  category_id: "cat-uuid-1",
  category_slug: "coaches",
  category_label_key: "leads.categories.coaches",
} satisfies LeadDetailMainRow;

const detailSocialProfileRow = {
  id: "social-uuid-1",
  platform: "linkedin" as const,
  profile_url: "https://linkedin.com/in/anna-beispiel",
  normalized_url: "linkedin.com/in/anna-beispiel",
} satisfies LeadSocialProfileRow;

const detailActivityRow = {
  id: "act-uuid-1",
  type: LeadActivityType.Note,
  title: "Erstes Gespräch",
  body: "Sehr gutes Gespräch gehabt.",
  metadata: null,
  occurred_at: DETAIL_NOW,
  actor_type: LeadActorType.User,
  actor_id: "clerk-user-1",
  actor_label: "Moritz",
} satisfies LeadActivityRow;

const detailSubmissionRow = {
  id: "sub-uuid-1",
  request_id: "req-abc-123",
  channel: CONTACT_REQUEST_KIND.QuickContact,
  locale: "de",
  consent_accepted_at: DETAIL_NOW,
  submission_started_at: DETAIL_LATER,
  created_at: DETAIL_NOW,
} satisfies LeadSubmissionRow;

describe("leadsMapperService.mapLeadDetailRowToDto", () => {
  it("maps all scalar lead fields from snake_case to camelCase", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [],
    );

    expect(result).toMatchObject({
      id: "lead-uuid-1",
      displayName: "Anna Beispiel",
      firstName: "Anna",
      lastName: "Beispiel",
      companyName: null,
      email: "anna@example.com",
      phone: "+49 123 456",
      websiteUrl: "https://anna.example.com",
      score: 75,
      source: "manual",
      leadStatus: ContactLeadStatus.Qualified,
      owner: "Moritz",
      notes: "Interessante Kundin",
      improvements: ["Mehr Social Proof", "Klarere CTA"],
      externalGuid: null,
      createdAt: DETAIL_NOW.toISOString(),
      updatedAt: DETAIL_NOW.toISOString(),
    });
  });

  it("maps category when present", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [],
    );

    expect(result.category).toEqual({
      id: "cat-uuid-1",
      slug: "coaches",
      labelKey: "leads.categories.coaches",
    });
  });

  it("maps category to null when category fields are null", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      {
        ...detailMainRow,
        category_id: null,
        category_slug: null,
        category_label_key: null,
      },
      [],
      [],
      [],
    );

    expect(result.category).toBeNull();
  });

  it("maps social profiles from snake_case to camelCase", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [detailSocialProfileRow],
      [],
      [],
    );

    expect(result.socialProfiles).toEqual([
      {
        id: "social-uuid-1",
        platform: "linkedin",
        profileUrl: "https://linkedin.com/in/anna-beispiel",
        normalizedUrl: "linkedin.com/in/anna-beispiel",
      },
    ]);
  });

  it("returns empty array for social profiles when none", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [],
    );

    expect(result.socialProfiles).toEqual([]);
  });

  it("maps activities from snake_case to camelCase", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [detailActivityRow],
      [],
    );

    expect(result.activities).toEqual([
      {
        id: "act-uuid-1",
        type: LeadActivityType.Note,
        title: "Erstes Gespräch",
        body: "Sehr gutes Gespräch gehabt.",
        metadata: null,
        occurredAt: DETAIL_NOW.toISOString(),
        actorType: LeadActorType.User,
        actorId: "clerk-user-1",
        actorLabel: "Moritz",
      },
    ]);
  });

  it("returns empty array for activities when none", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [],
    );

    expect(result.activities).toEqual([]);
  });

  it("maps submissions from snake_case to camelCase", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [detailSubmissionRow],
    );

    expect(result.submissions).toEqual([
      {
        id: "sub-uuid-1",
        requestId: "req-abc-123",
        channel: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        consentAcceptedAt: DETAIL_NOW.toISOString(),
        submissionStartedAt: DETAIL_LATER.toISOString(),
        createdAt: DETAIL_NOW.toISOString(),
      },
    ]);
  });

  it("returns empty array for submissions when none", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [],
      [],
      [],
    );

    expect(result.submissions).toEqual([]);
  });

  it("maps multiple sub-items and preserves order", () => {
    const secondActivity = {
      ...detailActivityRow,
      id: "act-uuid-2",
      occurred_at: DETAIL_LATER,
    };
    const result = leadsMapperService.mapLeadDetailRowToDto(
      detailMainRow,
      [detailSocialProfileRow],
      [detailActivityRow, secondActivity],
      [detailSubmissionRow],
    );

    expect(result.socialProfiles).toHaveLength(1);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].id).toBe("act-uuid-1");
    expect(result.activities[1].id).toBe("act-uuid-2");
    expect(result.submissions).toHaveLength(1);
  });

  it("maps nullable scalar fields correctly", () => {
    const result = leadsMapperService.mapLeadDetailRowToDto(
      {
        ...detailMainRow,
        phone: null,
        notes: null,
        improvements: null,
        owner: null,
      },
      [],
      [],
      [],
    );

    expect(result.phone).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.improvements).toBeNull();
    expect(result.owner).toBeNull();
  });
});
