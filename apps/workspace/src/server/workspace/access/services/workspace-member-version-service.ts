import "server-only";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { workspaceMembers } from "@invessiv/db/record-configuration";
import type { MemberVersionBumpResult } from "@/server/workspace/access/access-types";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import type { VersionedPatch } from "@/server/workspace/shared/update-versioned-types";

async function writeVersioned(
  tx: ContactDatabaseTransaction,
  memberId: string,
  expectedVersion: number,
  patch: VersionedPatch<typeof workspaceMembers>,
): Promise<MemberVersionBumpResult> {
  const result = await updateVersioned({
    tx,
    table: workspaceMembers,
    id: memberId,
    expectedVersion,
    patch,
    toDto: (row) => row.version,
  });

  if (result.ok) {
    return { ok: true };
  }

  const current =
    result.code === ConcurrencyErrorCode.VersionConflict
      ? await workspaceMemberReadService.findById(tx, memberId)
      : null;

  if (!current) {
    return { ok: false, code: WorkspaceMemberErrorCode.MemberNotFound };
  }

  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: current.version,
      current,
    },
  };
}

/**
 * Role and owner assignments live in their own table, so the membership row carries the version.
 * The bump must be the first write of a transaction: a conflict then leaves nothing to roll back.
 */
function bump(
  tx: ContactDatabaseTransaction,
  memberId: string,
  expectedVersion: number,
): Promise<MemberVersionBumpResult> {
  return writeVersioned(tx, memberId, expectedVersion, {});
}

function updateStatus(
  tx: ContactDatabaseTransaction,
  memberId: string,
  expectedVersion: number,
  active: boolean,
): Promise<MemberVersionBumpResult> {
  return writeVersioned(tx, memberId, expectedVersion, { active });
}

export const workspaceMemberVersionService = {
  bump,
  updateStatus,
} as const;
