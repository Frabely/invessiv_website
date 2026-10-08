import { describe, expect, it } from "vitest";
import {
  CUSTOMER_WIDE_CREDENTIALS_FILTER,
  CustomerCredentialsQueryParam,
} from "../crm/credentials/customer-credentials-query-params";
import { CredentialNoteMode } from "../crm/credentials/credential-note-modes";
import { CredentialApiPath } from "./credential-api-paths";
import { CredentialListLoadStatus } from "./credential-list-load-status";
import { RevealedSecretStatus } from "./revealed-secret-status";

describe("credential client constants", () => {
  it.each([
    [
      CredentialApiPath,
      {
        Credentials: "credentials",
        Reveal: "reveal",
        PortalVisibility: "portal-visibility",
      },
    ],
    [
      CredentialListLoadStatus,
      { Loading: "loading", Ready: "ready", Error: "error" },
    ],
    [
      RevealedSecretStatus,
      {
        Hidden: "hidden",
        Loading: "loading",
        Visible: "visible",
        Failed: "failed",
      },
    ],
    [CustomerCredentialsQueryParam, { Project: "credentialsProject" }],
    [CredentialNoteMode, { Keep: "keep", Edit: "edit", Remove: "remove" }],
  ])("contains the exact values without duplicates", (actual, expected) => {
    expect(actual).toEqual(expected);
    const values = Object.values(actual);
    expect(new Set(values).size).toBe(values.length);
  });

  it("keeps the customer-wide filter value apart from any uuid", () => {
    expect(CUSTOMER_WIDE_CREDENTIALS_FILTER).toBe("customer");
  });
});
