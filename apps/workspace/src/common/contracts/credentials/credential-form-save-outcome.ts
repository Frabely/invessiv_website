import type { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

/**
 * What the shared credential form gets back from its owner after a save. `current` on success is
 * the stored entry after an edit; a conflict carries the fresh entry so the form can rebase.
 */
export type CredentialFormSaveOutcome<TEntry> =
  | { ok: true; current?: TEntry }
  | { ok: false; code: CredentialApiErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TEntry;
    };
