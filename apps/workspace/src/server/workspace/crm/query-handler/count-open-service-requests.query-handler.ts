import "server-only";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { serviceRequestAccessService } from "../services/service-requests/service-request-access-service";
export async function countOpenServiceRequests(actor: WorkspaceActor) {
  return serviceRequestAccessService.countRequested(
    getDrizzleDatabaseClient(),
    actor,
  );
}
