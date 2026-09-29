import type { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type ProjectMutationClientResult =
  | { ok: true; project: ProjectDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: ProjectDto;
    }
  | { ok: false; code: ProjectErrorCode };
