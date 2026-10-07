import { describe, expectTypeOf, it } from "vitest";
import type { CredentialListDto } from "./credential-list.dto";
import type { CredentialDto } from "./credential.dto";

describe("CredentialDto", () => {
  it("has no field that could carry the secret or the note text", () => {
    expectTypeOf<CredentialDto>().not.toHaveProperty("secret");
    expectTypeOf<CredentialDto>().not.toHaveProperty("note");
    expectTypeOf<CredentialDto>().not.toHaveProperty("secretCiphertext");
    expectTypeOf<CredentialDto>().not.toHaveProperty("noteCiphertext");
    expectTypeOf<CredentialDto["hasNote"]>().toEqualTypeOf<boolean>();
    expectTypeOf<
      CredentialListDto["credentials"][number]
    >().toEqualTypeOf<CredentialDto>();
  });
});
