import type { PortalFileOrigin } from "../../constants/portal/portal-file-origin";

export interface PortalFileListQueryDto {
  /** Tab to list; absent only for the chat's file picker, which offers both origins. */
  origin?: PortalFileOrigin;
  /** One-based; defaults to the first page. */
  page?: number;
  /** At most 100; defaults to 25. */
  pageSize?: number;
}
