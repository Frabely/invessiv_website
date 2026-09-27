import "server-only";

import type { NextRequest } from "next/server";
import type { z } from "zod";
import {
  type MarkConversationReadInput,
  markConversationReadInputSchema,
} from "@invessiv/common/contracts/crm/mark-conversation-read.input";
import {
  type SendMessageInput,
  sendMessageInputSchema,
} from "@invessiv/common/contracts/crm/send-message.input";
import { readJsonBody } from "@/lib/http/read-json-body";

async function readValidBody<TSchema extends z.ZodType>(
  request: NextRequest,
  schema: TSchema,
): Promise<z.infer<TSchema> | null> {
  const json = await readJsonBody(request);
  if (!json.ok) return null;
  const parsed = schema.safeParse(json.body);
  return parsed.success ? parsed.data : null;
}

/** Send payload shared by the portal and the workspace route; null answers as a validation error. */
export function readSendMessageInput(
  request: NextRequest,
): Promise<SendMessageInput | null> {
  return readValidBody(request, sendMessageInputSchema);
}

/** Read confirmation shared by the portal and the workspace route. */
export function readMarkConversationReadInput(
  request: NextRequest,
): Promise<MarkConversationReadInput | null> {
  return readValidBody(request, markConversationReadInputSchema);
}
