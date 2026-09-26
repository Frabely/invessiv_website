import "server-only";

import type { NextRequest } from "next/server";
import {
  type SendMessageInput,
  sendMessageInputSchema,
} from "@invessiv/common/contracts/crm/send-message.input";
import { readJsonBody } from "@/lib/http/read-json-body";

/** Validates the common payload used by portal and workspace send routes. */
export async function readMessageInput(
  request: NextRequest,
): Promise<SendMessageInput | null> {
  const json = await readJsonBody(request);
  if (!json.ok) return null;
  const parsed = sendMessageInputSchema.safeParse(json.body);
  return parsed.success ? parsed.data : null;
}
