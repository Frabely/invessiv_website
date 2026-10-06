import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { credentialCipher } from "./credential-cipher";
import { CredentialCipherError } from "./credential-cipher-error.class";
import { parseCredentialKeyring } from "./credential-keyring";
import type { CredentialCipherContext } from "./credential-cipher-types";

const encodedOne = randomBytes(32).toString("base64");
const encodedTwo = randomBytes(32).toString("base64");
const ringOne = parseCredentialKeyring(`1:${encodedOne}`);
const ringOneTwo = parseCredentialKeyring(`1:${encodedOne},2:${encodedTwo}`);

const context: CredentialCipherContext = {
  customerId: "11111111-1111-4111-8111-111111111111",
  credentialId: "22222222-2222-4222-8222-222222222222",
  field: CredentialSecretField.Secret,
};
const PLAINTEXT = "S3cret-Paßwort-🔐";

function catchCipherError(run: () => unknown): CredentialCipherError {
  try {
    run();
  } catch (error) {
    if (error instanceof CredentialCipherError) return error;
    throw error;
  }
  throw new Error("Expected the cipher to throw");
}

/** Flips one bit in the given dot-separated part at a byte offset (negative counts from the end). */
function tamper(ciphertext: string, partIndex: number, byteOffset: number) {
  const parts = ciphertext.split(".");
  const bytes = Buffer.from(parts[partIndex], "base64url");
  const index = byteOffset < 0 ? bytes.length + byteOffset : byteOffset;
  bytes[index] ^= 0x01;
  parts[partIndex] = bytes.toString("base64url");
  return parts.join(".");
}

describe("credentialCipher round trip", () => {
  it.each([
    ["umlauts", "Größe äöü ÄÖÜ ß"],
    ["emoji", "🔐👩‍💻 key ✅"],
    ["line breaks", "line one\nline two\r\nline three\ttab"],
    ["10 000 characters", "aß🔑".repeat(2500)],
    ["an empty string", ""],
  ])("restores %s without loss", (_label, plaintext) => {
    const stored = credentialCipher.encrypt(ringOne, plaintext, context);

    expect(credentialCipher.decrypt(ringOne, stored, context)).toBe(plaintext);
  });

  it("writes the documented storage format", () => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    const parts = stored.split(".");

    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
    expect(parts[1]).toBe("1");
    expect(Buffer.from(parts[2], "base64url")).toHaveLength(12);
    expect(Buffer.from(parts[3], "base64url")).toHaveLength(
      Buffer.byteLength(PLAINTEXT, "utf8") + 16,
    );
    expect(stored).toMatch(/^[A-Za-z0-9._-]+$/);
    expect(stored).not.toContain(PLAINTEXT);
  });

  it("produces a different ciphertext for the same value", () => {
    const first = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    const second = credentialCipher.encrypt(ringOne, PLAINTEXT, context);

    expect(first).not.toBe(second);
    expect(first.split(".")[2]).not.toBe(second.split(".")[2]);
  });

  it("treats uppercase ids as the same row", () => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, {
      ...context,
      customerId: "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA",
    });

    expect(
      credentialCipher.decrypt(ringOne, stored, {
        ...context,
        customerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    ).toBe(PLAINTEXT);
  });
});

describe("credentialCipher tamper protection", () => {
  it.each([
    ["the nonce", 2, 0],
    ["the ciphertext", 3, 0],
    ["the auth tag", 3, -1],
  ])("fails when a byte of %s changes", (_label, partIndex, byteOffset) => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    const tampered = tamper(stored, partIndex, byteOffset);

    const error = catchCipherError(() =>
      credentialCipher.decrypt(ringOne, tampered, context),
    );

    expect(error.code).toBe(CredentialCipherErrorCode.DecryptionFailed);
  });

  it.each([
    [
      "another customer",
      { ...context, customerId: "33333333-3333-4333-8333-333333333333" },
    ],
    [
      "another credential",
      { ...context, credentialId: "33333333-3333-4333-8333-333333333333" },
    ],
    ["another field", { ...context, field: CredentialSecretField.Note }],
    [
      "swapped ids",
      {
        ...context,
        customerId: context.credentialId,
        credentialId: context.customerId,
      },
    ],
  ])("fails for %s", (_label, otherContext) => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);

    const error = catchCipherError(() =>
      credentialCipher.decrypt(ringOne, stored, otherContext),
    );

    expect(error.code).toBe(CredentialCipherErrorCode.DecryptionFailed);
  });

  it("fails with a different key under the same version", () => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    const otherRing = parseCredentialKeyring(`1:${encodedTwo}`);

    const error = catchCipherError(() =>
      credentialCipher.decrypt(otherRing, stored, context),
    );

    expect(error.code).toBe(CredentialCipherErrorCode.DecryptionFailed);
  });

  it("refuses a context whose ids are not UUIDs", () => {
    const badContext = { ...context, customerId: "customer\n1" };

    expect(() =>
      credentialCipher.encrypt(ringOne, PLAINTEXT, badContext),
    ).toThrow(TypeError);
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    expect(() => credentialCipher.decrypt(ringOne, stored, badContext)).toThrow(
      TypeError,
    );
  });
});

describe("credentialCipher stored format", () => {
  const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
  const [format, version, nonce, payload] = stored.split(".");

  it.each([
    ["three parts", [format, version, nonce].join(".")],
    ["five parts", `${stored}.AAAA`],
    ["another format version", ["v2", version, nonce, payload].join(".")],
    ["a non-numeric key version", [format, "x", nonce, payload].join(".")],
    ["key version 0", [format, "0", nonce, payload].join(".")],
    ["a padded key version", [format, "01", nonce, payload].join(".")],
    ["a nonce that is too short", [format, version, "AAAA", payload].join(".")],
    [
      "a nonce that is too long",
      [format, version, randomBytes(13).toString("base64url"), payload].join(
        ".",
      ),
    ],
    [
      "a payload shorter than the auth tag",
      [format, version, nonce, randomBytes(15).toString("base64url")].join("."),
    ],
    ["invalid base64url", [format, version, nonce, `${payload}+/`].join(".")],
    ["an empty string", ""],
  ])("rejects %s as malformed", (_label, malformed) => {
    const error = catchCipherError(() =>
      credentialCipher.decrypt(ringOne, malformed, context),
    );

    expect(error.code).toBe(CredentialCipherErrorCode.MalformedCiphertext);
  });

  it("reports a key version that is not in the ring", () => {
    const ringThree = parseCredentialKeyring(
      `1:${encodedOne},2:${encodedTwo},3:${randomBytes(32).toString("base64")}`,
    );
    const writtenWithThree = credentialCipher.encrypt(
      ringThree,
      PLAINTEXT,
      context,
    );

    const error = catchCipherError(() =>
      credentialCipher.decrypt(ringOneTwo, writtenWithThree, context),
    );

    expect(error.code).toBe(CredentialCipherErrorCode.UnknownKeyVersion);
  });

  it("reads the key version of a stored value", () => {
    expect(credentialCipher.readKeyVersion(stored)).toBe(1);
    expect(
      credentialCipher.readKeyVersion(
        credentialCipher.encrypt(ringOneTwo, PLAINTEXT, context),
      ),
    ).toBe(2);
    expect(
      catchCipherError(() => credentialCipher.readKeyVersion("not-a-value"))
        .code,
    ).toBe(CredentialCipherErrorCode.MalformedCiphertext);
  });
});

describe("credentialCipher key rotation", () => {
  it("keeps old values readable and writes new ones with the added version", () => {
    const old = credentialCipher.encrypt(ringOne, PLAINTEXT, context);

    expect(credentialCipher.decrypt(ringOneTwo, old, context)).toBe(PLAINTEXT);

    const renewed = credentialCipher.encrypt(ringOneTwo, PLAINTEXT, context);
    expect(credentialCipher.readKeyVersion(renewed)).toBe(2);
    expect(credentialCipher.decrypt(ringOneTwo, renewed, context)).toBe(
      PLAINTEXT,
    );
  });
});

describe("credentialCipher error hygiene", () => {
  it("never exposes plaintext, ciphertext or a cause", () => {
    const stored = credentialCipher.encrypt(ringOne, PLAINTEXT, context);
    const errors = [
      catchCipherError(() =>
        credentialCipher.decrypt(ringOne, tamper(stored, 3, 0), context),
      ),
      catchCipherError(() =>
        credentialCipher.decrypt(ringOne, `${stored}.AAAA`, context),
      ),
      catchCipherError(() =>
        credentialCipher.decrypt(
          parseCredentialKeyring(`2:${encodedTwo}`),
          stored,
          context,
        ),
      ),
    ];

    for (const error of errors) {
      const serialized = `${error.message} ${error.stack} ${JSON.stringify(error)}`;
      expect(serialized).not.toContain(PLAINTEXT);
      expect(serialized).not.toContain(stored.split(".")[3]);
      expect(serialized).not.toContain(encodedOne);
      expect(error.cause).toBeUndefined();
    }
  });
});
