import {
  PORTAL_FILE_ORIGIN_VALUES,
  PortalFileOrigin,
} from "@invessiv/common/constants/portal/portal-file-origin";

/** An unknown or missing `?tab` falls back to what the team released. */
export function readPortalFilesTab(value: string | null): PortalFileOrigin {
  return (
    PORTAL_FILE_ORIGIN_VALUES.find((origin) => origin === value) ??
    PortalFileOrigin.FromUs
  );
}
