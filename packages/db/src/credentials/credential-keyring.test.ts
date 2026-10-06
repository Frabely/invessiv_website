import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { CredentialCipherErrorCode } from "@invessiv/common/constants/credentials/credential-cipher-error-codes";
import { CredentialCipherError } from "./credential-cipher-error.class";
import { parseCredentialKeyring } from "./credential-keyring";

const keyOne = randomBytes(32);
const keyTwo = randomBytes(32);
const encodedOne = keyOne.toString("base64");
const encodedTwo = keyTwo.toString("base64");

function catchCipherError(raw: string | undefined): CredentialCipherError {
  try {
    parseCredentialKeyring(raw);
  } catch (error) {
    if (error instanceof CredentialCipherError) return error;
    throw error;
  }
  throw new Error("Expected parseCredentialKeyring to throw");
}

describe("parseCredentialKeyring", () => {
  it.each([[undefined], [""], ["   "]])(
    "reports a missing keyring for %j",
    (raw) => {
      expect(catchCipherError(raw).code).toBe(
        CredentialCipherErrorCode.KeyringMissing,
      );
    },
  );

  it.each([
    ["a key shorter than 32 bytes", `1:${randomBytes(16).toString("base64")}`],
    ["a key longer than 32 bytes", `1:${randomBytes(33).toString("base64")}`],
    ["invalid base64", `1:${encodedOne.slice(0, -4)}!!!=`],
    ["a duplicate version", `1:${encodedOne},1:${encodedTwo}`],
    ["version 0", `0:${encodedOne}`],
    ["a negative version", `-1:${encodedOne}`],
    ["a non-numeric version", `abc:${encodedOne}`],
    ["a fractional version", `1.5:${encodedOne}`],
    ["an entry without a colon", encodedOne],
    ["an empty entry", `1:${encodedOne},`],
  ])("rejects %s", (_label, raw) => {
    expect(catchCipherError(raw).code).toBe(
      CredentialCipherErrorCode.KeyringInvalid,
    );
  });

  it("reads a single key generated with the documented command", () => {
    const keyring = parseCredentialKeyring(`1:${encodedOne}`);

    expect(keyring.activeVersion).toBe(1);
    expect(keyring.keys.get(1)?.equals(keyOne)).toBe(true);
  });

  it("reads every version and writes with the highest one", () => {
    const keyring = parseCredentialKeyring(`2:${encodedTwo},1:${encodedOne}`);

    expect(keyring.activeVersion).toBe(2);
    expect(keyring.keys.size).toBe(2);
    expect(keyring.keys.get(1)?.equals(keyOne)).toBe(true);
    expect(keyring.keys.get(2)?.equals(keyTwo)).toBe(true);
  });

  it("ignores whitespace around entries", () => {
    const keyring = parseCredentialKeyring(
      ` 1:${encodedOne} , 2:${encodedTwo} \n`,
    );

    expect(keyring.activeVersion).toBe(2);
    expect(keyring.keys.size).toBe(2);
  });

  it("accepts a key without base64 padding", () => {
    const keyring = parseCredentialKeyring(
      `1:${encodedOne.replace(/=+$/, "")}`,
    );

    expect(keyring.keys.get(1)?.equals(keyOne)).toBe(true);
  });

  it.each([
    ["a short key", `1:${randomBytes(16).toString("base64")}`],
    ["a duplicate version", `1:${encodedOne},1:${encodedTwo}`],
    ["an entry without a colon", encodedOne],
  ])("keeps the key text out of the error for %s", (_label, raw) => {
    const error = catchCipherError(raw);

    for (const entry of raw.split(",")) {
      const keyText = entry.slice(entry.indexOf(":") + 1);
      expect(error.message).not.toContain(keyText);
    }
    expect(error.cause).toBeUndefined();
  });
});
