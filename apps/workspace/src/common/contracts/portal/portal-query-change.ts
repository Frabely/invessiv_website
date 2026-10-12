import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

export type PortalQueryChange = {
  widget?: PortalWidgetKey | null;
  project?: string | null;
  /** `true` opens the dashboard's chat dock on arrival; `null` drops the request again. */
  chat?: true | null;
  /** Only ever cleared here; the hours dialog sets its own filter without a navigation. */
  hoursProject?: null;
  /** Catalog entry or `PORTAL_SERVICE_REQUEST_CUSTOM` the service request dialog opens on; `null` drops it. */
  service?: string | null;
};
