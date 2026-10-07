import type { CredentialRevealIntent } from "../../constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "../../constants/credentials/credential-secret-fields";

export interface RevealCredentialRequestDto {
  /** Exactly one field per request; there is no way to ask for both. */
  field: CredentialSecretField;
  /** Why the value is requested. Recorded in the audit event; both count against the rate limit. */
  intent: CredentialRevealIntent;
}
