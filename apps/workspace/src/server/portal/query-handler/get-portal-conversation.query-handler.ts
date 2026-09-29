import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import type { ConversationAttachmentAccessDto } from "@invessiv/common/contracts/crm/conversation-attachment-access.dto";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { conversations } from "@invessiv/db/record-configuration";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { portalConversationMappingService } from "@/server/portal/services/portal-conversation-mapping-service";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalConversationReader } from "@/server/portal/shared/portal-conversation-reader";
import { conversationMappingService } from "@/server/shared/services/message/conversation-mapping-service";
import { conversationService } from "@/server/shared/services/message/conversation-service";
import { messageService } from "@/server/shared/services/message/message-service";

/** The composer is for customer contacts only; the owner view never writes. */
function readerMayWrite(reader: PortalReader): boolean {
  return (
    !isPortalOwnerView(reader) &&
    portalCanOn.forActor(reader, Permission.PortalMessagesWrite, {
      customerId: reader.customerId,
    })
  );
}

/**
 * Attaching is part of writing; picking needs file read, uploading also file write, because the
 * send checks every attachment against what the contact may read.
 */
function attachmentAccessOf(
  reader: PortalReader,
): ConversationAttachmentAccessDto {
  if (isPortalOwnerView(reader) || !readerMayWrite(reader))
    return { pick: false, upload: false };
  const scope = { customerId: reader.customerId };
  const pick = portalCanOn.forActor(reader, Permission.PortalFilesRead, scope);
  return {
    pick,
    upload:
      pick && portalCanOn.forActor(reader, Permission.PortalFilesWrite, scope),
  };
}

async function loadConversationPage(
  tx: ContactDatabaseTransaction,
  reader: PortalReader,
  conversation: typeof conversations.$inferSelect,
  cursor: string | null,
): Promise<ConversationDto | null> {
  const viewer = portalConversationReader.forReader(reader);
  const page = await messageService.getMessagePage(
    tx,
    conversation.id,
    cursor,
    viewer,
    portalFileService.visibleCondition(reader),
  );
  if (!page) return null;
  const unreadCount = viewer
    ? await conversationService.countUnreadMessages(tx, conversation.id, viewer)
    : 0;
  return conversationMappingService.toConversationDto(
    conversation,
    reader.customerId,
    unreadCount,
    page,
  );
}

async function loadVisibleConversation(
  tx: ContactDatabaseTransaction,
  reader: PortalReader,
  cursor: string | null,
) {
  const conversation = await conversationService.findCustomerConversation(
    tx,
    reader.customerId,
    portalAccessCondition.forReader(reader, Permission.PortalMessagesRead, {
      customerId: conversations.customer_id,
    }),
  );
  const loaded = conversation
    ? await loadConversationPage(tx, reader, conversation, cursor)
    : conversationMappingService.toConversationDto(null, reader.customerId, 0, {
        messages: [],
        nextCursor: null,
      });
  if (!loaded)
    return { ok: false, code: MessageErrorCode.ValidationError } as const;
  return {
    ok: true,
    conversation: portalConversationMappingService.toPortalDto(
      loaded,
      readerMayWrite(reader),
      attachmentAccessOf(reader),
    ),
  } as const;
}

export async function getPortalConversation(
  reader: PortalReader,
  cursor: string | null,
) {
  if (
    !portalCanOn.forReader(reader, Permission.PortalMessagesRead, {
      customerId: reader.customerId,
    })
  )
    return { ok: false, code: MessageErrorCode.NotFound } as const;
  return getDrizzleDatabaseClient().transaction((tx) =>
    loadVisibleConversation(tx, reader, cursor),
  );
}
