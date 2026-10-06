import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialCipherError } from "@invessiv/db/credentials/credential-cipher-error.class";
import type { CredentialCipherContext } from "@invessiv/db/credentials/credential-cipher-types";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";

vi.mock("server-only", () => ({}));

const KEYRING_VARIABLE = "CRM_CREDENTIALS_KEYRING";
const encodedOne = randomBytes(32).toString("base64");
const encodedTwo = randomBytes(32).toString("base64");

const context: CredentialCipherContext = {
  customerId: "11111111-1111-4111-8111-111111111111",
  credentialId: "22222222-2222-4222-8222-222222222222",
  field: CredentialSecretField.Secret,
};

function catchCipherError(run: () => unknown): CredentialCipherError {
  try {
    run();
  } catch (error) {
    if (error instanceof CredentialCipherError) return error;
    throw error;
  }
  throw new Error("Expected the service to throw");
}

describe("credentialCryptoService", () => {
  beforeEach(() => {
    vi.stubEnv(KEYRING_VARIABLE, undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is not configured without the variable and refuses to work", () => {
    expect(credentialCryptoService.isConfigured()).toBe(false);
    expect(
      catchCipherError(() => credentialCryptoService.encrypt("value", context))
        .code,
    ).toBe(CredentialCipherErrorCode.KeyringMissing);
    expect(
      catchCipherError(() =>
        credentialCryptoService.decrypt("v1.1.a.b", context),
      ).code,
    ).toBe(CredentialCipherErrorCode.KeyringMissing);
  });

  it("is not configured with an invalid keyring", () => {
    vi.stubEnv(KEYRING_VARIABLE, "1:too-short");

    expect(credentialCryptoService.isConfigured()).toBe(false);
    expect(
      catchCipherError(() => credentialCryptoService.encrypt("value", context))
        .code,
    ).toBe(CredentialCipherErrorCode.KeyringInvalid);
  });

  it("works once the variable is set in the same process", () => {
    expect(credentialCryptoService.isConfigured()).toBe(false);

    vi.stubEnv(KEYRING_VARIABLE, `1:${encodedOne}`);

    expect(credentialCryptoService.isConfigured()).toBe(true);
    const stored = credentialCryptoService.encrypt("pässword", context);
    expect(credentialCryptoService.decrypt(stored, context)).toBe("pässword");
  });

  it("follows a changed variable value", () => {
    vi.stubEnv(KEYRING_VARIABLE, `1:${encodedOne}`);
    const old = credentialCryptoService.encrypt("value", context);

    vi.stubEnv(KEYRING_VARIABLE, `1:${encodedOne},2:${encodedTwo}`);
    const renewed = credentialCryptoService.encrypt("value", context);

    expect(old.startsWith("v1.1.")).toBe(true);
    expect(renewed.startsWith("v1.2.")).toBe(true);
    expect(credentialCryptoService.decrypt(old, context)).toBe("value");

    vi.stubEnv(KEYRING_VARIABLE, undefined);
    expect(credentialCryptoService.isConfigured()).toBe(false);
  });
});
