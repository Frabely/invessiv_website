import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_API_ERROR_CODE_VALUES,
  CredentialApiErrorCode,
} from "./credential-api-error-code";
import {
  CREDENTIAL_CIPHER_ERROR_CODE_VALUES,
  CredentialCipherErrorCode,
} from "./credential-cipher-error-codes";
import { CREDENTIAL_LIMITS } from "./credential-limits";
import {
  CREDENTIAL_REVEAL_INTENT_VALUES,
  CredentialRevealIntent,
} from "./credential-reveal-intents";
import {
  CREDENTIAL_SECRET_FIELD_VALUES,
  CredentialSecretField,
} from "./credential-secret-fields";
import { CREDENTIAL_SIDE_VALUES, CredentialSide } from "./credential-sides";
import { CREDENTIAL_TYPE_VALUES, CredentialType } from "./credential-types";

describe("credential const objects", () => {
  it.each([
    [CredentialSecretField, CREDENTIAL_SECRET_FIELD_VALUES],
    [CredentialCipherErrorCode, CREDENTIAL_CIPHER_ERROR_CODE_VALUES],
    [CredentialType, CREDENTIAL_TYPE_VALUES],
    [CredentialSide, CREDENTIAL_SIDE_VALUES],
    [CredentialRevealIntent, CREDENTIAL_REVEAL_INTENT_VALUES],
    [CredentialApiErrorCode, CREDENTIAL_API_ERROR_CODE_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });

  it("keeps the stored values the database checks rely on", () => {
    expect(CREDENTIAL_TYPE_VALUES).toEqual([
      "domain_registrar",
      "hosting",
      "email",
      "cms",
      "database",
      "analytics",
      "api_service",
      "other",
    ]);
    expect(CREDENTIAL_SIDE_VALUES).toEqual(["internal", "customer"]);
  });

  it("keeps the documented limits", () => {
    expect(CREDENTIAL_LIMITS).toEqual({
      titleMax: 120,
      urlMax: 2048,
      usernameMax: 320,
      secretMax: 4096,
      noteMax: 4000,
      revealWindowSeconds: 60,
      revealsPerWindowInternal: 20,
      revealsPerWindowPortal: 10,
      maxPortalCreatedPerCustomer: 100,
      autoHideSeconds: 30,
    });
  });
});
