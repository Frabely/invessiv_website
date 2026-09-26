import { describe, expect, it } from "vitest";

import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { TaskFormValidationCode } from "@/common/constants/crm/forms/task-form-validation-codes";
import {
  applyActionSide,
  createTaskFormValues,
  toCreateTaskRequest,
  toUpdateTaskRequest,
  validateTaskForm,
} from "@/common/patterns/crm/task-form";

const TASK: TaskDto = {
  id: "66666666-6666-4666-8666-666666666666",
  projectId: "33333333-3333-4333-8333-333333333333",
  title: "Zugangsdaten bereitstellen",
  description: "Hosting",
  status: TaskStatus.Open,
  actionSide: TaskActionSide.Customer,
  visibleToCustomer: true,
  assigneeMemberId: "77777777-7777-4777-8777-777777777777",
  dueOn: "2026-10-01",
  completedAt: null,
  completedByMemberId: null,
  version: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("createTaskFormValues", () => {
  it("starts a new task internal, invisible, unassigned and undated", () => {
    expect(createTaskFormValues(null)).toEqual({
      title: "",
      description: "",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
      assigneeMemberId: null,
      dueOn: "",
    });
  });

  it("copies an existing task and turns a missing deadline into an empty input", () => {
    expect(createTaskFormValues(TASK)).toMatchObject({
      title: "Zugangsdaten bereitstellen",
      actionSide: TaskActionSide.Customer,
      assigneeMemberId: TASK.assigneeMemberId,
      dueOn: "2026-10-01",
    });
    expect(createTaskFormValues({ ...TASK, dueOn: null }).dueOn).toBe("");
  });
});

describe("applyActionSide", () => {
  it("switches visibility on when the customer has to act", () => {
    const values = createTaskFormValues(null);

    expect(applyActionSide(values, TaskActionSide.Customer)).toMatchObject({
      actionSide: TaskActionSide.Customer,
      visibleToCustomer: true,
    });
  });

  it("keeps the visibility flag when the internal side takes over again", () => {
    const customerSide = applyActionSide(
      createTaskFormValues(null),
      TaskActionSide.Customer,
    );

    expect(
      applyActionSide(customerSide, TaskActionSide.Internal),
    ).toMatchObject({
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: true,
    });
  });
});

describe("validateTaskForm", () => {
  it("accepts a titled task with or without a real due day", () => {
    expect(
      validateTaskForm({ ...createTaskFormValues(null), title: "A" }),
    ).toEqual({});
    expect(
      validateTaskForm({
        ...createTaskFormValues(null),
        title: "A",
        dueOn: "2026-10-01",
      }),
    ).toEqual({});
  });

  it("flags a blank title and an impossible or malformed due day", () => {
    expect(validateTaskForm(createTaskFormValues(null)).title).toBe(
      TaskFormValidationCode.TitleRequired,
    );
    for (const dueOn of ["2026-02-30", "01.10.2026", "2026-13-01"]) {
      expect(
        validateTaskForm({ ...createTaskFormValues(null), title: "A", dueOn })
          .dueOn,
      ).toBe(TaskFormValidationCode.DueOnInvalid);
    }
  });
});

describe("request mapping", () => {
  it("trims text and turns an empty due input into null on create", () => {
    expect(
      toCreateTaskRequest({
        ...createTaskFormValues(null),
        title: "  Logo  ",
        description: "  x ",
      }),
    ).toEqual({
      title: "Logo",
      description: "x",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
      assigneeMemberId: null,
      dueOn: null,
    });
  });

  it("keeps the current assignee on update when none was picked and echoes the version", () => {
    const values = { ...createTaskFormValues(TASK), assigneeMemberId: null };

    expect(toUpdateTaskRequest(values, TASK)).toMatchObject({
      assigneeMemberId: TASK.assigneeMemberId,
      version: 4,
    });
  });
});
