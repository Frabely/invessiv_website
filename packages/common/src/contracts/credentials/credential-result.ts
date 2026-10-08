import type { CredentialApiErrorCode } from "../../constants/credentials/credential-api-error-code";
import type { ConcurrencyErrorCode } from "../../constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "../concurrency/version-conflict.dto";
import type { CredentialDto } from "./credential.dto";

/** `TCurrent` is the entry a conflict hands back; the portal narrows it to its own view. */
export type CredentialResult<T, TCurrent = CredentialDto> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: Exclude<
        CredentialApiErrorCode,
        typeof CredentialApiErrorCode.RateLimited
      >;
    }
  | {
      ok: false;
      code: typeof CredentialApiErrorCode.RateLimited;
      retryAfterSeconds: number;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<TCurrent>;
    };
