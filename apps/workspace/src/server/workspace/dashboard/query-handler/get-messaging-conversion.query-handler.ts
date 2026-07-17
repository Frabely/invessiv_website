import "server-only";
import type { GetFunnelSnapshotInput } from "@/common/contracts/dashboard/get-funnel-snapshot-input";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import { messagingConversionMappingService } from "../services/messaging-conversion/messaging-conversion-mapping-service";
import { getFunnelSnapshot } from "./get-funnel-snapshot.query-handler";

export async function getMessagingConversion(
  input: GetFunnelSnapshotInput,
): Promise<MessagingConversionDto> {
  const snapshot = await getFunnelSnapshot(input);
  return messagingConversionMappingService.mapSnapshotToConversionDto(snapshot);
}
