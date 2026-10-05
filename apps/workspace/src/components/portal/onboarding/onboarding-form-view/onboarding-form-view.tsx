"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { OnboardingAnswerReadView } from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import type { Locale } from "@/config/i18n";
import { usePortalFileDownloads } from "@/hooks/portal/use-portal-file-downloads";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { OnboardingBookingCard } from "../onboarding-booking-card/onboarding-booking-card";
import { OnboardingFormEditor } from "../onboarding-form-editor/onboarding-form-editor";
import { OnboardingFormHeader } from "../onboarding-form-header/onboarding-form-header";
import styles from "./onboarding-form-view.module.css";

export type OnboardingFormViewProps = {
  /** Where the back link leads: the dashboard of the company. */
  backHref: string;
  /** The onboarding call once the team has reviewed the form; null until then and afterwards. */
  call?: PortalOnboardingCallDto | null;
  /** The company's chat page; null without `portal.messages.read`. */
  chatHref?: string | null;
  /** Upload files as well, which needs `portal.files.write` and never the owner view. */
  canUpload: boolean;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalOnboardingDictionary;
  customerId: string;
  /** File texts and errors for uploads, downloads and previews of attached files. */
  filesContent: PortalFilesDictionary;
  /** The company's files page, where files go once the form is completed; null without `portal.files.read`. */
  filesHref?: string | null;
  form: PortalOnboardingFormDto;
  locale: Locale;
};

/**
 * The onboarding of one project. Whoever may write right now gets the form, everyone else and
 * every later status the read view. Mount it with `key={customerId}`; the form itself is keyed by
 * its status, so a submission elsewhere replaces it instead of editing a locked form, and by a
 * revision that moves on once the form reported itself stale and the reload has arrived.
 */
export function OnboardingFormView({
  backHref,
  call = null,
  chatHref = null,
  canUpload,
  cockpitHref,
  content,
  customerId,
  filesContent,
  filesHref = null,
  form,
  locale,
}: OnboardingFormViewProps) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  // The editor keeps its own copy of the answers. Once it reports that the server holds something
  // else, the next form the reload brings starts it over; any other refresh leaves it alone.
  const [staleForm, setStaleForm] = useState<PortalOnboardingFormDto | null>(
    null,
  );
  const [revision, setRevision] = useState(0);
  if (staleForm !== null && staleForm !== form) {
    setStaleForm(null);
    setRevision(revision + 1);
  }
  const downloads = usePortalFileDownloads<FileAttachmentDto>(
    customerId,
    filesContent.errors,
  );
  const files = {
    loadPreviewAction: downloads.loadPreview,
    locale,
    onDownloadAction: downloads.download,
    texts: filesContent,
  };
  const ownerNoticeId = useId();
  const editable = form.editableBlockIds.length > 0;
  const state = form.status === OnboardingFormStatus.Open ? null : form.status;
  const downloadError = downloads.actionError ? (
    <p className={styles.error} role="alert">
      {downloads.actionError}
    </p>
  ) : null;

  return (
    <div className={styles.page} data-portal-fixed-head>
      {editable ? (
        <OnboardingFormEditor
          backHref={backHref}
          canUpload={canUpload}
          content={content}
          customerId={customerId}
          files={files}
          filesContent={filesContent}
          form={form}
          key={`${form.id}:${form.status}:${revision}`}
          locale={locale}
          notice={
            <>
              {downloadError}
              {state === OnboardingFormStatus.ChangesRequested ? (
                <div className={styles.state}>
                  <h2>{content.states.changes_requested.title}</h2>
                  <p>{content.states.changes_requested.editable}</p>
                </div>
              ) : null}
            </>
          }
          onAnnounceAction={setAnnouncement}
          onStaleAction={() => {
            setStaleForm(form);
            router.refresh();
          }}
        />
      ) : (
        <>
          <OnboardingFormHeader
            backHref={backHref}
            backLabel={content.page.back}
            backShortLabel={content.page.backShort}
            title={formatMessage(content.page.heading, {
              project: form.projectTitle,
            })}
          />
          <div className={styles.scroll}>
            {downloadError}
            <div className={styles.read}>
              <div className={styles.aside}>
                {state === OnboardingFormStatus.Submitted &&
                form.submittedAt ? (
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
                {state === OnboardingFormStatus.ChangesRequested ? (
                  <div className={styles.state}>
                    <h2>{content.states.changes_requested.title}</h2>
                    <p>{content.states.changes_requested.description}</p>
                  </div>
                ) : null}
                {state === OnboardingFormStatus.Completed &&
                form.completedAt ? (
                  <div className={styles.state}>
                    <h2>
                      {formatMessage(content.states.completed.title, {
                        date: formatMomentDay(form.completedAt, locale),
                      })}
                    </h2>
                    <p>{content.states.completed.description}</p>
                    <p>{content.states.completed.more}</p>
                    {filesHref || chatHref ? (
                      <ul className={styles.links}>
                        {filesHref ? (
                          <li>
                            <Link href={filesHref}>
                              {content.states.completed.filesLink}
                            </Link>
                          </li>
                        ) : null}
                        {chatHref ? (
                          <li>
                            <Link href={chatHref}>
                              {content.states.completed.chatLink}
                            </Link>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
                {call ? (
                  <OnboardingBookingCard
                    booking={call.booking}
                    chatHref={chatHref}
                    texts={content.call}
                  />
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
              </div>
              <section
                aria-labelledby="onboarding-answers"
                className={styles.answers}
              >
                <h2 className={styles.answersHeading} id="onboarding-answers">
                  {content.read.heading}
                </h2>
                <OnboardingAnswerReadView
                  answerFiles={form.answerFiles}
                  hiddenAnswerFiles={form.hiddenAnswerFiles}
                  answers={form.answers}
                  blocks={form.blocks}
                  emptyText={content.block.empty}
                  files={files}
                  groupEntries={form.groupEntries}
                  services={form.services}
                  servicesConfirmed={form.servicesConfirmed}
                  servicesNote={form.servicesNote}
                  texts={content.read}
                />
              </section>
            </div>
          </div>
        </>
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
