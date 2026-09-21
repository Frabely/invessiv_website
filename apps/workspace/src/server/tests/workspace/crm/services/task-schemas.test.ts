import { describe, expect, it } from "vitest";

import { TaskFieldLimits } from "@invessiv/common/constants/crm/forms/task-field-limits";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { taskSchemas } from "@/server/workspace/crm/services/task-schemas";

const MEMBER_ID = "77777777-7777-4777-8777-777777777777";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Logo liefern",
    description: "",
    actionSide: TaskActionSide.Internal,
    visibleToCustomer: false,
    assigneeMemberId: null,
    dueOn: null,
    ...overrides,
  };
}

describe("taskSchemas.create", () => {
  it("accepts a minimal internal task and defaults the optional fields to null", () => {
    const result = taskSchemas.create.safeParse({
      title: "  Logo liefern  ",
      description: "",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      title: "Logo liefern",
      assigneeMemberId: null,
      dueOn: null,
    });
  });

  it("rejects a blank title and an over-long title", () => {
    expect(
      taskSchemas.create.safeParse(createInput({ title: "   " })).success,
    ).toBe(false);
    expect(
      taskSchemas.create.safeParse(
        createInput({ title: "x".repeat(TaskFieldLimits.TitleMaxLength + 1) }),
      ).success,
    ).toBe(false);
  });

  it("rejects an over-long description", () => {
    expect(
      taskSchemas.create.safeParse(
        createInput({
          description: "x".repeat(TaskFieldLimits.DescriptionMaxLength + 1),
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects a customer-side task that is not visible to the customer", () => {
    const result = taskSchemas.create.safeParse(
      createInput({
        actionSide: TaskActionSide.Customer,
        visibleToCustomer: false,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["visibleToCustomer"]);
  });

  it("accepts a visible customer-side task and an invisible internal one", () => {
    expect(
      taskSchemas.create.safeParse(
        createInput({
          actionSide: TaskActionSide.Customer,
          visibleToCustomer: true,
        }),
      ).success,
    ).toBe(true);
    expect(taskSchemas.create.safeParse(createInput()).success).toBe(true);
  });

  it("rejects an unknown action side and a malformed assignee id", () => {
    expect(
      taskSchemas.create.safeParse(createInput({ actionSide: "partner" }))
        .success,
    ).toBe(false);
    expect(
      taskSchemas.create.safeParse(createInput({ assigneeMemberId: "nobody" }))
        .success,
    ).toBe(false);
  });

  it("accepts a real calendar date and rejects an impossible or malformed one", () => {
    expect(
      taskSchemas.create.safeParse(createInput({ dueOn: "2026-10-01" }))
        .success,
    ).toBe(true);
    expect(
      taskSchemas.create.safeParse(createInput({ dueOn: "2026-02-30" }))
        .success,
    ).toBe(false);
    expect(
      taskSchemas.create.safeParse(createInput({ dueOn: "01.10.2026" }))
        .success,
    ).toBe(false);
  });
});

describe("taskSchemas.update", () => {
  it("requires the assignee and a positive version", () => {
    const valid = createInput({ assigneeMemberId: MEMBER_ID, version: 3 });

    expect(taskSchemas.update.safeParse(valid).success).toBe(true);
    expect(
      taskSchemas.update.safeParse({ ...valid, assigneeMemberId: null })
        .success,
    ).toBe(false);
    expect(taskSchemas.update.safeParse({ ...valid, version: 0 }).success).toBe(
      false,
    );
  });

  it("applies the customer-visibility rule as well", () => {
    expect(
      taskSchemas.update.safeParse(
        createInput({
          assigneeMemberId: MEMBER_ID,
          version: 1,
          actionSide: TaskActionSide.Customer,
          visibleToCustomer: false,
        }),
      ).success,
    ).toBe(false);
  });
});

describe("taskSchemas.changeStatus", () => {
  it("accepts every status with a positive version and rejects anything else", () => {
    for (const status of Object.values(TaskStatus)) {
      expect(
        taskSchemas.changeStatus.safeParse({ status, version: 1 }).success,
      ).toBe(true);
    }
    expect(
      taskSchemas.changeStatus.safeParse({ status: "blocked", version: 1 })
        .success,
    ).toBe(false);
    expect(
      taskSchemas.changeStatus.safeParse({ status: "done", version: 0 })
        .success,
    ).toBe(false);
  });
});

describe("taskSchemas.entityId", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(taskSchemas.entityId.safeParse(MEMBER_ID).success).toBe(true);
    expect(taskSchemas.entityId.safeParse("42").success).toBe(false);
  });
});
