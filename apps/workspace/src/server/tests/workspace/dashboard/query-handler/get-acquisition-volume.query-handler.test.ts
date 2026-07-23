import { beforeEach, describe, expect, it, vi } from "vitest";

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

function mockSelectSequence(values: ReadonlyArray<unknown>) {
  let index = 0;
  getDrizzleDatabaseClientMock.mockReturnValue({
    select: vi
      .fn()
      .mockImplementation(() => drizzleChain(values[index++] ?? [])),
  });
}

const INPUT = {
  from: new Date("2024-02-01T00:00:00Z"),
  to: new Date("2024-03-01T23:59:59Z"),
  previousFrom: new Date("2024-01-01T00:00:00Z"),
  previousTo: new Date("2024-01-31T23:59:59Z"),
};

beforeEach(() => {
  vi.resetModules();
  getDrizzleDatabaseClientMock.mockReset();
});

describe("getAcquisitionVolume", () => {
  it("returns AcquisitionVolumeDto with current, previous, and pendingReview counts", async () => {
    mockSelectSequence([[{ count: 12 }], [{ count: 9 }], [{ count: 3 }]]);

    const { getAcquisitionVolume } =
      await import("@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler");

    const result = await getAcquisitionVolume(INPUT);

    expect(result).toEqual({
      current: 12,
      previous: 9,
      pendingReview: 3,
    });
  });

  it("returns zeros when DB has no matching leads", async () => {
    mockSelectSequence([[{ count: 0 }], [{ count: 0 }], [{ count: 0 }]]);

    const { getAcquisitionVolume } =
      await import("@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler");

    const result = await getAcquisitionVolume(INPUT);

    expect(result).toEqual({
      current: 0,
      previous: 0,
      pendingReview: 0,
    });
  });

  it("coerces missing count rows to zero", async () => {
    mockSelectSequence([[], [{ count: 5 }], []]);

    const { getAcquisitionVolume } =
      await import("@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler");

    const result = await getAcquisitionVolume(INPUT);

    expect(result).toEqual({
      current: 0,
      previous: 5,
      pendingReview: 0,
    });
  });

  it("issues three separate select calls", async () => {
    mockSelectSequence([[{ count: 1 }], [{ count: 1 }], [{ count: 1 }]]);

    const { getAcquisitionVolume } =
      await import("@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler");

    await getAcquisitionVolume(INPUT);

    const dbClient = getDrizzleDatabaseClientMock.mock.results[0]?.value;
    expect(dbClient.select).toHaveBeenCalledTimes(3);
  });

  it("queries all records without a previous-period query when unbounded", async () => {
    mockSelectSequence([[{ count: 20 }], [{ count: 4 }]]);

    const { getAcquisitionVolume } =
      await import("@/server/workspace/dashboard/query-handler/get-acquisition-volume.query-handler");

    await expect(getAcquisitionVolume({})).resolves.toEqual({
      current: 20,
      previous: null,
      pendingReview: 4,
    });
    const dbClient = getDrizzleDatabaseClientMock.mock.results[0]?.value;
    expect(dbClient.select).toHaveBeenCalledTimes(2);
  });
});
