import "server-only";
import { and, between, count, eq, ne } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import type { GetAcquisitionVolumeInput } from "@/common/contracts/dashboard/get-acquisition-volume-input";
import { acquisitionVolumeMappingService } from "../services/acquisition-volume/acquisition-volume-mapping-service";

export async function getAcquisitionVolume(
  input: GetAcquisitionVolumeInput,
): Promise<AcquisitionVolumeDto> {
  const db = getDrizzleDatabaseClient();
  const hasCurrentRange = input.from !== undefined && input.to !== undefined;
  const hasPreviousRange =
    input.previousFrom !== undefined && input.previousTo !== undefined;

  const currentWhere = and(
    hasCurrentRange
      ? between(leads.created_at, input.from!, input.to!)
      : undefined,
    ne(leads.lead_status, ContactLeadStatus.PendingReview),
  );
  const previousWhere = hasPreviousRange
    ? and(
        between(leads.created_at, input.previousFrom!, input.previousTo!),
        ne(leads.lead_status, ContactLeadStatus.PendingReview),
      )
    : undefined;
  const pendingReviewWhere = and(
    hasCurrentRange
      ? between(leads.created_at, input.from!, input.to!)
      : undefined,
    eq(leads.lead_status, ContactLeadStatus.PendingReview),
  );

  const [currentRows, previousRows, pendingReviewRows] = await Promise.all([
    db.select({ count: count() }).from(leads).where(currentWhere),
    hasPreviousRange
      ? db.select({ count: count() }).from(leads).where(previousWhere)
      : Promise.resolve(null),
    db.select({ count: count() }).from(leads).where(pendingReviewWhere),
  ]);

  return acquisitionVolumeMappingService.mapRowsToDto(
    currentRows,
    previousRows,
    pendingReviewRows,
  );
}
