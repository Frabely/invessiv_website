import { describe, expect, it } from "vitest";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskRow } from "@invessiv/common/contracts/crm/rows/task-row";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";

const OPEN_ROW: TaskRow = {
  id: "66666666-6666-4666-8666-666666666666",
  project_id: "33333333-3333-4333-8333-333333333333",
  title: "Zugangsdaten bereitstellen",
  description: "Hosting und Domain",
  status: TaskStatus.Open,
  action_side: TaskActionSide.Customer,
  visible_to_customer: true,
  assignee_member_id: "77777777-7777-4777-8777-777777777777",
  due_on: "2026-10-01",
  completed_at: null,
  completed_by_member_id: null,
  completed_by_portal_membership_id: null,
  version: 3,
  created_at: new Date("2026-01-01T10:00:00.000Z"),
  updated_at: new Date("2026-01-02T10:00:00.000Z"),
};

describe("tasksMapperService.toDto", () => {
  it("maps every field to camelCase with ISO timestamps", () => {
    expect(tasksMapperService.toDto(OPEN_ROW)).toEqual({
      id: OPEN_ROW.id,
      projectId: OPEN_ROW.project_id,
      title: "Zugangsdaten bereitstellen",
      description: "Hosting und Domain",
      status: "open",
      actionSide: "customer",
      visibleToCustomer: true,
      assigneeMemberId: OPEN_ROW.assignee_member_id,
      dueOn: "2026-10-01",
      completedAt: null,
      completedByMemberId: null,
      completedByCustomer: false,
      version: 3,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
    });
  });

  it("keeps null for an undated task and maps the completion data of a done task", () => {
    const dto = tasksMapperService.toDto({
      ...OPEN_ROW,
      status: TaskStatus.Done,
      due_on: null,
      completed_at: new Date("2026-01-03T09:00:00.000Z"),
      completed_by_member_id: OPEN_ROW.assignee_member_id,
    });

    expect(dto.dueOn).toBeNull();
    expect(dto.completedAt).toBe("2026-01-03T09:00:00.000Z");
    expect(dto.completedByMemberId).toBe(OPEN_ROW.assignee_member_id);
    expect(dto.completedByCustomer).toBe(false);
  });

  it("flags a portal completion without exposing the membership id", () => {
    const dto = tasksMapperService.toDto({
      ...OPEN_ROW,
      status: TaskStatus.Done,
      completed_at: new Date("2026-01-03T09:00:00.000Z"),
      completed_by_portal_membership_id: "88888888-8888-4888-8888-888888888888",
    });

    expect(dto.completedByCustomer).toBe(true);
    expect(dto.completedByMemberId).toBeNull();
    expect(JSON.stringify(dto)).not.toContain(
      "88888888-8888-4888-8888-888888888888",
    );
  });
});
