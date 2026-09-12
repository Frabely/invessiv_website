import { beforeEach, describe, expect, it, vi } from "vitest";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import type { VersionedPatch } from "@/server/workspace/shared/update-versioned-types";

vi.mock("server-only", () => ({}));

const table = pgTable("versioned_test_rows", {
  id: text("id").primaryKey(),
  display_name: text("display_name").notNull(),
  version: integer("version").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull(),
});

type Row = typeof table.$inferSelect;
type Patch = VersionedPatch<typeof table>;
type ManagedPatchKey = Extract<
  "created_at" | "id" | "updated_at" | "version",
  keyof Patch
>;

const MANAGED_COLUMNS_ARE_EXCLUDED: ManagedPatchKey extends never
  ? true
  : false = true;
const DOMAIN_COLUMN_IS_WRITABLE: "display_name" extends keyof Patch
  ? true
  : false = true;

const CREATED = new Date("2026-01-01T00:00:00.000Z");
const UPDATED = new Date("2026-01-02T00:00:00.000Z");

function row(values: Pick<Row, "display_name" | "id" | "version">): Row {
  return { ...values, created_at: CREATED, updated_at: UPDATED };
}

function createTx(args: { updatedRows: Row[]; currentRows: Row[] }) {
  const set = vi.fn();
  const where = vi.fn();

  const tx = {
    update: vi.fn(() => ({
      set: (values: Record<string, unknown>) => {
        set(values);
        return {
          where: (condition: unknown) => {
            where(condition);
            return { returning: () => Promise.resolve(args.updatedRows) };
          },
        };
      },
    })),
    select: vi.fn(() => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(args.currentRows) }),
      }),
    })),
  };

  return { tx, set, where };
}

const toDto = (row: Row) => ({
  id: row.id,
  displayName: row.display_name,
  version: row.version,
});

describe("updateVersioned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("types patches without managed columns", () => {
    expect(MANAGED_COLUMNS_ARE_EXCLUDED).toBe(true);
    expect(DOMAIN_COLUMN_IS_WRITABLE).toBe(true);
  });

  it("returns the mapped DTO when exactly one row matched", async () => {
    const { tx } = createTx({
      updatedRows: [row({ id: "c1", version: 2, display_name: "Neu" })],
      currentRows: [],
    });

    const result = await updateVersioned({
      tx: tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: { display_name: "Neu" },
      toDto,
    });

    expect(result).toEqual({
      ok: true,
      value: { id: "c1", displayName: "Neu", version: 2 },
    });
  });

  it("bumps the version in the same statement and sets updated_at", async () => {
    const { tx, set } = createTx({
      updatedRows: [row({ id: "c1", version: 2, display_name: "Neu" })],
      currentRows: [],
    });

    await updateVersioned({
      tx: tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: { display_name: "Neu" },
      toDto,
    });

    const values = set.mock.calls[0][0] as Record<string, unknown>;
    expect(values).toHaveProperty("version");
    expect(values).toHaveProperty("updated_at");
    expect(values.updated_at).toBeInstanceOf(Date);
    expect(values.display_name).toBe("Neu");
  });

  it("returns version_conflict with the current state when the row still exists", async () => {
    const { tx } = createTx({
      updatedRows: [],
      currentRows: [row({ id: "c1", version: 7, display_name: "Fremd" })],
    });

    const result = await updateVersioned({
      tx: tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: { display_name: "Meins" },
      toDto,
    });

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 7,
        current: { id: "c1", displayName: "Fremd", version: 7 },
      },
    });
  });

  it("returns not_found instead of version_conflict when the row is gone", async () => {
    const { tx } = createTx({ updatedRows: [], currentRows: [] });

    const result = await updateVersioned({
      tx: tx as never,
      table,
      id: "weg",
      expectedVersion: 1,
      patch: { display_name: "Egal" },
      toDto,
    });

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });
  });

  it("keeps the two failure cases distinguishable so the UI does not lie", async () => {
    const conflictTx = createTx({
      updatedRows: [],
      currentRows: [row({ id: "c1", version: 2, display_name: "Da" })],
    });
    const missingTx = createTx({ updatedRows: [], currentRows: [] });

    const conflict = await updateVersioned({
      tx: conflictTx.tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: {},
      toDto,
    });
    const missing = await updateVersioned({
      tx: missingTx.tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: {},
      toDto,
    });

    expect(conflict.ok).toBe(false);
    expect(missing.ok).toBe(false);
    expect(!conflict.ok && conflict.code).not.toBe(!missing.ok && missing.code);
  });

  it("re-reads only when the UPDATE matched no row", async () => {
    const { tx } = createTx({
      updatedRows: [row({ id: "c1", version: 2, display_name: "Neu" })],
      currentRows: [],
    });

    await updateVersioned({
      tx: tx as never,
      table,
      id: "c1",
      expectedVersion: 1,
      patch: {},
      toDto,
    });

    expect(tx.select).not.toHaveBeenCalled();
  });
});
