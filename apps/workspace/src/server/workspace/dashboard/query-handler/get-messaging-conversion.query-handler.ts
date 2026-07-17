import "server-only";
import { between, count as countRows } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leads } from "@invessiv/db/record-configuration";
import type { GetMessagingConversionInput } from "@/common/contracts/dashboard/get-messaging-conversion-input";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionStatusRow } from "@/common/contracts/dashboard/messaging-conversion-status-row";
import { messagingConversionMappingService } from "../services/messaging-conversion/messaging-conversion-mapping-service";

export async function getMessagingConversion(
  input: GetMessagingConversionInput,
): Promise<MessagingConversionDto> {
  const db = getDrizzleDatabaseClient();
  const rows = (await db
    .select({
      lead_status: leads.lead_status,
      count: countRows(),
    })
    .from(leads)
    .where(between(leads.created_at, input.from, input.to))
    .groupBy(leads.lead_status)) as ReadonlyArray<MessagingConversionStatusRow>;

  return messagingConversionMappingService.mapRowsToConversionDto(rows);
}
