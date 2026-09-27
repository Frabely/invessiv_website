import "server-only";

import { MessageSenderSide } from "@invessiv/common/constants/crm/message-types";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import type { ConversationReader } from "@/server/shared/services/message/conversation-reader-types";

function forActor(actor: PortalActor): ConversationReader {
  return {
    side: MessageSenderSide.Customer,
    portalMembershipId: actor.membershipId,
  };
}

/** The owner view has no membership: it owns no message and has no read position. */
function forReader(reader: PortalReader): ConversationReader | null {
  return isPortalOwnerView(reader) ? null : forActor(reader);
}

export const portalConversationReader = { forActor, forReader } as const;
