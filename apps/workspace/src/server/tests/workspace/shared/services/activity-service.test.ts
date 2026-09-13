import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { activities } from "@invessiv/db/record-configuration";
import { activityService } from "@/server/workspace/shared/services/activity-service";

const { transactionMock } = vi.hoisted(() => ({
  transactionMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: () => ({ transaction: transactionMock }),
}));

type InsertCall = { table: unknown; values: Record<string, unknown> };

function createTransaction() {
  const calls: InsertCall[] = [];
  const tx = {
    insert(table: unknown) {
      return {
        async values(values: Record<string, unknown>) {
          calls.push({ table, values });
        },
      };
    },
  };

  return { tx: tx as unknown as ContactDatabaseTransaction, calls };
}

describe("activityService", () => {
  beforeEach(() => {
    transactionMock.mockReset();
  });

  it("writes a lead activity only to the activities table", async () => {
    const { tx, calls } = createTransaction();

    await activityService.createActivity(tx, {
      leadId: "lead-1",
      type: ActivityType.Note,
      actorType: ActorType.User,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: activities,
      values: { lead_id: "lead-1", customer_id: null, project_id: null },
    });
    expect(calls[0].values.id).toEqual(expect.any(String));
  });

  it("writes a customer-only activity without a lead reference", async () => {
    const { tx, calls } = createTransaction();

    await activityService.createActivity(tx, {
      customerId: "customer-1",
      type: ActivityType.Created,
      actorType: ActorType.System,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      table: activities,
      values: { lead_id: null, customer_id: "customer-1" },
    });
  });

  it("preserves project and customer references in a transaction", async () => {
    const { tx, calls } = createTransaction();

    await activityService.createActivity(tx, {
      customerId: "customer-1",
      projectId: "project-1",
      type: ActivityType.FieldChange,
      actorType: ActorType.User,
    });

    expect(calls[0].values).toMatchObject({
      customer_id: "customer-1",
      project_id: "project-1",
    });
  });

  it("uses one timestamp for occurred_at and created_at when none is given", async () => {
    const { tx, calls } = createTransaction();

    await activityService.createActivity(tx, {
      leadId: "lead-1",
      type: ActivityType.Note,
      actorType: ActorType.System,
    });

    expect(calls[0].values.occurred_at).toBe(calls[0].values.created_at);
  });

  it("keeps an explicit occurredAt", async () => {
    const { tx, calls } = createTransaction();
    const occurredAt = new Date("2026-09-12T12:00:00.000Z");

    await activityService.createActivity(tx, {
      leadId: "lead-1",
      type: ActivityType.Note,
      occurredAt,
      actorType: ActorType.System,
    });

    expect(calls[0].values.occurred_at).toBe(occurredAt);
  });

  it("runs appendActivity inside one database transaction", async () => {
    const { tx, calls } = createTransaction();
    transactionMock.mockImplementation(
      (run: (transaction: ContactDatabaseTransaction) => Promise<void>) =>
        run(tx),
    );

    await activityService.appendActivity({
      leadId: "lead-1",
      type: ActivityType.StatusChange,
      actorType: ActorType.System,
    });

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(calls.map((call) => call.table)).toEqual([activities]);
  });
});
