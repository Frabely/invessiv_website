import "server-only";

import type { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { announceSystemMessage } from "./announce-system-message";

/** The one chat notice of a phase change, whichever write moved the project. */
export function announcePhaseChange(
  tx: ContactDatabaseTransaction,
  customerId: string,
  projectTitle: string,
  phase: ProjectPhase,
): Promise<void> {
  return announceSystemMessage(
    tx,
    customerId,
    SystemMessageKey.ProjectPhaseChanged,
    {
      [SystemMessageParam.ProjectTitle]: projectTitle,
      [SystemMessageParam.Phase]: phase,
    },
  );
}
