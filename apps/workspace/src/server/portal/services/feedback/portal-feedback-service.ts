import "server-only";

import { and, eq, inArray, type SQL } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import { PORTAL_VISIBLE_PROJECT_STATUS_VALUES } from "@invessiv/common/constants/portal/portal-visible-project-statuses";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalFeedbackResult } from "@invessiv/common/contracts/portal/results/portal-feedback-result";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalAccessCondition } from "@/server/portal/shared/portal-access-condition";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalFileService } from "@/server/portal/services/files/portal-file-service";
import { feedbackRoundItemService } from "@/server/shared/services/feedback/feedback-round-item-service";
import type {
  FeedbackReadExecutor,
  FeedbackRoundRow,
} from "@/server/shared/services/feedback/feedback-service-types";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import type { VersionedPatch } from "@/server/workspace/shared/update-versioned-types";
import { portalFeedbackMappingService } from "./portal-feedback-mapping-service";
import { portalFeedbackSchemas } from "./portal-feedback-schemas";

/** Feedback hangs on a project, so the portal shows it only together with the project itself. */
function canRead(reader: PortalReader): boolean {
  const target = { customerId: reader.customerId };
  return (
    portalCanOn.forReader(reader, Permission.PortalFeedbackRead, target) &&
    portalCanOn.forReader(reader, Permission.PortalProjectsRead, target)
  );
}

/** The owner view reads but never writes, whatever it holds. */
function canSubmit(reader: PortalReader): boolean {
  return (
    !isPortalOwnerView(reader) &&
    canRead(reader) &&
    portalCanOn.forActor(reader, Permission.PortalFeedbackSubmit, {
      customerId: reader.customerId,
    })
  );
}

/** Projects of the reader's company that the portal shows at all; archived ones keep their rounds internal. */
function visibleProjectCondition(reader: PortalReader): SQL {
  return and(
    portalAccessCondition.forReader(reader, Permission.PortalFeedbackRead, {
      customerId: projects.customer_id,
    }),
    inArray(projects.status, PORTAL_VISIBLE_PROJECT_STATUS_VALUES),
  )!;
}

/**
 * Locks a round the actor may change, together with its project title for the chat notice. Every
 * miss — guessed id, foreign company, hidden project, missing permission — is the same `null`.
 */
async function lockRound(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  roundId: string,
): Promise<{ round: FeedbackRoundRow; projectTitle: string } | null> {
  if (!canSubmit(actor) || !portalFeedbackSchemas.id.safeParse(roundId).success)
    return null;
  const [row] = await tx
    .select({ round: feedbackRounds, projectTitle: projects.title })
    .from(feedbackRounds)
    .innerJoin(projects, eq(projects.id, feedbackRounds.project_id))
    .where(
      and(
        eq(feedbackRounds.id, roundId),
        eq(feedbackRounds.customer_id, actor.customerId),
        visibleProjectCondition(actor),
      ),
    )
    .limit(1)
    .for("update", { of: feedbackRounds });
  return row ?? null;
}

/** Rounds with their items; attachments follow the portal's own file visibility. */
async function toRoundDtos(
  executor: FeedbackReadExecutor,
  reader: PortalReader,
  rounds: readonly FeedbackRoundRow[],
): Promise<PortalFeedbackRoundDto[]> {
  const items = await feedbackRoundItemService.loadByRound(
    executor,
    rounds.map((round) => round.id),
    portalFileService.visibleCondition(reader),
  );
  return rounds.map((round) =>
    portalFeedbackMappingService.toRoundDto(round, items.get(round.id) ?? []),
  );
}

async function toRoundDto(
  executor: FeedbackReadExecutor,
  reader: PortalReader,
  round: FeedbackRoundRow,
): Promise<PortalFeedbackRoundDto> {
  const [dto] = await toRoundDtos(executor, reader, [round]);
  return dto;
}

/** A stale version answers with the whole current round, so the client can offer its own text back. */
async function conflict(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
): Promise<PortalFeedbackResult<never>> {
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: round.version,
      current: await toRoundDto(tx, actor, round),
    },
  };
}

/**
 * Only an open round takes customer changes. `expectedVersion` is compared under the round lock,
 * so no parallel save can slip in between the check and the write.
 */
async function rejectUnlessOpen(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  round: FeedbackRoundRow,
  expectedVersion?: number,
): Promise<PortalFeedbackResult<never> | null> {
  if (round.status !== FeedbackRoundStatus.Open)
    return { ok: false, code: PortalFeedbackErrorCode.Locked };
  if (expectedVersion !== undefined && round.version !== expectedVersion)
    return conflict(tx, actor, round);
  return null;
}

/** The round row is locked, so a lost version race here is a bug and not a user conflict. */
async function writeRound(
  tx: ContactDatabaseTransaction,
  round: FeedbackRoundRow,
  patch: VersionedPatch<typeof feedbackRounds>,
): Promise<FeedbackRoundRow> {
  const write = await updateVersioned({
    tx,
    table: feedbackRounds,
    id: round.id,
    expectedVersion: round.version,
    patch,
    toDto: (row) => row,
  });
  if (!write.ok) throw new Error("Locked feedback round changed");
  return write.value;
}

function activityActor(actor: PortalActor): ActivityActor {
  return { type: ActorType.Customer, userId: actor.userId };
}

export const portalFeedbackService = {
  canRead,
  canSubmit,
  visibleProjectCondition,
  lockRound,
  rejectUnlessOpen,
  writeRound,
  activityActor,
  toRoundDtos,
  toRoundDto,
} as const;
