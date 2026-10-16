import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Widget } from "@invessiv/ui";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PORTAL_WIDGET_ACCENTS } from "@/common/constants/portal/portal-widget-accents";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import styles from "./portal-hours-widget.module.css";

export type PortalHoursWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["hours"];
  hours: PortalHoursDto;
  onOpenAction: () => void;
  /** The project chosen in the dashboard; it gets its own line when it has hours. */
  selectedProjectId: string | null;
};

/**
 * How much time is left, at a glance. Every statement is text: the bar only repeats "used of
 * purchased" and is hidden from assistive technology, and an overdrawn balance is named in words.
 */
export function PortalHoursWidget({
  content,
  hours,
  onOpenAction,
  selectedProjectId,
}: PortalHoursWidgetProps) {
  const { purchasedMinutes, remainingMinutes, usedMinutes } = hours.balance;
  const over = remainingMinutes < 0;
  const project = hours.projects.find(
    (candidate) => candidate.projectId === selectedProjectId,
  );

  return (
    <Widget
      accent={PORTAL_WIDGET_ACCENTS[PortalWidgetKey.Hours]}
      icon={faHourglassHalf}
      onOpenAction={onOpenAction}
      openLabel={content.open}
      openMode={WidgetOpenMode.Dialog}
      title={content.title}
    >
      <p className={styles.remaining} data-over={over ? "true" : undefined}>
        <span className={styles.value}>
          {formatDuration(Math.abs(remainingMinutes))}
        </span>{" "}
        {over ? content.over : content.remaining}
      </p>
      <p className={styles.used}>
        {formatMessage(content.used, {
          used: formatDuration(usedMinutes),
          purchased: formatDuration(purchasedMinutes),
        })}
      </p>
      <progress
        aria-hidden="true"
        className={styles.meter}
        data-over={over ? "true" : undefined}
        max={Math.max(purchasedMinutes, 1)}
        value={Math.min(
          Math.max(usedMinutes, 0),
          Math.max(purchasedMinutes, 1),
        )}
      />
      {project ? (
        <p className={styles.project}>
          {formatMessage(
            project.remainingMinutes < 0
              ? content.projectOver
              : content.project,
            { duration: formatDuration(Math.abs(project.remainingMinutes)) },
          )}
        </p>
      ) : null}
    </Widget>
  );
}
