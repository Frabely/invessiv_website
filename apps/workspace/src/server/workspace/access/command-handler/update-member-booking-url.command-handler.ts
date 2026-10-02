import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { UpdateMemberBookingUrlRequestDto } from "@invessiv/common/contracts/auth/update-member-booking-url-request.dto";
import type { UpdateMemberBookingUrlResult } from "@invessiv/common/contracts/auth/results/update-member-booking-url-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { securityEventService } from "@/server/shared/services/security-event-service";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { workspaceMemberVersionService } from "@/server/workspace/access/services/workspace-member-version-service";

/**
 * Sets or clears the booking link of a member. Whose link may be written is decided at the route:
 * the own one by every member, someone else's only with `members.manage`. A link changed by
 * someone else leaves a security event; the own one does not, because nothing about access
 * changes when a member maintains the own calendar.
 */
export async function updateMemberBookingUrl(
  memberId: string,
  input: UpdateMemberBookingUrlRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateMemberBookingUrlResult> {
  if (!accessSchemas.entityId.safeParse(memberId).success) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  const validation = accessSchemas.updateMemberBookingUrl.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }
  const { bookingUrl, version } = validation.data;

  const db = getDrizzleDatabaseClient();
  return db.transaction(async (tx): Promise<UpdateMemberBookingUrlResult> => {
    const current = await workspaceMemberReadService.findById(tx, memberId);
    if (!current) {
      return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
    }
    // Saving the stored link again is no change: no version step and no event.
    if (current.bookingUrl === bookingUrl) {
      return { ok: true, member: current };
    }

    const write = await workspaceMemberVersionService.updateBookingUrl(
      tx,
      memberId,
      version,
      bookingUrl,
    );
    if (!write.ok) {
      return write;
    }

    if (memberId !== actor.workspaceMemberId) {
      await securityEventService.createSecurityEvent(tx, {
        type: SecurityEventType.WorkspaceMemberBookingUrlChanged,
        actor: { type: ActorType.User, userId: actor.userId },
        subjectType: SecuritySubjectType.WorkspaceMember,
        subjectId: memberId,
        // The link itself stays out of the audit trail; only that it was set or cleared.
        metadata: {
          changedFields: ["bookingUrl"],
          cleared: bookingUrl === null,
        },
        occurredAt: new Date(),
      });
    }

    const member = await workspaceMemberReadService.findById(tx, memberId);
    if (!member) {
      throw new Error("Workspace member is missing after updating booking url");
    }
    return { ok: true, member };
  });
}
