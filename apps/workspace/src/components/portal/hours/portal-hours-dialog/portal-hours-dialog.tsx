"use client";

import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import { Dialog, DialogSize } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalHoursDictionary } from "@/i18n/dictionaries/portal";
import { PortalHoursPurchases } from "../portal-hours-purchases/portal-hours-purchases";
import { PortalHoursSummary } from "../portal-hours-summary/portal-hours-summary";
import { PortalTimeEntryList } from "../portal-time-entry-list/portal-time-entry-list";
import styles from "./portal-hours-dialog.module.css";

export type PortalHoursDialogProps = {
  content: PortalHoursDictionary;
  customerId: string;
  /** Balance, projects and purchases as the dashboard already loaded them. */
  hours: PortalHoursDto;
  locale: Locale;
  onCloseAction: () => void;
};

/**
 * The company's hours as a dialog of the dashboard; there is no page of its own. Balance and
 * purchases come with the dashboard, the time entries are fetched when the dialog opens. Without
 * the detail right that section is absent altogether: no heading, no hint, no request. The portal
 * never writes hours, so there is no owner notice either.
 */
export function PortalHoursDialog({
  content,
  customerId,
  hours,
  locale,
  onCloseAction,
}: PortalHoursDialogProps) {
  return (
    <Dialog
      closeLabel={content.dialog.close}
      description={content.dialog.intro}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      title={content.dialog.title}
    >
      <div className={styles.body}>
        <PortalHoursSummary content={content.summary} hours={hours} />
        <PortalHoursPurchases
          content={content.purchases}
          locale={locale}
          purchases={hours.purchases}
        />
        {hours.canReadEntries ? (
          <PortalTimeEntryList
            content={content.entries}
            customerId={customerId}
            locale={locale}
            projects={hours.projects}
          />
        ) : null}
      </div>
    </Dialog>
  );
}
