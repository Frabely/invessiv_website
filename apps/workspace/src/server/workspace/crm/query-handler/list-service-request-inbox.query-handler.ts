import "server-only";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import { resolveListPage } from "@invessiv/common/patterns/pagination/resolve-list-page";
import { SERVICE_REQUEST_INBOX_PAGE_SIZE } from "@/common/constants/crm/service-request-inbox-page-size";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { serviceRequestAccessService } from "../services/service-requests/service-request-access-service";

/** The count runs first so an out-of-range page clamps to the last one instead of coming back empty. */
export async function listServiceRequestInbox(
  openOnly: boolean,
  actor: WorkspaceActor,
  requestedPage = 1,
): Promise<ServiceRequestInboxDto> {
  const db = getDrizzleDatabaseClient();
  const [total, hasRequests] = await Promise.all([
    serviceRequestAccessService.countInbox(db, actor, openOnly),
    serviceRequestAccessService.hasRequests(db, actor),
  ]);
  const { offset, page } = resolveListPage({
    perPage: SERVICE_REQUEST_INBOX_PAGE_SIZE,
    requestedPage,
    total,
  });
  const items = await serviceRequestAccessService.list(db, actor, {
    openOnly,
    window: { limit: SERVICE_REQUEST_INBOX_PAGE_SIZE, offset },
  });
  return {
    items,
    hasRequests,
    page,
    perPage: SERVICE_REQUEST_INBOX_PAGE_SIZE,
    total,
  };
}
