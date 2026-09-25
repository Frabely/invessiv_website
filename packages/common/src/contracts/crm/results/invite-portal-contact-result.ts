import type { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";

export type InvitePortalContactResult =
  | {
      ok: true;
      invitation: { id: string; expiresAt: Date };
      /** The only response field that ever carries the plaintext token. */
      inviteUrl: string;
    }
  | { ok: false; code: PortalAccessErrorCode };
