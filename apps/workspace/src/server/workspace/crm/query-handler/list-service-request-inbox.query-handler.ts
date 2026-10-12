import "server-only";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { serviceRequestAccessService } from "../services/service-requests/service-request-access-service";
export async function listServiceRequestInbox(
  openOnly: boolean,
  actor: WorkspaceActor,
): Promise<ServiceRequestInboxDto> {
  const db = getDrizzleDatabaseClient();
  const [items, hasRequests] = await Promise.all([
    serviceRequestAccessService.list(db, actor, undefined, openOnly),
    serviceRequestAccessService.hasRequests(db, actor),
  ]);
  return { items, hasRequests };
}
