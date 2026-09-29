import type { PortalFileDto } from "./portal-file.dto";

export interface PortalFileListPageDto {
  /** Visible, ready entries of one tab, newest first. */
  files: PortalFileDto[];
  /** Number of visible entries of this tab across all pages. */
  total: number;
  /** One-based page that was returned. */
  page: number;
  /** Page size the server applied. */
  pageSize: number;
}
