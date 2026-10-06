import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_CIPHER_ERROR_CODE_VALUES,
  CredentialCipherErrorCode,
} from "./credential-cipher-error-codes";
import {
  CREDENTIAL_SECRET_FIELD_VALUES,
  CredentialSecretField,
} from "./credential-secret-fields";

describe("credential const objects", () => {
  it.each([
    [CredentialSecretField, CREDENTIAL_SECRET_FIELD_VALUES],
    [CredentialCipherErrorCode, CREDENTIAL_CIPHER_ERROR_CODE_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });
});
