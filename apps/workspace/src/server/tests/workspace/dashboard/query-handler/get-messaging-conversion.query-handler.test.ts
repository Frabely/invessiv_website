import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

const {
  betweenMock,
  createdAtColumn,
  eqMock,
  getDrizzleDatabaseClientMock,
  maxAliasMock,
  notExistsMock,
  occurredAtColumn,
} = vi.hoisted(() => ({
  betweenMock: vi.fn().mockReturnValue("date-condition"),
  createdAtColumn: Symbol("leads.created_at"),
  eqMock: vi.fn().mockReturnValue("equality-condition"),
  getDrizzleDatabaseClientMock: vi.fn(),
  maxAliasMock: vi.fn().mockReturnValue("aliased-max-stage-rank"),
  notExistsMock: vi.fn().mockReturnValue("lead-has-no-status-history"),
  occurredAtColumn: Symbol("lead_activities.occurred_at"),
}));

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conditions: unknown[]) => conditions),
  between: betweenMock,
  count: vi.fn().mockReturnValue("count-expression"),
  eq: eqMock,
  gte: vi.fn().mockReturnValue("non-negative-stage-rank"),
  max: vi.fn().mockReturnValue({
    mapWith: vi.fn().mockReturnValue({ as: maxAliasMock }),
  }),
  notExists: notExistsMock,
  sql: vi.fn().mockReturnValue("next-status-expression"),
}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@invessiv/db/record-configuration", () => ({
  leadActivities: {
    id: Symbol("lead_activities.id"),
    lead_id: Symbol("lead_activities.lead_id"),
    occurred_at: occurredAtColumn,
    type: Symbol("lead_activities.type"),
  },
  leads: {
    id: Symbol("leads.id"),
    created_at: createdAtColumn,
    lead_status: Symbol("leads.lead_status"),
  },
}));

function drizzleChain(value: unknown) {
  const proxy: Record<string | symbol, unknown> = new Proxy(
    {},
    {
      get(_, prop: string | symbol) {
        if (prop === "then") {
          return (resolve: (result: unknown) => void) =>
            Promise.resolve(value).then(resolve);
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

const INPUT = {
  from: new Date("2026-01-01T00:00:00Z"),
  to: new Date("2026-01-31T23:59:59Z"),
};

beforeEach(() => {
  vi.resetModules();
  betweenMock.mockClear();
  eqMock.mockClear();
  maxAliasMock.mockClear();
  notExistsMock.mockClear();
  getDrizzleDatabaseClientMock.mockReset();
});

describe("getMessagingConversion", () => {
  it("combines ranged status events with a per-lead legacy fallback", async () => {
    const select = vi
      .fn()
      .mockImplementationOnce(() => drizzleChain([]))
      .mockImplementationOnce(() => drizzleChain([{ stageRank: 1, count: 1 }]))
      .mockImplementationOnce(() => drizzleChain([]))
      .mockImplementationOnce(() =>
        drizzleChain([{ lead_status: ContactLeadStatus.Contacted, count: 1 }]),
      );
    getDrizzleDatabaseClientMock.mockReturnValue({ select });

    const { getMessagingConversion } =
      await import("@/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler");
    const result = await getMessagingConversion(INPUT);

    expect(select).toHaveBeenCalledTimes(4);
    expect(maxAliasMock).toHaveBeenCalledWith("stage_rank");
    expect(betweenMock).toHaveBeenCalledWith(
      occurredAtColumn,
      INPUT.from,
      INPUT.to,
    );
    expect(betweenMock).toHaveBeenCalledWith(
      createdAtColumn,
      INPUT.from,
      INPUT.to,
    );
    expect(notExistsMock).toHaveBeenCalledTimes(1);
    expect(result.steps.map((step) => step.count)).toEqual([2, 1, 0, 0, 0]);
  });

  it("keeps the unbounded query unchanged", async () => {
    const select = vi.fn().mockImplementation(() => drizzleChain([]));
    getDrizzleDatabaseClientMock.mockReturnValue({ select });
    const { getMessagingConversion } =
      await import("@/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler");

    await getMessagingConversion({});

    expect(select).toHaveBeenCalledTimes(1);
    expect(betweenMock).not.toHaveBeenCalled();
    expect(notExistsMock).not.toHaveBeenCalled();
  });
});
