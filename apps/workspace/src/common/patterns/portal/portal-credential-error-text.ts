import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";

type PortalCredentialErrorTexts = Readonly<
  Partial<Record<CredentialApiErrorCode, string>> & {
    [CredentialApiErrorCode.Internal]: string;
  }
>;

/**
 * The portal names only the failures a contact can run into. Codes that belong to the internal
 * release (`customer_owned`, `project_hidden`) never reach it and fall back to the general text.
 */
export function portalCredentialErrorText(
  code: CredentialApiErrorCode,
  texts: PortalCredentialErrorTexts,
): string {
  return texts[code] ?? texts[CredentialApiErrorCode.Internal];
}
