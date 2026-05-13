import { describe, expect, it, vi } from "vitest";

const { getDrizzleDatabaseClientMock } = vi.hoisted(() => ({
  getDrizzleDatabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/core", () => ({
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

describe("listLeadCategories", () => {
  it("returns ordered category DTOs", async () => {
    getDrizzleDatabaseClientMock.mockReturnValue({
      select: vi.fn().mockReturnValue(
        drizzleChain([
          {
            id: "cat-1",
            slug: "coaches",
            label_key: "coaches",
          },
          {
            id: "cat-2",
            slug: "consultants",
            label_key: "consultants",
          },
          {
            id: "cat-3",
            slug: "other",
            label_key: "other",
          },
        ]),
      ),
    });

    const { getLeadCategories } =
      await import("@/server/workspace/leads/query-handler/list-lead-categories.query-handler");

    const result = await getLeadCategories();

    expect(result).toEqual([
      {
        id: "cat-1",
        slug: "coaches",
        labelKey: "coaches",
      },
      {
        id: "cat-2",
        slug: "consultants",
        labelKey: "consultants",
      },
      {
        id: "cat-3",
        slug: "other",
        labelKey: "other",
      },
    ]);
  });
});
