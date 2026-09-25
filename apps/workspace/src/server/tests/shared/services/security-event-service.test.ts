import { describe, expect, it, vi } from "vitest";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { securityEventService } from "@/server/shared/services/security-event-service";

vi.mock("server-only", () => ({}));

const { mockValues } = vi.hoisted(() => ({
  mockValues: vi.fn(),
}));

describe("securityEventService.createSecurityEvent", () => {
  it("lets the database own created_at while preserving the event time", async () => {
    const tx = {
      insert: vi.fn(() => ({ values: mockValues })),
    } as unknown as ContactDatabaseTransaction;
    const occurredAt = new Date("2026-09-13T10:00:00.000Z");

    await securityEventService.createSecurityEvent(tx, {
      type: SecurityEventType.WorkspaceOwnerBootstrapped,
      actor: { type: ActorType.User, userId: "user-uuid-1" },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: "member-uuid-1",
      occurredAt,
    });

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        occurred_at: occurredAt,
        actor_user_id: "user-uuid-1",
      }),
    );
    expect(mockValues.mock.calls[0]?.[0]).not.toHaveProperty("created_at");
  });
});
