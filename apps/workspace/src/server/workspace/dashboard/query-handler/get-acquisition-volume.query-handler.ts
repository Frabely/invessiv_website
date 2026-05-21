import "server-only";
import { and, between, count, eq, ne } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import type { GetAcquisitionVolumeInput } from "@/common/contracts/dashboard/get-acquisition-volume-input";

function toCount(
  rows: ReadonlyArray<{ count: number | string | null }>,
): number {
  const raw = rows[0]?.count;
  if (raw === null || raw === undefined) {
    return 0;
  }
  return typeof raw === "number" ? raw : Number(raw);
}

export async function getAcquisitionVolume(
  input: GetAcquisitionVolumeInput,
): Promise<AcquisitionVolumeDto> {
  const db = getDrizzleDatabaseClient();

  const currentWhere = and(
    between(leads.created_at, input.from, input.to),
    ne(leads.lead_status, ContactLeadStatus.PendingReview),
  );
  const previousWhere = and(
    between(leads.created_at, input.previousFrom, input.previousTo),
    ne(leads.lead_status, ContactLeadStatus.PendingReview),
  );
  const pendingReviewWhere = and(
    between(leads.created_at, input.from, input.to),
    eq(leads.lead_status, ContactLeadStatus.PendingReview),
  );

  const [currentRows, previousRows, pendingReviewRows] = await Promise.all([
    db.select({ count: count() }).from(leads).where(currentWhere),
    db.select({ count: count() }).from(leads).where(previousWhere),
    db.select({ count: count() }).from(leads).where(pendingReviewWhere),
  ]);

  return {
    current: toCount(currentRows),
    previous: toCount(previousRows),
    pendingReview: toCount(pendingReviewRows),
  };
}
