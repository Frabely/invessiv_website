import "server-only";
import {
  and,
  between,
  count as countRows,
  eq,
  gte,
  max,
  notExists,
  sql,
} from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leadActivities, leads } from "@invessiv/db/record-configuration";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import type { GetMessagingConversionInput } from "@/common/contracts/dashboard/get-messaging-conversion-input";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionStageRankRow } from "@/common/contracts/dashboard/messaging-conversion-stage-rank-row";
import type { MessagingConversionStatusRow } from "@/common/contracts/dashboard/messaging-conversion-status-row";
import { messagingConversionMappingService } from "../services/messaging-conversion/messaging-conversion-mapping-service";

export async function getMessagingConversion(
  input: GetMessagingConversionInput,
): Promise<MessagingConversionDto> {
  const db = getDrizzleDatabaseClient();
  if (input.from && input.to) {
    const nextStatus = sql<string | null>`${leadActivities.metadata}
        ->> 'next_status'`;
    const stageRank = sql<number>`case
      when
        ${nextStatus}
        in
        (
        ${ContactLeadStatus.Won}
        )
        then
        4
        when
        ${nextStatus}
        in
        (
        ${ContactLeadStatus.ClosingCall}
        )
        then
        3
        when
        ${nextStatus}
        in
        (
        ${ContactLeadStatus.SettingCall}
        )
        then
        2
        when
        ${nextStatus}
        in
        (
        ${ContactLeadStatus.Responded},
        ${ContactLeadStatus.FollowUp},
        ${ContactLeadStatus.Reminder},
        ${ContactLeadStatus.Proposal},
        ${ContactLeadStatus.Lost}
        )
        then
        1
        when
        ${nextStatus}
        in
        (
        ${ContactLeadStatus.Contacted},
        ${ContactLeadStatus.NotReached}
        )
        then
        0
        else
        -
        1
        end`;
    const highestStageByLead = db
      .select({
        leadId: leadActivities.lead_id,
        stageRank: max(stageRank).mapWith(Number).as("stage_rank"),
      })
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.type, LeadActivityType.StatusChange),
          between(leadActivities.occurred_at, input.from, input.to),
        ),
      )
      .groupBy(leadActivities.lead_id)
      .as("highest_messaging_stage_by_lead");

    const statusEvents: ReadonlyArray<MessagingConversionStageRankRow> =
      await db
        .select({
          stageRank: highestStageByLead.stageRank,
          count: countRows(),
        })
        .from(highestStageByLead)
        .where(gte(highestStageByLead.stageRank, 0))
        .groupBy(highestStageByLead.stageRank);

    const statusHistoryForLead = db
      .select({ id: leadActivities.id })
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.lead_id, leads.id),
          eq(leadActivities.type, LeadActivityType.StatusChange),
        ),
      );

    const legacyRows = (await db
      .select({
        lead_status: leads.lead_status,
        count: countRows(),
      })
      .from(leads)
      .where(
        and(
          notExists(statusHistoryForLead),
          between(leads.created_at, input.from, input.to),
        ),
      )
      .groupBy(
        leads.lead_status,
      )) as ReadonlyArray<MessagingConversionStatusRow>;

    return messagingConversionMappingService.mapRangedRowsToConversionDto(
      statusEvents,
      legacyRows,
    );
  }

  const rows = (await db
    .select({
      lead_status: leads.lead_status,
      count: countRows(),
    })
    .from(leads)
    .groupBy(leads.lead_status)) as ReadonlyArray<MessagingConversionStatusRow>;

  return messagingConversionMappingService.mapRowsToConversionDto(rows);
}
