import type { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";

/** Answer of a credential request that carries no version: list, create and reveal. */
export type CredentialClientResult<TValue> =
  { ok: true; value: TValue } | { ok: false; code: CredentialApiErrorCode };
