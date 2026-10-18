import type { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import {
  PORTAL_FILE_ORIGIN_FILTER_VALUES,
  PortalFileOriginFilter,
} from "@/common/constants/portal/portal-file-origin-filter";

/** An unknown or missing `?origin` shows everything. */
function read(value: string | null): PortalFileOriginFilter {
  return (
    PORTAL_FILE_ORIGIN_FILTER_VALUES.find((filter) => filter === value) ??
    PortalFileOriginFilter.All
  );
}

/** The origin the list asks the server for; null lists both. */
function originOf(filter: PortalFileOriginFilter): PortalFileOrigin | null {
  return filter === PortalFileOriginFilter.All ? null : filter;
}

export const portalFilesOriginFilter = { read, originOf } as const;
