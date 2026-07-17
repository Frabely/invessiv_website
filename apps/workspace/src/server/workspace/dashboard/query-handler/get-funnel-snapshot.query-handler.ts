import "server-only";
import { between } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import type { GetFunnelSnapshotInput } from "@/common/contracts/dashboard/get-funnel-snapshot-input";
import {
  funnelSnapshotMappingService,
  type FunnelStatusRow,
} from "../services/funnel-snapshot/funnel-snapshot-mapping-service";

export async function getFunnelSnapshot(
  input: GetFunnelSnapshotInput,
): Promise<FunnelSnapshotDto> {
  const db = getDrizzleDatabaseClient();

  const rows = (await db
    .select({
      lead_status: leads.lead_status,
      count: count(),
    })
    .from(leads)
    .where(between(leads.created_at, input.from, input.to))
    .groupBy(leads.lead_status)) as ReadonlyArray<FunnelStatusRow>;

  return funnelSnapshotMappingService.mapRowsToSnapshotDto(rows);
}
