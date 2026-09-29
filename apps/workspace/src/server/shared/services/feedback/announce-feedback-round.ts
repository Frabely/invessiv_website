import "server-only";

import {
  type SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import type { FeedbackRoundRef } from "./feedback-service-types";

/** Every feedback event names the project and the round, in CRM and portal alike. */
export function announceFeedbackRound(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRef,
  projectTitle: string,
  key: SystemMessageKey,
): Promise<void> {
  return announceSystemMessage(tx, round.customer_id, key, {
    [SystemMessageParam.ProjectTitle]: projectTitle,
    [SystemMessageParam.RoundNumber]: String(round.round_number),
  });
}
