import type { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type TaskMutationClientResult =
  | { ok: true; task: TaskDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TaskDto;
    }
  | { ok: false; code: TaskErrorCode };
