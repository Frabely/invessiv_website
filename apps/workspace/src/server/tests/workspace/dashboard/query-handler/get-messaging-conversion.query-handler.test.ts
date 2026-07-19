import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

const { betweenMock, getDrizzleDatabaseClientMock, updatedAtColumn } =
  vi.hoisted(() => ({
    betweenMock: vi.fn().mockReturnValue("date-range-condition"),
    getDrizzleDatabaseClientMock: vi.fn(),
    updatedAtColumn: Symbol("leads.updated_at"),
  }));

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
  between: betweenMock,
  count: vi.fn().mockReturnValue("count-expression"),
}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: getDrizzleDatabaseClientMock,
}));
vi.mock("@invessiv/db/record-configuration", () => ({
  leads: {
    lead_status: Symbol("leads.lead_status"),
    updated_at: updatedAtColumn,
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
  getDrizzleDatabaseClientMock.mockReset();
});

describe("getMessagingConversion", () => {
  it("queries grouped statuses once and includes follow-up in contacted", async () => {
    const select = vi.fn().mockImplementation(() =>
      drizzleChain([
        { lead_status: ContactLeadStatus.FollowUp, count: 10 },
        { lead_status: ContactLeadStatus.Responded, count: 2 },
      ]),
    );
    getDrizzleDatabaseClientMock.mockReturnValue({ select });

    const { getMessagingConversion } =
      await import("@/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler");
    const result = await getMessagingConversion(INPUT);

    expect(select).toHaveBeenCalledTimes(1);
    expect(betweenMock).toHaveBeenCalledWith(
      updatedAtColumn,
      INPUT.from,
      INPUT.to,
    );
    expect(result.steps.map((step) => step.count)).toEqual([12, 2, 0, 0, 0]);
  });

  it("does not add a date condition for an unbounded query", async () => {
    getDrizzleDatabaseClientMock.mockReturnValue({
      select: vi.fn().mockImplementation(() => drizzleChain([])),
    });
    const { getMessagingConversion } =
      await import("@/server/workspace/dashboard/query-handler/get-messaging-conversion.query-handler");

    await getMessagingConversion({});

    expect(betweenMock).not.toHaveBeenCalled();
  });
});
