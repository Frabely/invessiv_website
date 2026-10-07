import type { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";

/** The only part of a credential an event may name: where it lives, never what it is called or holds. */
export type CredentialEventSubject = {
  id: string;
  customer_id: string;
  project_id: string | null;
};

/**
 * One shape per event type, so the metadata of an event is fixed by the compiler. There is no
 * free-form field a title or a value could slip into.
 */
export type CredentialEventDetail =
  | {
      type:
        | typeof SecurityEventType.CredentialCreated
        | typeof SecurityEventType.CredentialDeleted;
    }
  | {
      type: typeof SecurityEventType.CredentialUpdated;
      /** Column names only. */
      changedFields: string[];
    }
  | {
      type: typeof SecurityEventType.CredentialRevealed;
      field: CredentialSecretField;
      intent: CredentialRevealIntent;
    }
  | {
      type: typeof SecurityEventType.CredentialPortalVisibilityChanged;
      visible: boolean;
    };

export type CredentialEventInput = CredentialEventDetail & {
  actor: ActivityActor;
  credential: CredentialEventSubject;
  occurredAt: Date;
};
