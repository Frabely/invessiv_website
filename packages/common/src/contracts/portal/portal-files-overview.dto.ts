import type { PortalFileListPageDto } from "./portal-file-list-page.dto";

export interface PortalFilesOverviewDto {
  /** First page of what the team released, for the dashboard card. */
  fromUs: PortalFileListPageDto;
  /** First page of the customer's own uploads and links. */
  fromYou: PortalFileListPageDto;
}
