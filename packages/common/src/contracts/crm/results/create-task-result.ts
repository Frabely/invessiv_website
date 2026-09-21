import type { z } from "zod";
import type { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

export type CreateTaskResult =
  | { ok: true; task: TaskDto }
  | {
      ok: false;
      code: typeof TaskErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof TaskErrorCode.ProjectNotFound }
  | { ok: false; code: typeof TaskErrorCode.AssigneeNotActive };
