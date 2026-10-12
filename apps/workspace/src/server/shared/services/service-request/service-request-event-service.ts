import "server-only";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  SystemMessageKey,
  SystemMessageParam,
} from "@invessiv/common/constants/crm/system-message-keys";
import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
import { activityService } from "../activity-service";
import { announceSystemMessage } from "../message/announce-system-message";
const KEYS: Record<ServiceRequestStatus, SystemMessageKey> = {
  [ServiceRequestStatus.Requested]: SystemMessageKey.ServiceRequested,
  [ServiceRequestStatus.Offered]: SystemMessageKey.ServiceRequestOffered,
  [ServiceRequestStatus.Accepted]: SystemMessageKey.ServiceRequestAccepted,
  [ServiceRequestStatus.Declined]: SystemMessageKey.ServiceRequestDeclined,
  [ServiceRequestStatus.Withdrawn]: SystemMessageKey.ServiceRequestWithdrawn,
};
async function record(
  tx: ContactDatabaseTransaction,
  request: ServiceRequestRow,
  actor: ActivityActor,
  previousStatus: ServiceRequestStatus | null,
) {
  await activityService.createActivity(tx, {
    customerId: request.customer_id,
    projectId: request.project_id,
    type:
      previousStatus === null
        ? ActivityType.Created
        : ActivityType.StatusChange,
    metadata: {
      entity: "service_request",
      service_request_id: request.id,
      previous_status: previousStatus,
      next_status: request.status,
    },
    actor,
  });
  await announceSystemMessage(tx, request.customer_id, KEYS[request.status], {
    [SystemMessageParam.ServiceTitle]: request.title,
  });
}
export const serviceRequestEventService = { record } as const;
