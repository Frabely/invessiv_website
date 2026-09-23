import type { z } from "zod";
import type { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

export type UpdateTaskResult =
  | { ok: true; task: TaskDto }
  | {
      ok: false;
      code: typeof TaskErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof TaskErrorCode.TaskNotFound }
  | { ok: false; code: typeof TaskErrorCode.AssigneeNotActive }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<TaskDto>;
    };
