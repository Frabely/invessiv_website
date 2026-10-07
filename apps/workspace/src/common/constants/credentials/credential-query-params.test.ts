import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE,
  CredentialQueryParam,
} from "./credential-query-params";

describe("CredentialQueryParam", () => {
  it("contains the exact values without duplicates", () => {
    expect(CredentialQueryParam).toEqual({ ProjectId: "projectId" });
    const values = Object.values(CredentialQueryParam);
    expect(new Set(values).size).toBe(values.length);
    expect(CREDENTIAL_CUSTOMER_WIDE_QUERY_VALUE).toBe("null");
  });
});
