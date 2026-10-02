import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { positionService } from "@/server/shared/services/position-service";

vi.mock("server-only", () => ({}));

const dialect = new PgDialect();

function recordingTransaction() {
  const statements: string[] = [];
  const tx = {
    execute: vi.fn(async (query: SQL) => {
      statements.push(dialect.sqlToQuery(query).sql);
    }),
  } as unknown as ContactDatabaseTransaction;
  return { tx, statements };
}

describe("positionService.withDeferredPositions", () => {
  it("defers the unique index around the writes and checks it right after", async () => {
    const { tx, statements } = recordingTransaction();

    const result = await positionService.withDeferredPositions(
      tx,
      "things_position_unique",
      async () => {
        statements.push("writes");
        return "done";
      },
    );

    expect(result).toBe("done");
    expect(statements).toEqual([
      'set constraints "things_position_unique" deferred',
      "writes",
      'set constraints "things_position_unique" immediate',
    ]);
  });

  it("leaves the index deferred when a write fails, so the rolled-back transaction decides", async () => {
    const { tx, statements } = recordingTransaction();

    await expect(
      positionService.withDeferredPositions(tx, "things_position_unique", () =>
        Promise.reject(new Error("write failed")),
      ),
    ).rejects.toThrow("write failed");

    expect(statements).toEqual([
      'set constraints "things_position_unique" deferred',
    ]);
  });
});
