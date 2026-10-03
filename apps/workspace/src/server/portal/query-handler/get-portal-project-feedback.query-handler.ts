import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import {
  feedbackQuota,
  isActiveFeedbackRound,
} from "@invessiv/common/patterns/crm/feedback-round-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";
import { portalFeedbackService } from "@/server/portal/services/feedback/portal-feedback-service";
import { projectResponsibleMemberService } from "@/server/shared/services/project-responsible-member-service";
import { portalBookingMappingService } from "@/server/portal/services/portal-booking-mapping-service";

/**
 * The feedback page of one project. `null` covers every miss alike — guessed id, foreign company,
 * archived project, missing permission — so a probe confirms nothing.
 */
export async function getPortalProjectFeedback(
  reader: PortalReader,
  projectId: string,
): Promise<PortalProjectFeedbackDto | null> {
  const id = portalFeedbackSchemas.id.safeParse(projectId);
  if (!portalFeedbackService.canRead(reader) || !id.success) return null;
  const db = getDrizzleDatabaseClient();
  const [project] = await db
    .select({
      id: projects.id,
      title: projects.title,
      included: projects.included_feedback_rounds,
    })
    .from(projects)
    .where(
      and(
        eq(projects.id, id.data),
        portalProjectCondition(reader, Permission.PortalFeedbackRead),
      ),
    )
    .limit(1);
  if (!project) return null;

  // The project condition already bound the company; the rounds follow their project.
  const rows = await db
    .select()
    .from(feedbackRounds)
    .where(eq(feedbackRounds.project_id, project.id))
    .orderBy(desc(feedbackRounds.round_number));
  const rounds = await portalFeedbackService.toRoundDtos(db, reader, rows);
  const activeRound =
    rounds.find((round) => isActiveFeedbackRound(round.status)) ?? null;
  const bookingContact =
    await projectResponsibleMemberService.findBookingContact(db, project.id);

  return {
    projectId: project.id,
    projectTitle: project.title,
    quota: feedbackQuota({ included: project.included, rounds }),
    activeRound,
    history: rounds.filter((round) => round !== activeRound),
    canSubmit: portalFeedbackService.canSubmit(reader),
    canAttach: portalFeedbackService.canAttach(reader),
    booking: bookingContact
      ? portalBookingMappingService.toDto(bookingContact)
      : null,
  };
}
