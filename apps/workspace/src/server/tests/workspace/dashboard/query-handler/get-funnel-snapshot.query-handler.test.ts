import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

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

function mockGroupedSelect(
  rows: ReadonlyArray<{ lead_status: string; count: number }>,
) {
  getDrizzleDatabaseClientMock.mockReturnValue({
    select: vi.fn().mockImplementation(() => drizzleChain(rows)),
  });
}

const INPUT = {
  from: new Date("2024-02-01T00:00:00Z"),
  to: new Date("2024-03-01T23:59:59Z"),
};

beforeEach(() => {
  vi.resetModules();
  getDrizzleDatabaseClientMock.mockReset();
});

describe("getFunnelSnapshot", () => {
  it("returns the six funnel stages in order with active cumulative counts", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 20 },
      { lead_status: ContactLeadStatus.Contacted, count: 12 },
      { lead_status: ContactLeadStatus.Responded, count: 6 },
      { lead_status: ContactLeadStatus.Qualified, count: 2 },
      { lead_status: ContactLeadStatus.Proposal, count: 3 },
      { lead_status: ContactLeadStatus.Won, count: 1 },
      { lead_status: ContactLeadStatus.OnHold, count: 5 },
      { lead_status: ContactLeadStatus.Lost, count: 4 },
      { lead_status: ContactLeadStatus.Archived, count: 2 },
      { lead_status: ContactLeadStatus.PendingReview, count: 7 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);

    expect(result.stages.map((stage) => stage.key)).toEqual([
      ContactLeadStatus.New,
      ContactLeadStatus.Contacted,
      ContactLeadStatus.Responded,
      ContactLeadStatus.Qualified,
      ContactLeadStatus.Proposal,
      ContactLeadStatus.Won,
    ]);
    expect(result.stages.map((stage) => stage.count)).toEqual([
      51, 24, 12, 6, 4, 1,
    ]);
    expect(result.stages[0]?.pendingReviewCount).toBe(7);
    expect(result.outcomes).toEqual([
      { key: ContactLeadStatus.OnHold, count: 5 },
      { key: ContactLeadStatus.Lost, count: 4 },
      { key: ContactLeadStatus.Archived, count: 2 },
    ]);
    expect(result.totalCount).toBe(62);
  });

  it("sets dropOffFromPrev to null for the first stage", async () => {
    mockGroupedSelect([{ lead_status: ContactLeadStatus.New, count: 10 }]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages[0]?.dropOffFromPrev).toBeNull();
  });

  it("computes dropOffFromPrev as ratio of cumulative stage count to previous cumulative stage count", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 100 },
      { lead_status: ContactLeadStatus.Contacted, count: 60 },
      { lead_status: ContactLeadStatus.Responded, count: 30 },
      { lead_status: ContactLeadStatus.Qualified, count: 9 },
      { lead_status: ContactLeadStatus.Proposal, count: 6 },
      { lead_status: ContactLeadStatus.Won, count: 3 },
      { lead_status: ContactLeadStatus.Lost, count: 2 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages[1]?.dropOffFromPrev).toBeCloseTo(108 / 208, 5);
    expect(result.stages[2]?.dropOffFromPrev).toBeCloseTo(48 / 108, 5);
    expect(result.stages[3]?.dropOffFromPrev).toBeCloseTo(18 / 48, 5);
    expect(result.stages[4]?.dropOffFromPrev).toBeCloseTo(9 / 18, 5);
    expect(result.stages[5]?.dropOffFromPrev).toBeCloseTo(3 / 9, 5);
  });

  it("returns 0 counts for missing stages (DB returned no rows for that status)", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 5 },
      { lead_status: ContactLeadStatus.Qualified, count: 1 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages.map((stage) => stage.count)).toEqual([
      6, 1, 1, 1, 0, 0,
    ]);
  });

  it("includes pending review leads in the new stage and exposes the review count", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 3 },
      { lead_status: ContactLeadStatus.PendingReview, count: 30 },
      { lead_status: ContactLeadStatus.Contacted, count: 2 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages[0]).toMatchObject({
      key: ContactLeadStatus.New,
      count: 35,
      pendingReviewCount: 30,
    });
    expect(result.totalCount).toBe(35);
  });

  it("keeps proposal and won as funnel stages while lost remains a separate outcome", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 10 },
      { lead_status: ContactLeadStatus.Qualified, count: 2 },
      { lead_status: ContactLeadStatus.Proposal, count: 3 },
      { lead_status: ContactLeadStatus.Won, count: 1 },
      { lead_status: ContactLeadStatus.Lost, count: 4 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages.map((stage) => stage.count)).toEqual([
      16, 6, 6, 6, 4, 1,
    ]);
    expect(result.outcomes).toContainEqual({
      key: ContactLeadStatus.Lost,
      count: 4,
    });
    expect(result.totalCount).toBe(20);
  });

  it("uses previous cumulative stage counts for dropOffFromPrev", async () => {
    mockGroupedSelect([
      { lead_status: ContactLeadStatus.New, count: 0 },
      { lead_status: ContactLeadStatus.Contacted, count: 0 },
      { lead_status: ContactLeadStatus.Responded, count: 3 },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages[1]?.dropOffFromPrev).toBe(1);
    expect(result.stages[2]?.dropOffFromPrev).toBe(1);
    expect(result.stages[3]?.dropOffFromPrev).toBe(0);
    expect(result.stages[4]?.dropOffFromPrev).toBe(0);
    expect(result.stages[5]?.dropOffFromPrev).toBe(0);
  });

  it("coerces numeric strings from the DB driver to numbers", async () => {
    mockGroupedSelect([
      {
        lead_status: ContactLeadStatus.New,
        count: "8" as unknown as number,
      },
      {
        lead_status: ContactLeadStatus.Contacted,
        count: "4" as unknown as number,
      },
    ]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    const result = await getFunnelSnapshot(INPUT);
    expect(result.stages[0]?.count).toBe(12);
    expect(result.stages[1]?.count).toBe(4);
    expect(result.outcomes).toContainEqual({
      key: ContactLeadStatus.Lost,
      count: 0,
    });
    expect(result.totalCount).toBe(12);
  });

  it("issues exactly one select call (single grouped query)", async () => {
    mockGroupedSelect([{ lead_status: ContactLeadStatus.New, count: 1 }]);

    const { getFunnelSnapshot } =
      await import("@/server/workspace/dashboard/query-handler/get-funnel-snapshot.query-handler");

    await getFunnelSnapshot(INPUT);

    const dbClient = getDrizzleDatabaseClientMock.mock.results[0]?.value;
    expect(dbClient.select).toHaveBeenCalledTimes(1);
  });
});
