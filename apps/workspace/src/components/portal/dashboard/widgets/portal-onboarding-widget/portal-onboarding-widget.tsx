"use client";

import Link from "next/link";
import { faRocket } from "@fortawesome/free-solid-svg-icons";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { Widget } from "@invessiv/ui";
import { buildPortalOnboardingPath } from "@/common/patterns/portal/portal-onboarding-path";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { OnboardingBookingCard } from "@/components/portal/onboarding/onboarding-booking-card/onboarding-booking-card";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./portal-onboarding-widget.module.css";

export type PortalOnboardingWidgetProps = {
  /** The call of this form once the team has reviewed it; null until then and afterwards. */
  call?: PortalOnboardingCallDto | null;
  /** The company's chat page for the hint without a link; null without `portal.messages.read`. */
  chatHref?: string | null;
  content: PortalDashboardDictionary["widgets"]["onboarding"];
  customerId: string;
  /** The released form of the selected project. */
  form: PortalOnboardingFormSummaryDto;
  locale: Locale;
};

/**
 * Where the onboarding of the company stands and the way into the form. While it is the
 * customer's turn the widget shows the progress, afterwards when the form went out or was
 * completed. The progress is the one the form and the CRM show, computed by the same function.
 */
export function PortalOnboardingWidget({
  call = null,
  chatHref = null,
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
          href={buildPortalHref(
            buildPortalOnboardingPath({
              locale,
              customerId,
              formId: form.id,
            }),
            "",
            { project: form.projectId },
          )}
        >
          {linkLabel}
        </Link>
        {call ? (
          <OnboardingBookingCard
            booking={call.booking}
            chatHref={chatHref}
            compact
            texts={content.call}
          />
        ) : null}
      </div>
    </Widget>
  );
}
