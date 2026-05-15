import "server-only";
import { eq } from "drizzle-orm";

import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { BulkEditFieldKey } from "@/common/constants/leads/bulk/bulk-edit-field-keys";
import { BulkSkipReason } from "@/common/constants/leads/bulk/bulk-skip-reasons";
import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";
import type {
  BulkEditLeadsInput,
  BulkEditLeadsPatch,
} from "@/common/contracts/leads/bulk-edit-leads-input";
import type {
  BulkEditActivityMetadata,
  LeadCurrentState,
  LeadUpdateSetClause,
} from "@/common/contracts/leads";
import type {
  BulkEditLeadsFailedLead,
  BulkEditLeadsResult,
} from "@/common/contracts/leads/results/bulk-edit-leads-result";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@/server/db/core";
import { leads } from "@/server/db/record-configuration";
import { createLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";

const BULK_EDIT_ACTIVITY_FIELD_LABELS: Record<string, string> = {
  [BulkEditFieldKey.Status]: "status",
  [BulkEditFieldKey.CategoryId]: "category",
  [BulkEditFieldKey.Score]: "score",
  [BulkEditFieldKey.Owner]: "owner",
  [BulkEditFieldKey.NotesAppended]: "notes",
  [BulkEditFieldKey.ImprovementsAdded]: "improvements",
};

function hasOwn<K extends keyof BulkEditLeadsPatch>(
  patch: BulkEditLeadsPatch,
  key: K,
): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function buildBulkEditActivityBody(
  metadata: BulkEditActivityMetadata,
): string | null {
  if (metadata.changedFields.length === 0) {
    return null;
  }

  const labels = metadata.changedFields.map(
    (field) => BULK_EDIT_ACTIVITY_FIELD_LABELS[field] ?? field,
  );

  return `Updated fields: ${labels.join(", ")}`;
}

function combineNotes(existing: string | null, append: string): string {
  return existing && existing.length > 0 ? `${existing}\n${append}` : append;
}

function buildUpdateSet(
  current: LeadCurrentState,
  patch: BulkEditLeadsPatch,
  now: Date,
): {
  setClause: LeadUpdateSetClause;
  metadata: BulkEditActivityMetadata;
  changed: boolean;
} {
  const setClause: LeadUpdateSetClause = { updated_at: now };
  const changedFields: string[] = [];
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  let notesAppendedChars: number | undefined;
  let improvementsAddedCount: number | undefined;

  if (hasOwn(patch, "status") && patch.status !== undefined) {
    if (current.lead_status !== patch.status) {
      setClause.lead_status = patch.status;
      changedFields.push(BulkEditFieldKey.Status);
      before.status = current.lead_status;
      after.status = patch.status;
    }
  }

  if (hasOwn(patch, "categoryId")) {
    const next = patch.categoryId ?? null;
    if (current.category_id !== next) {
      setClause.category_id = next;
      changedFields.push(BulkEditFieldKey.CategoryId);
      before.category_id = current.category_id;
      after.category_id = next;
    }
  }

  if (hasOwn(patch, "score")) {
    const next = patch.score ?? null;
    if (current.score !== next) {
      setClause.score = next;
      changedFields.push(BulkEditFieldKey.Score);
      before.score = current.score;
      after.score = next;
    }
  }

  if (hasOwn(patch, "owner")) {
    const next = patch.owner ?? null;
    if (current.owner !== next) {
      setClause.owner = next;
      changedFields.push(BulkEditFieldKey.Owner);
      before.owner = current.owner;
      after.owner = next;
    }
  }

  if (patch.notesAppend) {
    const combined = combineNotes(current.notes, patch.notesAppend);
    setClause.notes = combined;
    changedFields.push(BulkEditFieldKey.NotesAppended);
    notesAppendedChars = patch.notesAppend.length;
    before.notes_length = current.notes?.length ?? 0;
    after.notes_length = combined.length;
  }

  if (patch.improvementsAppend && patch.improvementsAppend.length > 0) {
    const next = [...(current.improvements ?? []), ...patch.improvementsAppend];
    setClause.improvements = next;
    changedFields.push(BulkEditFieldKey.ImprovementsAdded);
    improvementsAddedCount = patch.improvementsAppend.length;
    before.improvements_count = current.improvements?.length ?? 0;
    after.improvements_count = next.length;
  }

  return {
    setClause,
    metadata: {
      changedFields,
      before,
      after,
      ...(notesAppendedChars !== undefined ? { notesAppendedChars } : {}),
      ...(improvementsAddedCount !== undefined
        ? { improvementsAddedCount }
        : {}),
    },
    changed: changedFields.length > 0,
  };
}

async function processSingleLead(
  tx: ContactDatabaseTransaction,
  current: LeadCurrentState,
  patch: BulkEditLeadsPatch,
  now: Date,
): Promise<{ updated: boolean; failure?: BulkEditLeadsFailedLead }> {
  if (patch.notesAppend) {
    const combined = combineNotes(current.notes, patch.notesAppend);
    if (combined.length > LeadFieldLimits.NotesMaxLength) {
      return {
        updated: false,
        failure: {
          id: current.id,
          displayName: current.display_name,
          reason: BulkSkipReason.NotesTooLong,
        },
      };
    }
  }

  const { setClause, metadata, changed } = buildUpdateSet(current, patch, now);
  if (!changed) {
    return { updated: false };
  }

  await tx.update(leads).set(setClause).where(eq(leads.id, current.id));
  await createLeadActivity(tx, {
    leadId: current.id,
    type: LeadActivityType.BulkEdit,
    body: buildBulkEditActivityBody(metadata),
    metadata,
    actorType: LeadActorType.System,
  });

  return { updated: true };
}

export async function bulkEditLeads(
  input: BulkEditLeadsInput,
): Promise<BulkEditLeadsResult> {
  if (input.ids.length === 0) {
    return { ok: true, updatedCount: 0, failedLeads: [] };
  }

  const db = getDrizzleDatabaseClient();
  const now = new Date();

  const failedLeads: BulkEditLeadsFailedLead[] = [];
  let updatedCount = 0;

  for (const leadId of input.ids) {
    // Best-effort identity probe used solely to report a display name on the
    // catch-path below. The race-sensitive read (notes, status, score, …)
    // happens inside the Tx — see processSingleLead below.
    const [displayProbe] = await db
      .select({
        id: leads.id,
        display_name: leads.display_name,
        first_name: leads.first_name,
        last_name: leads.last_name,
        company_name: leads.company_name,
        email: leads.email,
      })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!displayProbe) {
      continue;
    }

    try {
      const result = await db.transaction(async (tx) => {
        // Fresh, race-free read inside the Tx. All business-logic decisions
        // (notes-length skip, change detection, update payload) run against
        // this snapshot — preventing TOCTOU overwrite of concurrent writers.
        const [current] = await tx
          .select({
            id: leads.id,
            display_name: leads.display_name,
            first_name: leads.first_name,
            last_name: leads.last_name,
            company_name: leads.company_name,
            email: leads.email,
            lead_status: leads.lead_status,
            category_id: leads.category_id,
            score: leads.score,
            owner: leads.owner,
            notes: leads.notes,
            improvements: leads.improvements,
          })
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        if (!current) {
          // Row vanished between probe and Tx — treat as a silent skip.
          return { updated: false } as const;
        }

        return processSingleLead(tx, current, input.patch, now);
      });
      if (result.updated) {
        updatedCount += 1;
      } else if ("failure" in result && result.failure) {
        failedLeads.push(result.failure);
      }
    } catch (error) {
      console.error("[bulk-edit-leads] per-lead failure", {
        leadId: displayProbe.id,
        error,
      });
      failedLeads.push({
        id: displayProbe.id,
        displayName: displayProbe.display_name,
        reason: BulkSkipReason.Unknown,
      });
    }
  }

  return { ok: true, updatedCount, failedLeads };
}
