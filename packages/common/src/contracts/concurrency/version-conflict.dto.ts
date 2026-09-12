import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

/**
 * Body of every 409 response. `current` is the fresh state so the UI can show it
 * without refetching and without discarding the user's input.
 */
export interface VersionConflictDto<TCurrent> {
  /** Narrowed to the one code, so a 409 body is identifiable without a status check. */
  code: typeof ConcurrencyErrorCode.VersionConflict;
  /** The version the client has to send on its retry. */
  currentVersion: number;
  /**
   * The full current record, not a diff. The client shows it next to the unsaved input
   * and lets the user resubmit — it never drops what was typed.
   */
  current: TCurrent;
}

/**
 * Result of every versioned write. `not_found` and `version_conflict` stay deliberately
 * distinguishable so the UI never shows "someone was faster" for a deleted row.
 */
export type VersionedWriteResult<TDto> =
  | { ok: true; value: TDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<TDto>;
    }
  | { ok: false; code: typeof ConcurrencyErrorCode.NotFound };
