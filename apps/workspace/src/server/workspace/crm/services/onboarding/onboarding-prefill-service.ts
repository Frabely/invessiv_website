import "server-only";

import type {
  ContactDatabaseReader,
  ContactDatabaseTransaction,
} from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingAnswerWriteService } from "@/server/shared/services/onboarding/onboarding-answer-write-service";
import { onboardingAttachmentService } from "@/server/shared/services/onboarding/onboarding-attachment-service";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { onboardingPrefillCarryService } from "./onboarding-prefill-carry-service";
import { onboardingPrefillCrmService } from "./onboarding-prefill-crm-service";
import type { PrefillRows, PrefillTarget } from "./onboarding-prefill-types";

async function hasSource(
  executor: ContactDatabaseReader,
  customerId: string,
  actor: WorkspaceActor,
): Promise<boolean> {
  return (
    (await onboardingPrefillCarryService.findSourceForm(
      executor,
      customerId,
      actor,
    )) !== null
  );
}

/**
 * Pre-fills new blocks of a form in the caller's transaction: first from the customer's last
 * completed form, then from the CRM. Blocks created in the form itself are never passed in.
 */
async function prefillBlocks(
  tx: ContactDatabaseTransaction,
  target: PrefillTarget,
): Promise<void> {
  const blocks = await questionnaireDefinitionReadService.findBlocks(
    tx,
    target.blockIds,
    target.form.id,
  );
  if (blocks.length === 0) return;
  const rows: PrefillRows = { answers: [], entries: [], files: [] };
  await onboardingPrefillCarryService.carryOver(tx, target, blocks, rows);
  await onboardingPrefillCrmService.fillFromCrm(tx, target, blocks, rows);

  // Entries first: answers and file links of a sub-field point at them.
  await onboardingGroupEntryService.insertEntries(tx, rows.entries);
  // The actor marks every pre-filled answer as written by the team.
  await onboardingAnswerWriteService.insertSlots(tx, rows.answers, {
    memberId: target.actor.workspaceMemberId,
  });
  await onboardingAttachmentService.insertLinks(tx, rows.files);
}

export const onboardingPrefillService = { hasSource, prefillBlocks } as const;
