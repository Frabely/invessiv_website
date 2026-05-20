import { describe, expect, it, vi } from "vitest";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

function drizzleChain(value: unknown) {
  const proxy: Record<string | symbol, unknown> = new Proxy(
    {},
    {
      get(_, prop: string | symbol) {
        if (prop === "then") {
          return (res: (v: unknown) => void, rej: (e: unknown) => void) =>
            Promise.resolve(value).then(res, rej);
        }
        if (prop === Symbol.iterator || prop === Symbol.toPrimitive) {
          return undefined;
        }
        return vi.fn().mockReturnValue(proxy);
      },
    },
  );
  return proxy;
}

const NOW = new Date("2024-03-01T12:00:00Z");
const LATER = new Date("2024-03-02T08:00:00Z");

const mainRow = {
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

const mainRowNoCategory = {
  ...mainRow,
  category_id: null,
  category_slug: null,
  category_label_key: null,
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

function mockDb(
  leadRows: unknown[],
  socialProfiles: unknown[],
  activities: unknown[],
  submissions: unknown[],
) {
  let callIndex = 0;
  const responses = [leadRows, socialProfiles, activities, submissions];
  getDrizzleDatabaseClientMock.mockReturnValue({
    select: vi.fn().mockImplementation(() => {
      return drizzleChain(responses[callIndex++]);
    }),
  });
}

describe("getLeadById", () => {
  it("returns null when lead does not exist", async () => {
    mockDb([], [], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("non-existent-id");

    expect(result).toBeNull();
  });

  it("returns a LeadDetailDto with the correct shape", async () => {
    vi.resetModules();
    mockDb([mainRow], [], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

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
      leadStatus: "qualified",
      owner: "Moritz",
      notes: "Interessante Kundin",
      improvements: ["Mehr Social Proof", "Klarere CTA"],
      externalGuid: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("maps category when present", async () => {
    vi.resetModules();
    mockDb([mainRow], [], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.category).toEqual({
      id: "cat-uuid-1",
      slug: "coaches",
      labelKey: "leads.categories.coaches",
    });
  });

  it("maps category to null when not present", async () => {
    vi.resetModules();
    mockDb([mainRowNoCategory], [], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.category).toBeNull();
  });

  it("includes social profiles", async () => {
    vi.resetModules();
    mockDb([mainRow], [socialProfileRow], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.socialProfiles).toEqual([
      {
        id: "social-uuid-1",
        platform: "linkedin",
        profileUrl: "https://linkedin.com/in/anna-beispiel",
        normalizedUrl: "linkedin.com/in/anna-beispiel",
      },
    ]);
  });

  it("returns empty social profiles when none exist", async () => {
    vi.resetModules();
    mockDb([mainRow], [], [], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.socialProfiles).toEqual([]);
  });

  it("includes activities", async () => {
    vi.resetModules();
    mockDb([mainRow], [], [activityRow], []);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.activities).toEqual([
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

  it("includes submissions", async () => {
    vi.resetModules();
    mockDb([mainRow], [], [], [submissionRow]);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.submissions).toEqual([
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

  it("combines all sub-data for a full lead", async () => {
    vi.resetModules();
    mockDb([mainRow], [socialProfileRow], [activityRow], [submissionRow]);
    const { getLeadById } =
      await import("@/server/workspace/leads/query-handler/get-lead-by-id.query-handler");

    const result = await getLeadById("lead-uuid-1");

    expect(result?.socialProfiles).toHaveLength(1);
    expect(result?.activities).toHaveLength(1);
    expect(result?.submissions).toHaveLength(1);
    expect(result?.category).not.toBeNull();
  });
});
