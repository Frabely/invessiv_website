"use client";

import Link from "next/link";
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Widget } from "@invessiv/ui";
import { buildPortalOnboardingPath } from "@/common/patterns/portal/portal-onboarding-path";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./portal-onboarding-widget.module.css";

export type PortalOnboardingWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["onboarding"];
  customerId: string;
  /** The form the widget shows; `pickPortalOnboardingWidgetForm` chooses it. */
  form: PortalOnboardingFormSummaryDto;
  locale: Locale;
};

/**
 * Where the onboarding of the company stands and the way into the form. While it is the
 * customer's turn the widget shows the progress, afterwards when the form went out or was
 * completed. The progress is the one the form and the CRM show, computed by the same function.
 */
export function PortalOnboardingWidget({
  content,
  customerId,
  form,
  locale,
}: PortalOnboardingWidgetProps) {
  const yourTurn =
    form.status === OnboardingFormStatus.Open ||
    form.status === OnboardingFormStatus.ChangesRequested;
  const proceed = yourTurn && form.canEdit;
  const named = { project: form.projectTitle };
  // A change request asks for a few additions, not for filling in the form again.
  const amend =
    proceed && form.status === OnboardingFormStatus.ChangesRequested;
  const linkLabel = amend
    ? content.amend
    : proceed
      ? content.continue
      : content.view;
  const linkLabelNamed = amend
    ? content.amendNamed
    : proceed
      ? content.continueNamed
      : content.viewNamed;

  return (
    <Widget
      icon={faRocket}
      openMode={WidgetOpenMode.None}
      title={content.title}
    >
      <div
        className={styles.body}
        data-your-turn={proceed ? "true" : undefined}
      >
        <p className={styles.project}>{form.projectTitle}</p>
        {yourTurn ? (
          <>
            <p className={styles.turn}>
              {form.status === OnboardingFormStatus.Open
                ? content.turn.open
                : content.turn.changes_requested}
            </p>
            <OnboardingProgressBar
              progress={form.progress}
              texts={content.progress}
            />
          </>
        ) : null}
        {form.status === OnboardingFormStatus.Submitted && form.submittedAt ? (
          <p className={styles.state}>
            {formatMessage(content.submitted, {
              date: formatMomentDay(form.submittedAt, locale),
            })}
          </p>
        ) : null}
        {form.status === OnboardingFormStatus.Completed && form.completedAt ? (
          <p className={styles.state}>
            {formatMessage(content.completed, {
              date: formatMomentDay(form.completedAt, locale),
            })}
          </p>
        ) : null}
        <Link
          aria-label={formatMessage(linkLabelNamed, named)}
          className={styles.link}
          data-primary={proceed ? "true" : undefined}
          href={buildPortalOnboardingPath({
            locale,
            customerId,
            formId: form.id,
          })}
        >
          {linkLabel}
        </Link>
      </div>
    </Widget>
  );
}
