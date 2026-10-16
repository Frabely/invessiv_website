import { faKey, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, Widget } from "@invessiv/ui";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import styles from "./portal-credentials-widget.module.css";

export type PortalCredentialsWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["credentials"];
  /** Opens the form directly; null without the write right, e.g. in the owner view. */
  onAddAction: (() => void) | null;
  onOpenAction: () => void;
  summary: PortalCredentialsSummaryDto;
};

/**
 * The way to the credentials dialog. It shows a number and never a title, login name or value: the
 * dashboard is the screen most likely to be open next to someone else.
 */
export function PortalCredentialsWidget({
  content,
  onAddAction,
  onOpenAction,
  summary,
}: PortalCredentialsWidgetProps) {
  const { count } = summary;
  return (
    <Widget
      accent={PORTAL_WIDGET_ACCENTS[PortalWidgetKey.Credentials]}
      footer={
        onAddAction ? (
          <ButtonControl
            aria-label={content.add}
            disabled={!summary.configured}
            onClick={onAddAction}
            size={ButtonSize.Icon}
            title={content.add}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          </ButtonControl>
        ) : undefined
      }
      icon={faKey}
      onOpenAction={onOpenAction}
      openLabel={content.open}
      openMode={WidgetOpenMode.Dialog}
      title={content.title}
    >
      <p className={styles.count}>
        {count === 0
          ? content.empty
          : count === 1
            ? content.countOne
            : formatMessage(content.count, { count })}
      </p>
      <p className={styles.hint}>{content.hint}</p>
    </Widget>
  );
}
