"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PortalFeedbackPageState } from "@/common/constants/portal/portal-feedback-page-states";
import { portalFeedbackPageState } from "@/common/patterns/portal/portal-feedback-page-state";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackItemList } from "../feedback-item-list/feedback-item-list";
import { FeedbackQuotaNotice } from "../feedback-quota-notice/feedback-quota-notice";
import { FeedbackRoundHistory } from "../feedback-round-history/feedback-round-history";
import { FeedbackRoundIntro } from "../feedback-round-intro/feedback-round-intro";
import { FeedbackSheet } from "../feedback-sheet/feedback-sheet";
import styles from "./feedback-page-view.module.css";

export type FeedbackPageViewProps = {
  /** Uploading on a point needs `portal.files.write` on top of attaching. */
  canUpload: boolean;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFeedbackDictionary;
  customerId: string;
  dashboardHref: string;
  feedback: PortalProjectFeedbackDto;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  /** Chat page for the exhausted quota; null without chat access. */
  messagesHref: string | null;
};

/**
 * The feedback page of one project. Mount it with `key={customerId}`; the sheet itself is keyed by
 * round and status, so a submission elsewhere replaces it instead of editing a locked round.
 */
export function FeedbackPageView({
  canUpload,
  cockpitHref,
  content,
  customerId,
  dashboardHref,
  feedback,
  filesContent,
  locale,
  messagesHref,
}: FeedbackPageViewProps) {
  const [announcement, setAnnouncement] = useState("");
  const ownerNoticeId = useId();
  const state = portalFeedbackPageState(feedback);
  const round = feedback.activeRound;
  const approvedRound = feedback.history.find(
    (entry) => entry.roundNumber === feedback.quota.approvedRoundNumber,
  );

  const readOnlyItems =
    round &&
    state !== PortalFeedbackPageState.Sheet &&
    round.items.length > 0 ? (
      <FeedbackItemList
        content={content}
        customerId={customerId}
        filesContent={filesContent}
        items={round.items}
        locale={locale}
      />
    ) : null;

  function stateNotice(title: string, description: string) {
    return (
      <div className={styles.state}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={dashboardHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {content.page.back}
      </Link>
      <h1 className={styles.heading}>
        {formatMessage(content.page.heading, {
          project: feedback.projectTitle,
        })}
      </h1>
      {round ? (
        <FeedbackRoundIntro
          content={content}
          included={feedback.quota.included}
          locale={locale}
          round={round}
        />
      ) : null}
      {state === PortalFeedbackPageState.Sheet && round ? (
        <FeedbackSheet
          canAttach={feedback.canAttach}
          canUpload={canUpload}
          content={content}
          customerId={customerId}
          filesContent={filesContent}
          hasRemainingRounds={feedback.quota.remaining > 0}
          key={`${round.id}:${round.status}`}
          locale={locale}
          onAnnounceAction={setAnnouncement}
          projectId={feedback.projectId}
          round={round}
        />
      ) : null}
      {state === PortalFeedbackPageState.OpenReadOnly ? (
        <>
          {cockpitHref ? (
            <PortalOwnerNotice
              cockpitHref={cockpitHref}
              hint={content.page.ownerHint}
              id={ownerNoticeId}
              linkLabel={content.page.ownerLink}
            />
          ) : (
            <p className={styles.hint}>{content.page.readOnlyHint}</p>
          )}
          {readOnlyItems}
        </>
      ) : null}
      {state === PortalFeedbackPageState.Submitted ? (
        <>
          {stateNotice(
            content.states.submitted.title,
            content.states.submitted.description,
          )}
          {readOnlyItems}
        </>
      ) : null}
      {state === PortalFeedbackPageState.Working ? (
        <>
          {stateNotice(
            content.states.working.title,
            content.states.working.description,
          )}
          {readOnlyItems}
        </>
      ) : null}
      {state === PortalFeedbackPageState.None
        ? stateNotice(
            content.states.none.title,
            content.states.none.description,
          )
        : null}
      {state === PortalFeedbackPageState.Between
        ? stateNotice(
            content.states.between.title,
            content.states.between.description,
          )
        : null}
      {state === PortalFeedbackPageState.Approved
        ? stateNotice(
            approvedRound?.approvedAt
              ? formatMessage(content.states.approved.title, {
                  date: formatMomentDay(approvedRound.approvedAt, locale),
                })
              : content.status.approved,
            content.states.approved.description,
          )
        : null}
      {state === PortalFeedbackPageState.Exhausted ? (
        <FeedbackQuotaNotice
          content={content.states.exhausted}
          messagesHref={messagesHref}
        />
      ) : null}
      <FeedbackRoundHistory
        content={content}
        customerId={customerId}
        filesContent={filesContent}
        locale={locale}
        rounds={feedback.history}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
