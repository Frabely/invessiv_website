import type { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";

/** A delete has nothing to hand back on success; a conflict still carries the fresh entry. */
export type CredentialDeleteClientResult =
  | { ok: true }
  | { ok: false; code: CredentialApiErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: CredentialDto;
    };
