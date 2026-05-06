import { describe, expect, it } from "vitest";
import type { LeadSocialProfileDto } from "@/common/contracts/leads/lead-social-profile.dto";
import type { LeadSummaryRow } from "@/common/contracts/leads/rows/lead-summary-row";
import { mapLeadRowToSummaryDto } from "@/server/workspace/leads/services/lead-summary/lead-summary-mapping-service";

const NOW = new Date("2024-03-01T12:00:00Z");

const baseRow = {
  id: "lead-uuid-1",
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

describe("mapLeadRowToSummaryDto", () => {
  it("maps all scalar fields from snake_case to camelCase", () => {
    const result = mapLeadRowToSummaryDto({
      ...baseRow,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result).toEqual({
      id: "lead-uuid-1",
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
    const result = mapLeadRowToSummaryDto({
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
    const result = mapLeadRowToSummaryDto({
      ...baseRow,
      category_id: null,
      category_slug: null,
      category_label_key: null,
    });

    expect(result.category).toBeNull();
  });

  it("maps nullable scalar fields correctly", () => {
    const result = mapLeadRowToSummaryDto({
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
    const result = mapLeadRowToSummaryDto(
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
    const result = mapLeadRowToSummaryDto({
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
