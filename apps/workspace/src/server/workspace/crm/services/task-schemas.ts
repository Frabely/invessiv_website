import { z } from "zod";

import { TaskFieldLimits } from "@invessiv/common/constants/crm/forms/task-field-limits";
import {
  TASK_ACTION_SIDE_VALUES,
  TaskActionSide,
} from "@invessiv/common/constants/crm/task-action-sides";
import { TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1).max(TaskFieldLimits.TitleMaxLength),
  description: z.string().trim().max(TaskFieldLimits.DescriptionMaxLength),
  actionSide: z.enum(TASK_ACTION_SIDE_VALUES),
  visibleToCustomer: z.boolean(),
  dueOn: z.iso
    .date()
    .nullish()
    .transform((value) => value ?? null),
});

/** A task the customer has to act on must be visible to them; the request is rejected, not fixed. */
function refineCustomerActionVisible(
  data: { actionSide: TaskActionSide; visibleToCustomer: boolean },
  context: z.RefinementCtx,
) {
  if (data.actionSide === TaskActionSide.Customer && !data.visibleToCustomer) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["visibleToCustomer"],
      message: "A task the customer has to act on must be visible to them",
    });
  }
}

export const taskSchemas = {
  entityId: z.uuid(),
  create: taskFieldsSchema
    .extend({
      assigneeMemberId: z
        .uuid()
        .nullish()
        .transform((value) => value ?? null),
    })
    .superRefine(refineCustomerActionVisible),
  update: taskFieldsSchema
    .extend({
      assigneeMemberId: z.uuid(),
      version: z.int().positive(),
    })
    .superRefine(refineCustomerActionVisible),
  changeStatus: z.object({
    status: z.enum(TASK_STATUS_VALUES),
    version: z.int().positive(),
  }),
} as const;
