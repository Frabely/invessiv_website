import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type ProjectLineItemMutationClientResult =
  | { ok: true; projectLineItem: ProjectLineItemDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: ProjectLineItemDto;
    }
  | { ok: false; code: ProjectLineItemErrorCode };
