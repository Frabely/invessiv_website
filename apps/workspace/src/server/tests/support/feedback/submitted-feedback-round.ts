import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import type { createFeedbackIntegrationFixture } from "../../shared/services/feedback/feedback-integration-fixture";

/** Hands a round over and lets the customer submit `bodies` as items; the round ends at version 3. */
export async function submittedFeedbackRound(
  f: ReturnType<typeof createFeedbackIntegrationFixture>,
  bodies = ["Logo größer", "Farbe dunkler"],
) {
  const projectId = await f.project();
  const handed = await handOverFeedbackRound(
    projectId,
    { areaOptions: [] },
    f.member(),
  );
  if (!handed.ok) throw new Error("Expected a handed-over round");
  const roundId = handed.round.id;
  const itemIds = bodies.map(() => crypto.randomUUID());
  await savePortalFeedbackDraft(f.contact(), roundId, {
    version: 1,
    items: bodies.map((body, index) => ({
      id: itemIds[index],
      areaLabel: null,
      kind: null,
      body,
    })),
  });
  const submitted = await submitPortalFeedbackRound(f.contact(), roundId, {
    version: 2,
  });
  if (!submitted.ok) throw new Error("Expected a submitted round");
  return { projectId, roundId, itemIds, version: 3 };
}
