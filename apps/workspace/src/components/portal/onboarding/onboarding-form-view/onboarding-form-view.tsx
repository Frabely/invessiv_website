"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { OnboardingAnswerReadView } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import type { Locale } from "@/config/i18n";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { OnboardingFormEditor } from "../onboarding-form-editor/onboarding-form-editor";
import styles from "./onboarding-form-view.module.css";

export type OnboardingFormViewProps = {
  /** Where the back link leads: the dashboard of the company. */
  backHref: string;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalOnboardingDictionary;
  customerId: string;
  form: PortalOnboardingFormDto;
  locale: Locale;
};

/**
 * The onboarding of one project. Whoever may write right now gets the form, everyone else and
 * every later status the read view. Mount it with `key={customerId}`; the form itself is keyed by
 * its status, so a submission elsewhere replaces it instead of editing a locked form.
 */
export function OnboardingFormView({
  backHref,
  cockpitHref,
  content,
  customerId,
  form,
  locale,
}: OnboardingFormViewProps) {
  const [announcement, setAnnouncement] = useState("");
  const ownerNoticeId = useId();
  const editable = form.editableBlockIds.length > 0;
  const state = form.status === OnboardingFormStatus.Open ? null : form.status;

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={backHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {content.page.back}
      </Link>
      <h1 className={styles.heading}>
        {formatMessage(content.page.heading, { project: form.projectTitle })}
      </h1>
      {editable ? (
        <OnboardingFormEditor
          content={content}
          customerId={customerId}
          form={form}
          key={`${form.id}:${form.status}`}
          locale={locale}
          onAnnounceAction={setAnnouncement}
        />
      ) : (
        <>
          {state === OnboardingFormStatus.Submitted && form.submittedAt ? (
            <div className={styles.state}>
              <h2>
                {formatMessage(content.states.submitted.title, {
                  date: formatMomentDay(form.submittedAt, locale),
                })}
                {form.submittedByName ? (
                  <span className={styles.by}>
                    {" "}
                    {formatMessage(content.states.submitted.by, {
                      name: form.submittedByName,
                    })}
                  </span>
                ) : null}
              </h2>
              <p>{content.states.submitted.description}</p>
            </div>
          ) : null}
          {state === OnboardingFormStatus.ChangesRequested ||
          state === OnboardingFormStatus.Completed ? (
            <div className={styles.state}>
              <h2>{content.states[state].title}</h2>
              <p>{content.states[state].description}</p>
            </div>
          ) : null}
          {cockpitHref ? (
            <PortalOwnerNotice
              cockpitHref={cockpitHref}
              hint={content.page.ownerHint}
              id={ownerNoticeId}
              linkLabel={content.page.ownerLink}
            />
          ) : state === null ? (
            <p className={styles.hint}>{content.page.readOnlyHint}</p>
          ) : null}
          <section
            aria-labelledby="onboarding-answers"
            className={styles.answers}
          >
            <h2 className={styles.answersHeading} id="onboarding-answers">
              {content.read.heading}
            </h2>
            <OnboardingAnswerReadView
              answerFiles={form.answerFiles}
              answers={form.answers}
              blocks={form.blocks}
              emptyText={content.block.empty}
              groupEntries={form.groupEntries}
              servicesConfirmed={form.servicesConfirmed}
              texts={content.read}
            />
          </section>
        </>
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
