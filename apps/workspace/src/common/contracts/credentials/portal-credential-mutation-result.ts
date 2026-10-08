import type { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";

/** A write can be confirmed without exposing metadata to a contact lacking read permission. */
export type PortalCredentialMutationResult =
  | { ok: true; value: PortalCredentialDto | null }
  | { ok: false; code: CredentialApiErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: PortalCredentialDto | null;
      currentVersion: number;
    };
