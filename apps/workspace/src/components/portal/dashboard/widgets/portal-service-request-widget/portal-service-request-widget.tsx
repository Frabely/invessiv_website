import type { ReactNode } from "react";
import { faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { OPEN_SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Widget } from "@invessiv/ui";
import type { PortalServiceRequestWidgetDictionary } from "@/common/contracts/portal/portal-service-request-widget-dictionary";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import styles from "./portal-service-request-widget.module.css";

export type PortalServiceRequestWidgetProps = {
  content: PortalServiceRequestWidgetDictionary;
  onOpenAction: () => void;
  /** Explains the read-only owner view and links to the CRM; null for contacts. */
  ownerNotice: ReactNode;
  services: PortalServicesDto;
  /** Status wording of the request list, so card and dialog say the same. */
  statusLabels: Record<ServiceRequestStatus, string>;
};

/**
 * The way to the request dialog. Without open requests it only says what the card is for; with
 * some it adds how many are in progress and where the newest one stands, as text.
 */
export function PortalServiceRequestWidget({
  content,
  onOpenAction,
  ownerNotice,
  services,
  statusLabels,
}: PortalServiceRequestWidgetProps) {
  const openStatuses: readonly ServiceRequestStatus[] =
    OPEN_SERVICE_REQUEST_STATUS_VALUES;
  // The server sends the newest request first.
  const open = services.requests.filter((request) =>
    openStatuses.includes(request.status),
  );
  const latest = open[0];

  return (
    <Widget
      accent={PORTAL_WIDGET_ACCENTS[PortalWidgetKey.ServiceRequest]}
      footer={ownerNotice ?? undefined}
      icon={faWandMagicSparkles}
      onOpenAction={onOpenAction}
      openDisabled={ownerNotice !== null}
      openLabel={content.open}
      openMode={WidgetOpenMode.Dialog}
      title={content.title}
    >
      <p className={styles.benefit}>{content.benefit}</p>
      {latest ? (
        <div className={styles.progress}>
          <p className={styles.count}>
            {open.length === 1
              ? content.openRequestsOne
              : formatMessage(content.openRequests, { count: open.length })}
          </p>
          <p className={styles.latest}>
            {formatMessage(content.latest, {
              title: latest.title,
              status: statusLabels[latest.status],
            })}
          </p>
        </div>
      ) : null}
    </Widget>
  );
}
