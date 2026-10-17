import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  migrate: vi.fn(),
  configure: vi.fn(),
  execute: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("node:child_process", () => ({ execFileSync: mocks.migrate }));
vi.mock("./database-target", () => ({
  configureDatabaseUrlFromTarget: mocks.configure,
}));
vi.mock("@invessiv/db/core", () => ({
  getDatabaseClient: () => ({ query: mocks.query }),
  getDrizzleDatabaseClient: () => ({ transaction: mocks.transaction }),
  sqlCheckIn: vi.fn(),
  sqlActorInvariant: vi.fn(),
}));

describe("database reset customer numbering", () => {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;
  const dialect = new PgDialect();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.query.mockResolvedValue([]);
    mocks.execute.mockResolvedValue([]);
    mocks.from.mockResolvedValue([{ total: 0 }]);
    mocks.select.mockReturnValue({ from: mocks.from });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ execute: mocks.execute, select: mocks.select }),
    );
    process.exitCode = 0;
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it.each(["development", "preview"])(
    "restarts %s customer numbering only after migrations and an empty-table check",
    async (target) => {
      process.argv = ["node", "reset-database.ts", target];
      await import("./reset-database");

      await vi.waitFor(() =>
        expect(console.log).toHaveBeenCalledWith(
          `Reset ${target} customer numbering: next customer is K0001.`,
        ),
      );
      expect(mocks.configure).toHaveBeenCalledWith(target);
      expect(mocks.query.mock.calls.map(([query]) => query)).toEqual([
        "DROP SCHEMA IF EXISTS public CASCADE",
        "CREATE SCHEMA public",
      ]);
      expect(mocks.migrate.mock.calls[0]?.[1]?.at(-1)).toBe(target);
      expect(mocks.migrate.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.transaction.mock.invocationCallOrder[0]!,
      );
      expect(
        mocks.execute.mock.calls.map(
          ([statement]) => dialect.sqlToQuery(statement).sql,
        ),
      ).toEqual([
        'LOCK TABLE "customers" IN SHARE ROW EXCLUSIVE MODE',
        "ALTER SEQUENCE public.customers_customer_number_seq RESTART WITH 1",
      ]);
      expect(mocks.from.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.execute.mock.invocationCallOrder[1]!,
      );
      expect(process.exitCode).toBe(0);
    },
  );

  it("refuses to restart numbering when customers remain", async () => {
    process.argv = ["node", "reset-database.ts", "development"];
    mocks.from.mockResolvedValue([{ total: 1 }]);
    await import("./reset-database");

    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Cannot restart customer numbering after reset: customers table is not empty.",
    );
  });

  it("rejects production before connecting or executing a reset", async () => {
    process.argv = ["node", "reset-database.ts", "production"];
    await import("./reset-database");

    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(mocks.configure).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.migrate).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
