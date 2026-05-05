import { describe, expect, it } from "vitest";
import { mapLeadDetailRowToDto } from "@/server/workspace/leads/services/lead-detail/lead-detail-mapping-service";

const NOW = new Date("2024-03-01T12:00:00Z");
const LATER = new Date("2024-03-02T08:00:00Z");

const mainRow = {
  id: "lead-uuid-1",
  first_name: "Anna",
  last_name: "Beispiel",
  company_name: null,
  email: "anna@example.com",
  phone: "+49 123 456",
  website_url: "https://anna.example.com",
  score: 75,
  source: "manual" as const,
  lead_status: "qualified" as const,
  owner: "Moritz",
  notes: "Interessante Kundin",
  improvements: ["Mehr Social Proof", "Klarere CTA"],
  external_guid: null,
  created_at: NOW,
  updated_at: NOW,
  category_id: "cat-uuid-1",
  category_slug: "coaches",
  category_label_key: "leads.categories.coaches",
};

const socialProfileRow = {
  id: "social-uuid-1",
  platform: "linkedin" as const,
  profile_url: "https://linkedin.com/in/anna-beispiel",
  normalized_url: "linkedin.com/in/anna-beispiel",
};

const activityRow = {
  id: "act-uuid-1",
  type: "note" as const,
  title: "Erstes Gespräch",
  body: "Sehr gutes Gespräch gehabt.",
  metadata: null,
  occurred_at: NOW,
  actor_type: "user" as const,
  actor_id: "clerk-user-1",
  actor_label: "Moritz",
};

const submissionRow = {
  id: "sub-uuid-1",
  request_id: "req-abc-123",
  channel: "quick_contact" as const,
  locale: "de",
  consent_accepted_at: NOW,
  submission_started_at: LATER,
  created_at: NOW,
};

describe("mapLeadDetailRowToDto", () => {
  it("maps all scalar lead fields from snake_case to camelCase", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [], []);

    expect(result).toMatchObject({
      id: "lead-uuid-1",
      firstName: "Anna",
      lastName: "Beispiel",
      companyName: null,
      email: "anna@example.com",
      phone: "+49 123 456",
      websiteUrl: "https://anna.example.com",
      score: 75,
      source: "manual",
      leadStatus: "qualified",
      owner: "Moritz",
      notes: "Interessante Kundin",
      improvements: ["Mehr Social Proof", "Klarere CTA"],
      externalGuid: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("maps category when present", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [], []);

    expect(result.category).toEqual({
      id: "cat-uuid-1",
      slug: "coaches",
      labelKey: "leads.categories.coaches",
    });
  });

  it("maps category to null when category fields are null", () => {
    const result = mapLeadDetailRowToDto(
      {
        ...mainRow,
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
    const result = mapLeadDetailRowToDto(mainRow, [socialProfileRow], [], []);

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
    const result = mapLeadDetailRowToDto(mainRow, [], [], []);

    expect(result.socialProfiles).toEqual([]);
  });

  it("maps activities from snake_case to camelCase", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [activityRow], []);

    expect(result.activities).toEqual([
      {
        id: "act-uuid-1",
        type: "note",
        title: "Erstes Gespräch",
        body: "Sehr gutes Gespräch gehabt.",
        metadata: null,
        occurredAt: NOW.toISOString(),
        actorType: "user",
        actorId: "clerk-user-1",
        actorLabel: "Moritz",
      },
    ]);
  });

  it("returns empty array for activities when none", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [], []);

    expect(result.activities).toEqual([]);
  });

  it("maps submissions from snake_case to camelCase", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [], [submissionRow]);

    expect(result.submissions).toEqual([
      {
        id: "sub-uuid-1",
        requestId: "req-abc-123",
        channel: "quick_contact",
        locale: "de",
        consentAcceptedAt: NOW.toISOString(),
        submissionStartedAt: LATER.toISOString(),
        createdAt: NOW.toISOString(),
      },
    ]);
  });

  it("returns empty array for submissions when none", () => {
    const result = mapLeadDetailRowToDto(mainRow, [], [], []);

    expect(result.submissions).toEqual([]);
  });

  it("maps multiple sub-items and preserves order", () => {
    const secondActivity = {
      ...activityRow,
      id: "act-uuid-2",
      occurred_at: LATER,
    };
    const result = mapLeadDetailRowToDto(
      mainRow,
      [socialProfileRow],
      [activityRow, secondActivity],
      [submissionRow],
    );

    expect(result.socialProfiles).toHaveLength(1);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].id).toBe("act-uuid-1");
    expect(result.activities[1].id).toBe("act-uuid-2");
    expect(result.submissions).toHaveLength(1);
  });

  it("maps nullable scalar fields correctly", () => {
    const result = mapLeadDetailRowToDto(
      {
        ...mainRow,
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
