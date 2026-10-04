import "server-only";

import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalProjectService } from "@/server/portal/services/portal-project-service";

export async function listPortalCurrentProjects(reader: PortalReader) {
  const summaries = await portalProjectService.listSelectableSummaries(reader);
  return portalProjectService
    .toCurrent(summaries)
    .map(({ id, title }) => ({ id, title }));
}
