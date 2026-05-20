import { describe, expect, it, vi } from "vitest";
import { LEAD_LIST_PAGE_SIZE } from "@invessiv/common/constants/leads/list/lead-list-defaults";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));

// Proxy that acts as a chainable Drizzle query builder and resolves to `value` when awaited.
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

const leadWithCategory = {
  id: "lead-1",
  display_name: "Max Mustermann",
  first_name: "Max",
  last_name: "Mustermann",
  company_name: null,
  email: "max@example.com",
  phone: "+49 30 111111",
  website_url: "https://example.com",
  score: 80,
  source: "webform" as const,
  lead_status: "new" as const,
  owner: null,
  created_at: NOW,
  updated_at: NOW,
  category_id: "cat-uuid-1",
  category_slug: "coaches",
  category_label_key: "leads.categories.coaches",
};

const leadWithoutCategory = {
  id: "lead-2",
  display_name: "ACME GmbH",
  first_name: null,
  last_name: null,
  company_name: "ACME GmbH",
  email: "info@acme.de",
  phone: null,
  website_url: null,
  score: null,
  source: "manual" as const,
  lead_status: "qualified" as const,
  owner: "Moritz",
  created_at: NOW,
  updated_at: NOW,
  category_id: null,
  category_slug: null,
  category_label_key: null,
};

const socialProfileRow = {
  id: "social-1",
  lead_id: "lead-1",
  platform: "linkedin" as const,
  profile_url: "https://linkedin.com/in/max",
  normalized_url: "linkedin.com/in/max",
};

function mockDb(
  countValue: number,
  rows: unknown[],
  socialRows: unknown[] = [],
) {
  let callIndex = 0;
  const responses = [[{ count: countValue }], rows, socialRows];
  getDrizzleDatabaseClientMock.mockReturnValue({
    select: vi.fn().mockImplementation(() => {
      return drizzleChain(responses[callIndex++] ?? []);
    }),
  });
}

describe("listLeads", () => {
  it("returns the correct result shape", async () => {
    mockDb(1, [leadWithCategory], [socialProfileRow]);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const result = await listLeads({});

    expect(result).toMatchObject({
      rows: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      perPage: expect.any(Number),
    });
  });

  it("maps a lead with category to LeadSummaryDto", async () => {
    vi.resetModules();
    mockDb(1, [leadWithCategory], [socialProfileRow]);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { rows } = await listLeads({});

    expect(rows[0]).toEqual({
      id: "lead-1",
      displayName: "Max Mustermann",
      firstName: "Max",
      lastName: "Mustermann",
      companyName: null,
      email: "max@example.com",
      phone: "+49 30 111111",
      websiteUrl: "https://example.com",
      score: 80,
      source: "webform",
      leadStatus: "new",
      owner: null,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      category: {
        id: "cat-uuid-1",
        slug: "coaches",
        labelKey: "leads.categories.coaches",
      },
      socialProfiles: [
        {
          id: "social-1",
          platform: "linkedin",
          profileUrl: "https://linkedin.com/in/max",
          normalizedUrl: "linkedin.com/in/max",
        },
      ],
    });
  });

  it("maps a lead without category to null category", async () => {
    vi.resetModules();
    mockDb(1, [leadWithoutCategory]);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { rows } = await listLeads({});

    expect(rows[0]).toMatchObject({
      id: "lead-2",
      displayName: "ACME GmbH",
      companyName: "ACME GmbH",
      category: null,
      socialProfiles: [],
    });
  });

  it("returns total from the count query", async () => {
    vi.resetModules();
    mockDb(42, []);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { total } = await listLeads({});

    expect(total).toBe(42);
  });

  it("returns default page 1 and correct perPage", async () => {
    vi.resetModules();
    mockDb(0, []);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { page, perPage } = await listLeads({});

    expect(page).toBe(1);
    expect(perPage).toBe(LEAD_LIST_PAGE_SIZE);
  });

  it("passes page from filter to result", async () => {
    vi.resetModules();
    mockDb(0, []);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { page } = await listLeads({ page: 3 });

    expect(page).toBe(3);
  });

  it("returns multiple rows in order", async () => {
    vi.resetModules();
    mockDb(2, [leadWithCategory, leadWithoutCategory], [socialProfileRow]);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { rows, total } = await listLeads({});

    expect(rows).toHaveLength(2);
    expect(total).toBe(2);
    expect(rows[0].id).toBe("lead-1");
    expect(rows[1].id).toBe("lead-2");
  });

  it("returns empty rows when count is 0", async () => {
    vi.resetModules();
    mockDb(0, []);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { rows, total } = await listLeads({});

    expect(rows).toHaveLength(0);
    expect(total).toBe(0);
  });

  it("returns social profiles per lead", async () => {
    vi.resetModules();
    mockDb(1, [leadWithCategory], [socialProfileRow]);
    const { listLeads } =
      await import("@/server/workspace/leads/query-handler/list-leads.query-handler");

    const { rows } = await listLeads({});

    expect(rows[0].socialProfiles).toEqual([
      {
        id: "social-1",
        platform: "linkedin",
        profileUrl: "https://linkedin.com/in/max",
        normalizedUrl: "linkedin.com/in/max",
      },
    ]);
  });
});
